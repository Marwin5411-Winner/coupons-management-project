import QRScanner from './components/QRScanner'

function App() {
  const handleScanSuccess = (data: string) => {
    console.log('Scanned coupon code:', data);
  };

  const handleScanError = (error: string) => {
    console.error('Scanner error:', error);
  };

  return (
    <QRScanner
      onScanSuccess={handleScanSuccess}
      onScanError={handleScanError}
    />
  )
}

export default App
