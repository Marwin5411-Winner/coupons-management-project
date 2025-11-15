import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../lib/api';
import { Navbar } from '../components/Navbar';

interface ScanResult {
  success: boolean;
  message: string;
  coupon?: any;
}

export function ScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [isScanning]);

  const startScanning = async () => {
    try {
      if (!isInitialized.current) {
        scannerRef.current = new Html5Qrcode('qr-reader');
        isInitialized.current = true;
      }

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      await scannerRef.current!.start(
        { facingMode: 'environment' },
        config,
        onScanSuccess,
        () => {}
      );

      setIsScanning(true);
      setResult(null);
    } catch (err) {
      console.error('Error starting scanner:', err);
      alert('Failed to start camera. Please ensure camera permissions are granted.');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    await stopScanning();
    await validateAndRedeem(decodedText);
  };

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
    } catch (error: any) {
      setResult({
        success: false,
        message: error.response?.data?.message || 'Failed to process coupon',
      });
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      await validateAndRedeem(manualCode.trim());
      setManualCode('');
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
            QR Code Scanner
          </h1>

          {/* Scanner Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
            <div className="flex flex-col items-center">
              <div id="qr-reader" className="w-full max-w-md mb-6"></div>

              <div className="flex gap-4">
                {!isScanning ? (
                  <button
                    onClick={startScanning}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Start Camera
                  </button>
                ) : (
                  <button
                    onClick={stopScanning}
                    className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                    Stop Camera
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gray-50 px-4 text-gray-600 font-medium">OR</span>
            </div>
          </div>

          {/* Manual Entry */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Enter Code Manually
            </h3>
            <form onSubmit={handleManualSubmit} className="flex gap-3">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter coupon code"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Validate
              </button>
            </form>
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-lg p-6 border-2 ${
              result.success
                ? 'bg-green-50 border-green-500'
                : 'bg-red-50 border-red-500'
            }`}>
              <div className="text-center">
                <div className="mb-4">
                  {result.success ? (
                    <svg className="w-16 h-16 mx-auto text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-16 h-16 mx-auto text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>

                <h3 className={`text-2xl font-bold mb-2 ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.success ? 'Success!' : 'Error'}
                </h3>

                <p className={`text-lg mb-4 ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message}
                </p>

                {result.coupon && (
                  <div className="bg-white rounded-lg p-4 mb-4 text-left max-w-md mx-auto border border-gray-200">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Code:</span>
                        <span className="font-mono text-gray-900">{result.coupon.code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Status:</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          result.coupon.status === 'AVAILABLE'
                            ? 'bg-green-100 text-green-800'
                            : result.coupon.status === 'USED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {result.coupon.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setResult(null)}
                  className="px-6 py-2.5 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
                >
                  Scan Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
