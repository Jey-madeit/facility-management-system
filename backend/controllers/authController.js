const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { sendOTPEmail } = require('../utils/emailService');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables');
  process.exit(1);
}

// Utility function to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Utility function to set OTP expiry (10 minutes from now)
const getOTPExpiry = () => {
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + 10);
  return expiryTime;
};

// Resolve a user by username or email for password reset flows
const findUserByIdentifier = async (username, email) => {
  const normalizedUsername = typeof username === 'string' ? username.trim() : '';
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (normalizedUsername) {
    const userByUsername = await User.findOne({ username: normalizedUsername });
    if (userByUsername) {
      return userByUsername;
    }
  }

  if (normalizedEmail) {
    return await User.findOne({ email: normalizedEmail });
  }

  return null;
};

// Register
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, password, role } = req.body;

    // Check if user exists
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      username,
      password,
      role: role || 'user'
    });

    await user.save();

    // Create JWT token
    const payload = {
      userId: user._id,
      username: user.username,
      role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(403).json({ message: 'Account is locked. Contact your administrator.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment failed login attempts
      user.failedLoginAttempts += 1;

      // Lock account after 3 failed attempts
      if (user.failedLoginAttempts >= 3) {
        user.isLocked = true;
        await user.save();
        return res.status(403).json({ message: 'Account locked due to too many failed login attempts. Contact your administrator.' });
      }

      await user.save();
      const remaining = 3 - user.failedLoginAttempts;
      return res.status(400).json({ message: `Invalid username or password. ${remaining} attempt(s) remaining before account is locked.` });
    }

    // Reset failed attempts on successful login
    user.failedLoginAttempts = 0;
    await user.save();

    // Create JWT token
    const payload = {
      userId: user._id,
      username: user.username,
      role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Request OTP for Password Reset
exports.requestPasswordResetOTP = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, email } = req.body;

    const user = await findUserByIdentifier(username, email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has an email
    if (!user.email) {
      return res.status(400).json({ message: 'No email address on file. Please contact your administrator.' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    // Save OTP and expiry to database
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.otpVerified = false;
    await user.save();

    // Send OTP via email
    try {
      const emailResult = await sendOTPEmail(user.email, user.username, otp);
      
      // In test mode, include OTP in response for testing
      if (emailResult.testMode) {
        res.json({
          message: 'OTP has been generated (TEST MODE). Check the console or use the OTP below to test.',
          otp: otp,
          testMode: true
        });
      } else {
        res.json({
          message: 'OTP has been sent to your registered email. Please check your inbox and enter the code to reset your password.'
        });
      }
    } catch (emailError) {
      // If email fails, clear the OTP to force retry
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
      
      console.error('Email sending failed:', emailError.message);
      res.status(500).json({ 
        message: 'Failed to send OTP email. Please ensure your email is configured correctly and try again.' 
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify OTP and Reset Password
exports.verifyOTPAndResetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, email, otp, newPassword } = req.body;

    // Validate password length
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await findUserByIdentifier(username, email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if OTP exists
    if (!user.otp) {
      return res.status(400).json({ message: 'Please request OTP first' });
    }

    // Check if OTP has expired
    if (new Date() > user.otpExpiry) {
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    user.otp = null;
    user.otpExpiry = null;
    user.otpVerified = true;
    await user.save();

    res.json({ message: 'Password reset successfully. Please log in with your new password.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify OTP Only (without resetting password)
exports.verifyOTP = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, email, otp } = req.body;

    const user = await findUserByIdentifier(username, email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if OTP exists
    if (!user.otp) {
      return res.status(400).json({ message: 'Please request OTP first' });
    }

    // Check if OTP has expired
    if (new Date() > user.otpExpiry) {
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Legacy forgot password - NOW REQUIRES OTP VALIDATION FOR SECURITY
exports.forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, email, otp, newPassword } = req.body;

    // Validate password length
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await findUserByIdentifier(username, email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if OTP exists
    if (!user.otp) {
      return res.status(400).json({ message: 'Please request OTP first by calling /request-password-reset-otp' });
    }

    // Check if OTP has expired
    if (new Date() > user.otpExpiry) {
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    user.otp = null;
    user.otpExpiry = null;
    user.otpVerified = true;
    await user.save();

    res.json({ message: 'Password reset successfully. Please log in with your new password.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
