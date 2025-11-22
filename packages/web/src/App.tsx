import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { NewDashboard } from './pages/NewDashboard';
import { CompaniesPage } from './pages/CompaniesPage';
import { FuelWalletsPage } from './pages/FuelWalletsPage';
import { BoatWalletsPage } from './pages/BoatWalletsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ScannerPage } from './pages/ScannerPage';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <NewDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/companies"
        element={
          <ProtectedRoute adminOnly>
            <CompaniesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fuel-wallets"
        element={
          <ProtectedRoute adminOnly>
            <FuelWalletsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/boat-wallets"
        element={
          <ProtectedRoute adminOnly>
            <BoatWalletsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute adminOnly>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/scanner"
        element={
          <ProtectedRoute>
            <ScannerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
