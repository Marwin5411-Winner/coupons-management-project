import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';


export function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const navLinkClass = (path: string) =>
    isActive(path)
      ? "text-blue-600 font-semibold hover:text-blue-700 px-3 py-2 rounded-md transition-colors"
      : "text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md transition-colors";

  const mobileNavLinkClass = (path: string) =>
    isActive(path)
      ? "block text-blue-600 font-semibold hover:bg-blue-50 px-3 py-3 rounded-md transition-colors"
      : "block text-gray-700 hover:bg-gray-50 px-3 py-3 rounded-md transition-colors";

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="text-xl font-bold text-blue-600 flex-shrink-0">
              ⛽🚤 ระบบจัดการคูปอง
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-1">
              <Link
                to="/dashboard"
                className={navLinkClass('/dashboard')}
              >
                Dashboard
              </Link>
              {isAdmin && (
                <>
                  <Link
                    to="/companies"
                    className={navLinkClass('/companies')}
                  >
                    บริษัท
                  </Link>
                  <Link
                    to="/fuel-wallets"
                    className={navLinkClass('/fuel-wallets')}
                  >
                    คูปองน้ำมัน
                  </Link>
                  <Link
                    to="/boat-wallets"
                    className={navLinkClass('/boat-wallets')}
                  >
                    คูปองเรือ
                  </Link>
                  <Link
                    to="/reports"
                    className={navLinkClass('/reports')}
                  >
                    รายงาน
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Desktop User Info & Logout */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2">
              <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-gray-700 font-medium">{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden lg:inline">ออกจากระบบ</span>
            </button>
          </div>

          {/* Mobile Menu Button & User Info */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Mobile User Badge */}
            <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1.5">
              <svg className="w-4 h-4 text-gray-600 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-gray-700 font-medium text-sm max-w-[100px] truncate">{user?.name}</span>
            </div>

            {/* Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!mobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/dashboard"
              onClick={closeMobileMenu}
              className={mobileNavLinkClass('/dashboard')}
            >
              📊 Dashboard
            </Link>
            {isAdmin && (
              <>
                <Link
                  to="/companies"
                  onClick={closeMobileMenu}
                  className={mobileNavLinkClass('/companies')}
                >
                  🏢 บริษัท
                </Link>
                <Link
                  to="/fuel-wallets"
                  onClick={closeMobileMenu}
                  className={mobileNavLinkClass('/fuel-wallets')}
                >
                  ⛽ คูปองน้ำมัน
                </Link>
                <Link
                  to="/boat-wallets"
                  onClick={closeMobileMenu}
                  className={mobileNavLinkClass('/boat-wallets')}
                >
                  🚤 คูปองเรือ
                </Link>
                <Link
                  to="/reports"
                  onClick={closeMobileMenu}
                  className={mobileNavLinkClass('/reports')}
                >
                  📈 รายงาน
                </Link>
              </>
            )}

            {/* Mobile Logout Button */}
            <button
              onClick={() => {
                closeMobileMenu();
                handleLogout();
              }}
              className="w-full text-left block bg-red-500 text-white hover:bg-red-600 px-3 py-3 rounded-md transition-colors font-medium"
            >
              🚪 ออกจากระบบ
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
