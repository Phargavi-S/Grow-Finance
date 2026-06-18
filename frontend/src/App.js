import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard/Dashboard';
import Customers from './components/Customers/Customers';
import Vendors from './components/Vendors/Vendors';
import Items from './components/Items/Items';
import Invoices from './components/Invoices/Invoices';
import PurchaseOrdersDashboard from './components/PurchaseOrders/PurchaseOrdersDashboard';
import PurchaseOrderForm from './components/PurchaseOrders/PurchaseOrderForm';
import ProtectedRoute from './components/Common/ProtectedRoute';
import RecurringPage from './components/Recurring/RecurringPage';
import { ToastProvider } from './components/Common/Toast';
import './App.css';
import './styles/grow-finance.css';

axios.defaults.withCredentials = true;
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const publicPaths = ['/', '/login', '/signup', '/forgot-password'];
    const isPublic = publicPaths.some((p) => window.location.pathname === p)
      || window.location.pathname.startsWith('/reset-password');
    if (error.response?.status === 401 && !isPublic) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const PublicOnlyRoute = ({ isAuthenticated, children }) => {
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [serverError, setServerError] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setServerError(false);
        const response = await axios.get('/auth/check');
        if (response.data.authenticated) {
          setIsAuthenticated(true);
          setUser(response.data.user);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);

        if (error.code === 'ERR_NETWORK') {
          setServerError(true);
        }
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    setServerError(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading GROW FINANCE...</p>
      </div>
    );
  }

  if (serverError) {
    return (
      <div className="loading-container">
        <div className="error-message" style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto', background: 'rgba(255,255,255,0.05)', padding: '32px', borderRadius: '12px' }}>
          <h2 style={{ color: '#b2ff59', marginBottom: '12px' }}>Server Connection Error</h2>
          <p>Cannot connect to the backend server.</p>
          <p style={{ fontSize: '14px', marginTop: '10px', color: '#8b9cb8' }}>
            Make sure backend is running:<br />
            <code style={{ color: '#b2ff59' }}>cd backend && npm run dev</code>
          </p>
          <button
            onClick={() => window.location.reload()}
            className="gf-btn-accent"
            style={{ marginTop: '20px' }}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={
            <PublicOnlyRoute isAuthenticated={isAuthenticated}>
              <Landing />
            </PublicOnlyRoute>
          } />
          <Route path="/login" element={
            <PublicOnlyRoute isAuthenticated={isAuthenticated}>
              <Login onLogin={handleLogin} />
            </PublicOnlyRoute>
          } />
          <Route path="/signup" element={
            <PublicOnlyRoute isAuthenticated={isAuthenticated}>
              <SignUp />
            </PublicOnlyRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicOnlyRoute isAuthenticated={isAuthenticated}>
              <ForgotPassword />
            </PublicOnlyRoute>
          } />
          <Route path="/reset-password/:token" element={
            <PublicOnlyRoute isAuthenticated={isAuthenticated}>
              <ResetPassword />
            </PublicOnlyRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Dashboard onLogout={handleLogout} user={user} />
            </ProtectedRoute>
          } />
          <Route path="/customers" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Customers onLogout={handleLogout} user={user} />
            </ProtectedRoute>
          } />
          <Route path="/vendors" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Vendors onLogout={handleLogout} user={user} />
            </ProtectedRoute>
          } />
          <Route path="/items" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Items onLogout={handleLogout} user={user} />
            </ProtectedRoute>
          } />
          <Route path="/invoices" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Invoices onLogout={handleLogout} user={user} />
            </ProtectedRoute>
          } />
          <Route path="/recurring" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <RecurringPage onLogout={handleLogout} user={user} />
            </ProtectedRoute>
          } />
          <Route path="/purchase-orders" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <PurchaseOrdersDashboard onLogout={handleLogout} user={user} />
            </ProtectedRoute>
          } />
          <Route path="/purchase-orders/new" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <PurchaseOrderForm onLogout={handleLogout} user={user} />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
