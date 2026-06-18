import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../Common/Toast';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState(() => localStorage.getItem('remembered_email') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('remembered_email'));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/auth/login', { email, password, rememberMe });
      if (res.data?.success) {
        if (rememberMe) {
          localStorage.setItem('remembered_email', email);
        } else {
          localStorage.removeItem('remembered_email');
        }
        if (onLogin) onLogin(res.data.user);
        showToast('Welcome back!', 'success');
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        showToast('Cannot connect to server. Make sure backend is running.', 'error');
      } else {
        showToast(err.response?.data?.error || 'Login failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gf-auth-page">
      <div className="gf-auth-bg" />
      <div className="gf-auth-card">
        <Link to="/" className="gf-auth-brand">GROW FINANCE</Link>
        <h2>Welcome Back</h2>
        <p className="gf-auth-subtitle">Sign in to your account to continue</p>

        <form onSubmit={handleSubmit} className="gf-auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>
          <div className="gf-auth-options">
            <label className="gf-checkbox">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember Me</span>
            </label>
            <Link to="/forgot-password" className="gf-link">Forgot Password?</Link>
          </div>
          <button type="submit" className="gf-btn-accent gf-btn-block" disabled={loading}>
            {loading ? <span className="gf-spinner-inline" /> : 'Login'}
          </button>
        </form>

        <div className="gf-auth-footer">
          <p>
            Don&apos;t have an account? <Link to="/signup">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
