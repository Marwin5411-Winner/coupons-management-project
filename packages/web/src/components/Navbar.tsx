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
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.brand}>
          Coupon Management
        </Link>

        <div style={styles.menu}>
          {isAdmin && (
            <>
              <Link to="/dashboard" style={styles.link}>
                Dashboard
              </Link>
              <Link to="/campaigns" style={styles.link}>
                Campaigns
              </Link>
            </>
          )}
          <Link to="/scanner" style={styles.link}>
            Scanner
          </Link>
        </div>

        <div style={styles.user}>
          <span style={styles.userName}>
            {user?.name} ({user?.role})
          </span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    backgroundColor: '#1f2937',
    padding: '1rem 0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    color: 'white',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    textDecoration: 'none',
  },
  menu: {
    display: 'flex',
    gap: '1.5rem',
  },
  link: {
    color: '#d1d5db',
    textDecoration: 'none',
    fontSize: '1rem',
    transition: 'color 0.2s',
  },
  user: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userName: {
    color: '#d1d5db',
    fontSize: '0.9rem',
  },
  logoutBtn: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
};
