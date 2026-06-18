const express = require('express');
const {
  signup,
  login,
  logout,
  checkAuth,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  changePassword
} = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/signup', signup);
router.post('/register', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/check', checkAuth);
router.get('/me', authMiddleware, getCurrentUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/change-password', authMiddleware, changePassword);

module.exports = router;
