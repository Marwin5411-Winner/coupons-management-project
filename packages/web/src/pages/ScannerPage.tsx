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
      <div style={styles.container}>
        <h1 style={styles.title}>QR Code Scanner</h1>

        <div style={styles.scannerContainer}>
          <div id="qr-reader" style={{ width: '100%', maxWidth: '500px' }}></div>

          <div style={styles.controls}>
            {!isScanning ? (
              <button onClick={startScanning} style={styles.startBtn}>
                Start Scanner
              </button>
            ) : (
              <button onClick={stopScanning} style={styles.stopBtn}>
                Stop Scanner
              </button>
            )}
          </div>
        </div>

        <div style={styles.divider}>OR</div>

        <form onSubmit={handleManualSubmit} style={styles.manualForm}>
          <h3>Enter Code Manually</h3>
          <div style={styles.manualInput}>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Enter coupon code"
              style={styles.input}
            />
            <button type="submit" style={styles.submitBtn}>
              Validate
            </button>
          </div>
        </form>

        {result && (
          <div
            style={{
              ...styles.result,
              backgroundColor: result.success ? '#d1fae5' : '#fee2e2',
              borderColor: result.success ? '#10b981' : '#ef4444',
            }}
          >
            <h3 style={{
              color: result.success ? '#065f46' : '#991b1b',
              marginBottom: '1rem',
            }}>
              {result.success ? 'Success!' : 'Error'}
            </h3>
            <p style={{
              fontSize: '1.2rem',
              color: result.success ? '#065f46' : '#991b1b',
              marginBottom: '1rem',
            }}>
              {result.message}
            </p>
            {result.coupon && (
              <div style={styles.couponInfo}>
                <p><strong>Code:</strong> {result.coupon.code}</p>
                <p><strong>Status:</strong> {result.coupon.status}</p>
              </div>
            )}
            <button
              onClick={() => setResult(null)}
              style={styles.closeBtn}
            >
              Scan Another
            </button>
          </div>
        )}
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem 1rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: '2rem',
  },
  scannerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '2rem',
  },
  controls: {
    display: 'flex',
    gap: '1rem',
  },
  startBtn: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '1rem 2rem',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1.1rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  stopBtn: {
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '1rem 2rem',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1.1rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  divider: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '1.2rem',
    margin: '2rem 0',
    fontWeight: 'bold',
  },
  manualForm: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '0.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
  },
  manualInput: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  },
  input: {
    flex: 1,
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.25rem',
    fontSize: '1rem',
  },
  submitBtn: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
  },
  result: {
    padding: '2rem',
    borderRadius: '0.5rem',
    border: '2px solid',
    textAlign: 'center',
  },
  couponInfo: {
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '0.25rem',
    marginBottom: '1rem',
    textAlign: 'left',
  },
  closeBtn: {
    backgroundColor: '#374151',
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    fontSize: '1rem',
  },
};
