import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import QRScanner from './components/QRScanner';
import { LanguageSwitcher } from './components/LanguageSwitcher';

function App() {
  const { isAuthenticated, user, logout } = useAuth();

  const handleScanSuccess = (data: string) => {
    console.log('Scanned coupon code:', data);
  };

  const handleScanError = (error: string) => {
    console.error('Scanner error:', error);
  };

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="relative">
      {/* Logout Button & Language Switcher */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <LanguageSwitcher />
        <button
          onClick={logout}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-black transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {user?.name}
        </button>
      </div>

      <QRScanner
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
      />
    </div>
  );
}

export default App
