import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../Common/Toast';
import Logo from '../Common/Logo';
import PasswordInput from '../Common/PasswordInput';

const SignUp = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    fullName: '',
    businessName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!form.businessName.trim()) newErrors.businessName = 'Business name is required';
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!form.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      newErrors.password = 'Password must contain a letter and a number';
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await axios.post('/auth/signup', form);
      if (res.data?.success) {
        showToast('Account created! Redirecting to login...', 'success');
        setTimeout(() => navigate('/login'), 1400);
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gf-auth-page">
      <div className="gf-auth-bg" />
      <div className="gf-auth-card gf-auth-card-wide">
        <div className="gf-auth-brand-wrap">
          <Logo size="md" linkTo="/" />
        </div>
        <h2>Create Account</h2>
        <p className="gf-auth-subtitle">Start managing your finances today</p>

        <form onSubmit={handleSubmit} className="gf-auth-form">
          <div className="gf-form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={form.fullName} onChange={update('fullName')} placeholder="John Doe" required />
              {errors.fullName && <span className="gf-field-error">{errors.fullName}</span>}
            </div>
            <div className="form-group">
              <label>Business Name</label>
              <input type="text" value={form.businessName} onChange={update('businessName')} placeholder="Your Company Ltd." required />
              {errors.businessName && <span className="gf-field-error">{errors.businessName}</span>}
            </div>
          </div>
          <div className="gf-form-grid">
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={update('email')} placeholder="you@company.com" required />
              {errors.email && <span className="gf-field-error">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" value={form.phoneNumber} onChange={update('phoneNumber')} placeholder="+1 234 567 8900" required />
              {errors.phoneNumber && <span className="gf-field-error">{errors.phoneNumber}</span>}
            </div>
          </div>
          <div className="gf-form-grid">
            <div className="form-group">
              <label>Password</label>
              <PasswordInput
                value={form.password}
                onChange={update('password')}
                placeholder="Min. 8 characters"
                required
                autoComplete="new-password"
              />
              {errors.password && <span className="gf-field-error">{errors.password}</span>}
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <PasswordInput
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                placeholder="Confirm password"
                required
                autoComplete="new-password"
              />
              {errors.confirmPassword && <span className="gf-field-error">{errors.confirmPassword}</span>}
            </div>
          </div>
          <button type="submit" className="gf-btn-accent gf-btn-block" disabled={loading}>
            {loading ? <span className="gf-spinner-inline" /> : 'Create Account'}
          </button>
        </form>

        <div className="gf-auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
