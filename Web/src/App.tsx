import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register from './features/auth/pages/RegisterPage';
import Login from './features/auth/pages/LoginPage';
import Dashboard from './pages/Dashboard';
import WalletsPage from './features/wallets/pages/WalletsPage';
import { MainLayout } from './components/Layout/MainLayout';

import { AuthProvider } from './features/auth/hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallets"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <WalletsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/register" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
