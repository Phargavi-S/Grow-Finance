const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const SESSION_SHORT = 24 * 60 * 60 * 1000;
const SESSION_LONG = 30 * 24 * 60 * 60 * 1000;

const getEmailTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const setSessionUser = (req, user) => {
  req.session.userId = user._id;
  req.session.email = user.email;
  req.session.fullName = user.fullName;
  req.session.businessName = user.businessName;
  req.session.userRole = user.role;
};

const getSessionUser = (req) => ({
  id: req.session.userId,
  fullName: req.session.fullName,
  businessName: req.session.businessName,
  email: req.session.email,
  role: req.session.userRole,
  name: req.session.fullName
});

const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must contain at least one letter and one number';
  }
  return null;
};

const signup = async (req, res) => {
  try {
    const { fullName, businessName, email, phoneNumber, password, confirmPassword } = req.body;

    if (!fullName || !businessName || !email || !phoneNumber || !password || !confirmPassword) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'Passwords do not match' });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ success: false, error: passwordError });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists' });
    }

    const user = new User({
      fullName: fullName.trim(),
      businessName: businessName.trim(),
      email: email.toLowerCase().trim(),
      phoneNumber: phoneNumber.trim(),
      password,
      role: 'user'
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please sign in.'
    });
  } catch (error) {
    console.error('Signup error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, error: 'Account is disabled. Contact support.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    setSessionUser(req, user);

    req.session.cookie.maxAge = rememberMe ? SESSION_LONG : SESSION_SHORT;

    res.json({
      success: true,
      message: 'Login successful',
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logged out successfully' });
  });
};

const checkAuth = (req, res) => {
  if (req.session && req.session.userId) {
    res.json({
      success: true,
      authenticated: true,
      user: getSessionUser(req)
    });
  } else {
    res.json({ success: false, authenticated: false });
  }
};

const getCurrentUser = (req, res) => {
  if (req.session && req.session.userId) {
    res.json({
      success: true,
      user: getSessionUser(req)
    });
  } else {
    res.status(401).json({ success: false, error: 'Not authenticated' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a reset link has been sent.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

    const transporter = getEmailTransporter();

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"GROW FINANCE" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: 'Reset Your GROW FINANCE Password',
          html: `
            <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto;">
              <h2 style="color: #0a1324;">GROW FINANCE</h2>
              <p>Hello ${user.fullName},</p>
              <p>You requested a password reset. Click the link below to set a new password:</p>
              <a href="${resetLink}" style="display: inline-block; background: #0a1324; color: #b2ff59; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Reset Password</a>
              <p style="color: #666; font-size: 13px;">This link expires in 1 hour. If you did not request this, ignore this email.</p>
            </div>
          `
        });
      } catch (mailErr) {
        console.error('Email send error:', mailErr.message);
        console.log('Reset link (dev fallback):', resetLink);
      }
    } else {
      console.log('Email not configured. Reset link:', resetLink);
    }

    res.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
      ...(process.env.NODE_ENV !== 'production' && !transporter ? { resetLink } : {})
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'Passwords do not match' });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ success: false, error: passwordError });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful. You can now sign in.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ success: false, error: passwordError });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  signup,
  login,
  logout,
  checkAuth,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  changePassword
};
