import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-white text-xl font-bold hover:text-gray-200 transition-colors">
            Coupon Management
          </Link>

          <div className="flex gap-6">
            {isAdmin && (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-300 hover:text-white transition-colors font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/campaigns"
                  className="text-gray-300 hover:text-white transition-colors font-medium"
                >
                  Campaigns
                </Link>
              </>
            )}
            <Link
              to="/scanner"
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              Scanner
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-300 text-sm">
              {user?.name} <span className="text-gray-400">({user?.role})</span>
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
