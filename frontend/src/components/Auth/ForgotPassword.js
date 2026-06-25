import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../Common/Toast';
import Logo from '../Common/Logo';

const ForgotPassword = () => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setSubmitted(true);
        showToast(res.data.message, 'success');
        if (res.data.resetLink) {
          console.log('Dev reset link:', res.data.resetLink);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to send reset email', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gf-auth-page">
      <div className="gf-auth-bg" />
      <div className="gf-auth-card">
        <div className="gf-auth-brand-wrap">
          <Logo size="md" linkTo="/" />
        </div>
        <h2>Forgot Password</h2>
        <p className="gf-auth-subtitle">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        {submitted ? (
          <div className="gf-auth-success">
            <div className="gf-success-icon">✓</div>
            <p>Check your email for a password reset link. The link expires in 1 hour.</p>
            <Link to="/login" className="gf-btn-accent gf-btn-block">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="gf-auth-form">
            <div className="form-group">
              <label htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
            <button type="submit" className="gf-btn-accent gf-btn-block" disabled={loading}>
              {loading ? <span className="gf-spinner-inline" /> : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="gf-auth-footer">
          <Link to="/login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
