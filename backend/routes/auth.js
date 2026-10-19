const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// Current user
router.get('/me', authMiddleware, authController.getCurrentUser);

// Logout
router.post('/logout', authMiddleware, authController.logout);

// Register route
router.post(
  '/register',
  [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('password')
      .isLength({ min: 6, max: 128 })
      .withMessage('Password must be between 6 and 128 characters')
  ],
  authController.register
);

// Login route
router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  authController.login
);

// Forgot password route (legacy - NOW REQUIRES OTP)
router.post(
  '/forgot-password',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('otp').trim().notEmpty().withMessage('OTP is required'),
    body('newPassword')
      .isLength({ min: 6, max: 128 })
      .withMessage('New password must be between 6 and 128 characters')
  ],
  authController.forgotPassword
);

// Request OTP for password reset
router.post(
  '/request-password-reset-otp',
  [
    body('username').optional().trim(),
    body('email').optional().trim().isEmail().withMessage('Invalid email format')
  ],
  authController.requestPasswordResetOTP
);

// Verify OTP Only (without resetting password)
router.post(
  '/verify-otp',
  [
    body('username').optional().trim(),
    body('email').optional().trim().isEmail().withMessage('Invalid email format'),
    body('otp').trim().notEmpty().withMessage('OTP is required')
  ],
  authController.verifyOTP
);

// Verify OTP and reset password
router.post(
  '/verify-otp-and-reset-password',
  [
    body('username').optional().trim(),
    body('email').optional().trim().isEmail().withMessage('Invalid email format'),
    body('otp').trim().notEmpty().withMessage('OTP is required'),
    body('newPassword')
      .isLength({ min: 6, max: 128 })
      .withMessage('New password must be between 6 and 128 characters')
  ],
  authController.verifyOTPAndResetPassword
);

module.exports = router;
