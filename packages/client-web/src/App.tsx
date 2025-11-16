import QRScanner from './components/QRScanner'

function App() {
  const handleScanSuccess = (data: string) => {
    console.log('Scanned coupon data:', data);
    // Here you can add logic to validate the coupon
    // For example, make an API call to verify the coupon
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
