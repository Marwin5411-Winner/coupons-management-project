import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';


export function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="text-xl font-bold text-blue-600">
              ⛽🚤 ระบบจัดการคูปอง
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link
                to="/dashboard"
                className={isActive('/dashboard')
                  ? "text-gray-900 font-medium hover:text-blue-600 px-3 py-2 rounded-md"
                  : "text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md"}
              >
                Dashboard
              </Link>
              {isAdmin && (
                <>
                  <Link
                    to="/companies"
                    className={isActive('/companies')
                      ? "text-gray-900 font-medium hover:text-blue-600 px-3 py-2 rounded-md"
                      : "text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md"}
                  >
                    บริษัท
                  </Link>
                  <Link
                    to="/fuel-wallets"
                    className={isActive('/fuel-wallets')
                      ? "text-gray-900 font-medium hover:text-blue-600 px-3 py-2 rounded-md"
                      : "text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md"}
                  >
                    คูปองน้ำมัน
                  </Link>
                  <Link
                    to="/boat-wallets"
                    className={isActive('/boat-wallets')
                      ? "text-gray-900 font-medium hover:text-blue-600 px-3 py-2 rounded-md"
                      : "text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md"}
                  >
                    คูปองเรือ
                  </Link>
                  <Link
                    to="/reports"
                    className={isActive('/reports')
                      ? "text-gray-900 font-medium hover:text-blue-600 px-3 py-2 rounded-md"
                      : "text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md"}
                  >
                    รายงาน
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">

            <span className="text-gray-700">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
