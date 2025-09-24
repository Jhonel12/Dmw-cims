import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import OFWList from './pages/OFWList';
import AddOFW from './pages/AddOFW';
import Reports from './pages/Reports';
import ClientProfile from './pages/ClientProfile';
import Login from './pages/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AlertDialogProvider } from './contexts/AlertDialogContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <AlertDialogProvider>
        <ToastProvider>
          <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/ofw-list" element={
              <ProtectedRoute>
                <Layout>
                  <OFWList />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/add-ofw" element={
              <ProtectedRoute>
                <Layout>
                  <AddOFW />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/client-profile" element={
              <ProtectedRoute>
                <Layout>
                  <ClientProfile />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <div className="p-6"><h1 className="text-2xl font-bold">Settings</h1><p>Settings page coming soon...</p></div>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
          </Router>
        </ToastProvider>
      </AlertDialogProvider>
    </AuthProvider>
  );
}

export default App;