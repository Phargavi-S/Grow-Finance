import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../Common/Toast';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      newErrors.password = 'Password must contain a letter and a number';
    }
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await axios.post(`/auth/reset-password/${token}`, {
        password,
        confirmPassword
      });
      if (res.data.success) {
        showToast('Password reset successful!', 'success');
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to reset password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gf-auth-page">
      <div className="gf-auth-bg" />
      <div className="gf-auth-card">
        <Link to="/" className="gf-auth-brand">GROW FINANCE</Link>
        <h2>Reset Password</h2>
        <p className="gf-auth-subtitle">Enter your new password below.</p>

        <form onSubmit={handleSubmit} className="gf-auth-form">
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
            />
            {errors.password && <span className="gf-field-error">{errors.password}</span>}
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
            {errors.confirmPassword && <span className="gf-field-error">{errors.confirmPassword}</span>}
          </div>
          <button type="submit" className="gf-btn-accent gf-btn-block" disabled={loading}>
            {loading ? <span className="gf-spinner-inline" /> : 'Reset Password'}
          </button>
        </form>

        <div className="gf-auth-footer">
          <Link to="/login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
