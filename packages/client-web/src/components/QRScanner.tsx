import { useState, useCallback, useEffect, useRef } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import api from '../lib/api';

interface ScanResult {
  success: boolean;
  message: string;
  coupon?: any;
}

interface QRScannerProps {
  onScanSuccess?: (data: string) => void;
  onScanError?: (error: string) => void;
}

export default function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(true);
  const [lastScan, setLastScan] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [countdown, setCountdown] = useState(5);
  const countdownTimerRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // Auto-close modal after 5 seconds on success
  useEffect(() => {
    if (result?.success) {
      setCountdown(5);

      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleNextQRCode();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
        }
      };
    }
  }, [result]);

  const validateAndRedeem = async (code: string) => {
    try {
      // First validate
      const validateRes = await api.post('/redemption/validate', { code });

      if (!validateRes.data.valid) {
        setResult({
          success: false,
          message: validateRes.data.message,
          coupon: validateRes.data.coupon,
        });
        return;
      }

      // If valid, redeem
      const redeemRes = await api.post('/redemption/redeem', { code });

      setResult({
        success: redeemRes.data.success,
        message: redeemRes.data.message,
        coupon: redeemRes.data.coupon,
      });

      // Call success callback
      if (onScanSuccess) {
        onScanSuccess(code);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to process coupon';
      setResult({
        success: false,
        message: errorMessage,
      });

      // Call error callback
      if (onScanError) {
        onScanError(errorMessage);
      }
    }
  };

  const handleScan = useCallback((result: any) => {
    if (result && result[0]?.rawValue) {
      const scannedData = result[0].rawValue;

      // Prevent duplicate scans
      if (scannedData === lastScan) {
        return;
      }

      setLastScan(scannedData);

      // Stop scanning and validate
      setIsScanning(false);
      validateAndRedeem(scannedData);
    }
  }, [lastScan]);

  const handleError = useCallback((error: any) => {
    const errorMessage = error?.message || 'Failed to access camera';
    setError(errorMessage);
    if (onScanError) {
      onScanError(errorMessage);
    }
  }, [onScanError]);

  const toggleScanning = () => {
    setIsScanning(!isScanning);
    setError('');
  };

  const handleNextQRCode = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    setResult(null);
    setCountdown(5);
    // Auto-restart scanner
    setIsScanning(true);
  };

  const handleCloseModal = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    setResult(null);
    setCountdown(5);
  };

  return (
    <div className="min-h-screen bg-white p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            Scan Coupon
          </h1>
          <p className="text-sm text-gray-500">
            Position QR code in camera view
          </p>
        </div>

        {/* Scanner Container */}
        <div className="bg-gray-50 rounded-lg overflow-hidden mb-8">
          <div className="relative">
            {isScanning ? (
              <div className="relative">
                <Scanner
                  onScan={handleScan}
                  onError={handleError}
                  constraints={{
                    facingMode: 'environment',
                  }}
                  styles={{
                    container: {
                      width: '100%',
                      height: '400px',
                    },
                  }}
                />

                {/* Minimal Scanning Frame */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-56 h-56">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-black"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-black"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-black"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-black"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 border-2 border-gray-300 rounded-lg flex items-center justify-center">
                    <div className="w-8 h-8 border border-gray-400"></div>
                  </div>
                  <p className="text-gray-500 text-sm">Camera paused</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={toggleScanning}
                className={`px-5 py-2 text-sm font-medium transition-colors ${
                  isScanning
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-gray-900 text-white hover:bg-black'
                }`}
              >
                {isScanning ? 'Pause' : 'Start'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-gray-50 border-l-2 border-black">
            <p className="text-sm text-gray-900">{error}</p>
          </div>
        )}
      </div>

      {/* Result Modal */}
      {result && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all ${
            result.success ? 'border-4 border-green-500' : 'border-4 border-red-500'
          }`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 rounded-t-lg ${
              result.success ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div className="flex justify-between items-center">
                <h3 className={`text-xl font-bold ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.success ? 'Redemption Successful!' : 'Redemption Failed'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="mb-4">
                  {result.success ? (
                    <div className="relative inline-block">
                      <svg className="w-24 h-24 mx-auto text-green-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {result.success && (
                        <div className="absolute -top-2 -right-2 bg-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shadow-lg">
                          {countdown}
                        </div>
                      )}
                    </div>
                  ) : (
                    <svg className="w-24 h-24 mx-auto text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>

                <p className={`text-xl mb-6 font-medium ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message}
                </p>

                {result.coupon && (
                  <div className="bg-gray-50 rounded-lg p-5 mb-6 border border-gray-200">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">Coupon Code:</span>
                        <span className="font-mono text-lg font-bold text-gray-900">{result.coupon.code}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          result.coupon.status === 'AVAILABLE'
                            ? 'bg-green-100 text-green-800'
                            : result.coupon.status === 'USED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {result.coupon.status}
                        </span>
                      </div>
                      {result.coupon.campaign && (
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-700">Campaign:</span>
                          <span className="text-gray-900">{result.coupon.campaign.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {result.success && (
                  <p className="text-sm text-gray-600 mb-4">
                    Auto-closing in {countdown} second{countdown !== 1 ? 's' : ''}...
                  </p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleNextQRCode}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md ${
                    result.success
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Next QR Code
                  </div>
                </button>
                {!result.success && (
                  <button
                    onClick={handleCloseModal}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
