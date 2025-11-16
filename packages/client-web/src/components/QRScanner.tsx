import { useState, useCallback } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';

interface ScanResult {
  data: string;
  timestamp: Date;
}

interface QRScannerProps {
  onScanSuccess?: (data: string) => void;
  onScanError?: (error: string) => void;
}

export default function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(true);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [lastScan, setLastScan] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleScan = useCallback((result: any) => {
    if (result && result[0]?.rawValue) {
      const scannedData = result[0].rawValue;

      // Prevent duplicate scans
      if (scannedData === lastScan) {
        return;
      }

      setLastScan(scannedData);
      setShowSuccess(true);

      const scanResult: ScanResult = {
        data: scannedData,
        timestamp: new Date(),
      };

      setScanHistory(prev => [scanResult, ...prev].slice(0, 10)); // Keep last 10 scans

      // Call the success callback
      if (onScanSuccess) {
        onScanSuccess(scannedData);
      }

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }
  }, [lastScan, onScanSuccess]);

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

  const clearHistory = () => {
    setScanHistory([]);
    setLastScan('');
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

                {/* Success Message */}
                {showSuccess && (
                  <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 rounded text-sm">
                    Scanned
                  </div>
                )}
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

              {scanHistory.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="px-5 py-2 text-sm font-medium text-gray-700 hover:text-black transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-gray-50 border-l-2 border-black">
            <p className="text-sm text-gray-900">{error}</p>
          </div>
        )}

        {/* Last Scanned Coupon */}
        {lastScan && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-500 mb-3">
              Latest Scan
            </h2>
            <div className="bg-gray-50 p-4 rounded">
              <p className="font-mono text-sm text-gray-900 break-all">{lastScan}</p>
            </div>
          </div>
        )}

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-500">
                History
              </h2>
              <span className="text-xs text-gray-400">
                {scanHistory.length} {scanHistory.length === 1 ? 'scan' : 'scans'}
              </span>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {scanHistory.map((scan, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-3 rounded hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">
                      {scan.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-gray-700 break-all">
                    {scan.data}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
