import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Scanner } from '@yudiel/react-qr-scanner';
import api from '../lib/api';

interface Wallet {
  id: string;
  type: 'FUEL' | 'BOAT';
  balance: number;
  company: {
    id: string;
    name: string;
  };
}

interface ScanResult {
  success: boolean;
  message: string;
  wallet?: Wallet;
  newBalance?: number;
}

interface QRScannerProps {
  onScanSuccess?: (data: string) => void;
  onScanError?: (error: string) => void;
}

export default function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  const { t } = useTranslation();
  const [isScanning, setIsScanning] = useState(true);
  const [lastScan, setLastScan] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [amount, setAmount] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const countdownTimerRef = useRef<number | null>(null);
  const isProcessing = useRef(false);

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

  const validateWallet = async (qrToken: string) => {
    try {
      setIsValidating(true);
      // Validate with a small amount to check existence and get details
      const validateRes = await api.post('/usage/validate', {
        qrDisplayToken: qrToken,
        qrToken,
      });

      if (!validateRes.data.valid) {
        setResult({
          success: false,
          message: validateRes.data.message || validateRes.data.error,
        });
        return;
      }

      // Wallet is valid, show input form
      setResult({
        success: false, // Not finished yet, just valid
        message: t('scanner.walletFound'),
        wallet: validateRes.data.wallet,
      });

      // Reset amount
      setAmount('');

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to process QR code';
      setResult({
        success: false,
        message: errorMessage,
      });

      if (onScanError) {
        onScanError(errorMessage);
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleRedeem = async () => {
    if (!result?.wallet || !amount) return;

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setError(t('scanner.errors.invalidAmount'));
      return;
    }

    try {
      setIsRedeeming(true);
      const redeemRes = await api.post('/usage/redeem', {
        walletId: result.wallet.id,
        amount: amountValue,
      });

      if (redeemRes.data.success) {
        setResult({
          success: true,
          message: redeemRes.data.message,
          wallet: result.wallet,
          newBalance: redeemRes.data.newBalance,
        });

        if (onScanSuccess) {
          onScanSuccess(lastScan);
        }
      } else {
        setResult({
          ...result,
          success: false,
          message: redeemRes.data.message || redeemRes.data.error,
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to redeem';
      setResult({
        ...result,
        success: false,
        message: errorMessage,
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleScan = useCallback((result: any) => {
    if (result && result[0]?.rawValue) {
      const scannedData = result[0].rawValue;

      // Prevent multiple scans while processing
      if (isProcessing.current) {
        return;
      }

      // Prevent duplicate scans
      if (scannedData === lastScan) {
        return;
      }

      setLastScan(scannedData);
      isProcessing.current = true;

      // Stop scanning and validate
      setIsScanning(false);
      validateWallet(scannedData);
    }
  }, [lastScan]);

  const handleError = useCallback((error: any) => {
    const errorMessage = error?.message || t('scanner.errors.cameraFailed');
    setError(errorMessage);
    if (onScanError) {
      onScanError(errorMessage);
    }
  }, [onScanError, t]);

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
    setLastScan('');
    setAmount('');
    isProcessing.current = false;
    setIsScanning(true);
  };

  const handleCloseModal = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    setResult(null);
    setCountdown(5);
    setLastScan('');
    setAmount('');
    isProcessing.current = false;
  };

  return (
    <div className="min-h-screen bg-white p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            {t('scanner.title')}
          </h1>
          <p className="text-sm text-gray-500">
            {t('scanner.subtitle')}
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

                {/* Validation Loading Overlay */}
                {isValidating && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
                    <div className="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-gray-900 font-medium">{t('scanner.modal.processing')}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 border-2 border-gray-300 rounded-lg flex items-center justify-center">
                    <div className="w-8 h-8 border border-gray-400"></div>
                  </div>
                  <p className="text-gray-500 text-sm">{t('scanner.errors.cameraPaused')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={toggleScanning}
                className={`px-5 py-2 text-sm font-medium transition-colors ${isScanning
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-gray-900 text-white hover:bg-black'
                  }`}
              >
                {isScanning ? t('scanner.pauseButton') : t('scanner.startButton')}
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
          <div className={`bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all ${result.success ? 'border-4 border-green-500' : result.wallet ? 'border-4 border-blue-500' : 'border-4 border-red-500'
            }`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 rounded-t-lg ${result.success ? 'bg-green-50' : result.wallet ? 'bg-blue-50' : 'bg-red-50'
              }`}>
              <div className="flex justify-between items-center">
                <h3 className={`text-xl font-bold ${result.success ? 'text-green-800' : result.wallet ? 'text-blue-800' : 'text-red-800'
                  }`}>
                  {result.success
                    ? t('scanner.modal.success')
                    : result.wallet
                      ? t('scanner.modal.confirm')
                      : t('scanner.modal.failed')}
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

                {/* Status Icon */}
                <div className="mb-4">
                  {result.success ? (
                    <div className="relative inline-block">
                      <svg className="w-24 h-24 mx-auto text-green-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute -top-2 -right-2 bg-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shadow-lg">
                        {countdown}
                      </div>
                    </div>
                  ) : result.wallet ? (
                    <svg className="w-24 h-24 mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  ) : (
                    <svg className="w-24 h-24 mx-auto text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>

                <p className={`text-xl mb-6 font-medium ${result.success ? 'text-green-700' : result.wallet ? 'text-blue-700' : 'text-red-700'
                  }`}>
                  {result.message}
                </p>

                {/* Wallet Info */}
                {result.wallet && (
                  <div className="bg-gray-50 rounded-lg p-5 mb-6 border border-gray-200 text-left">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">{t('scanner.modal.company')}</span>
                        <span className="font-bold text-gray-900">{result.wallet.company.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">{t('scanner.modal.type')}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${result.wallet.type === 'FUEL'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                          }`}>
                          {result.wallet.type}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">{t('scanner.modal.balance')}</span>
                        <span className="font-mono text-lg font-bold text-gray-900">
                          {result.newBalance !== undefined ? result.newBalance : result.wallet.balance}
                          <span className="text-sm font-normal text-gray-500 ml-1">
                            {result.wallet.type === 'FUEL' ? 'L' : 'Trips'}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Amount Input (Only if not success yet) */}
                    {!result.success && (
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          {t('scanner.modal.amountToDeduct')} ({result.wallet.type === 'FUEL' ? 'Liters' : 'Trips'})
                        </label>

                        {result.wallet.type === 'FUEL' ? (
                          // Fuel Selection Buttons
                          <div className="grid grid-cols-2 gap-3">
                            {[25, 50, 75, 100].map((liters) => (
                              <button
                                key={liters}
                                onClick={() => setAmount(liters.toString())}
                                className={`px-6 py-4 rounded-lg border-2 font-semibold text-lg transition-all ${amount === liters.toString()
                                    ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-md'
                                    : 'border-gray-300 text-gray-700 hover:border-orange-300 hover:bg-orange-50'
                                  }`}
                              >
                                {liters} ลิตร
                              </button>
                            ))}
                          </div>
                        ) : (
                          // Regular Number Input for BOAT
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-0 text-lg"
                            placeholder="0.00"
                            autoFocus
                            min="0.01"
                            step="0.01"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {result.success && (
                  <p className="text-sm text-gray-600 mb-4">
                    {t('scanner.modal.autoClosing', { count: countdown })}
                  </p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3">
                {result.success ? (
                  <button
                    onClick={handleNextQRCode}
                    className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md bg-green-600 hover:bg-green-700 text-white"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {t('scanner.modal.nextQR')}
                    </div>
                  </button>
                ) : result.wallet ? (
                  <div className="flex-1 flex gap-3">
                    <button
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      {t('scanner.modal.cancel')}
                    </button>
                    <button
                      onClick={handleRedeem}
                      disabled={isRedeeming || !amount || parseFloat(amount) <= 0}
                      className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all shadow-md text-white ${isRedeeming || !amount || parseFloat(amount) <= 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105'
                        }`}
                    >
                      {isRedeeming ? t('scanner.modal.processing') : t('scanner.modal.confirm')}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    {t('scanner.modal.close')}
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
