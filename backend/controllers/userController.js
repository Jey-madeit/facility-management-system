const User = require('../models/User');
const { validationResult } = require('express-validator');
const { logAudit } = require('../utils/audit');

// Create new user (admin only)
exports.createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, password, role, email } = req.body;

    // Check if user exists
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      username,
      password,
      role: role || 'user',
      email: email || undefined
    });

    await user.save();
    await logAudit({
      actorId: req.user.userId,
      actorName: req.user.username,
      action: 'created',
      targetType: 'User',
      targetId: user._id.toString(),
      details: { username: user.username, role: user.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json({
      message: 'Users retrieved successfully',
      users
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle user lock status (lock/unlock)
exports.toggleLock = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from locking themselves
    if (userId === req.user.userId) {
      return res.status(400).json({ message: 'Cannot lock your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Toggle lock status
    user.isLocked = !user.isLocked;
    if (!user.isLocked) {
      // Reset failed attempts when unlocking
      user.failedLoginAttempts = 0;
    }

    await user.save();
    await logAudit({
      actorId: req.user.userId,
      actorName: req.user.username,
      action: user.isLocked ? 'locked' : 'unlocked',
      targetType: 'User',
      targetId: user._id.toString(),
      details: { username: user.username },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      message: user.isLocked ? 'User account locked' : 'User account unlocked',
      user: {
        id: user._id,
        username: user.username,
        isLocked: user.isLocked,
        failedLoginAttempts: user.failedLoginAttempts
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      message: 'User retrieved successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, email, role } = req.body;
    const userId = req.params.id;

    // Check if user exists
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if username is being changed and if new username already exists
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    // Update fields
    if (username) user.username = username;
    if (email !== undefined) user.email = email;
    if (role) user.role = role;

    await user.save();
    await logAudit({
      actorId: req.user.userId,
      actorName: req.user.username,
      action: 'updated',
      targetType: 'User',
      targetId: user._id.toString(),
      details: { username: user.username, role: user.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (userId === req.user.userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(userId);
    await logAudit({
      actorId: req.user.userId,
      actorName: req.user.username,
      action: 'deleted',
      targetType: 'User',
      targetId: user._id.toString(),
      details: { username: user.username },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      message: 'User deleted successfully',
      user: {
        id: user._id,
        username: user.username
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset user password
exports.resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { newPassword } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();
    await logAudit({
      actorId: req.user.userId,
      actorName: req.user.username,
      action: 'password_reset',
      targetType: 'User',
      targetId: user._id.toString(),
      details: { username: user.username },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      message: 'Password reset successfully',
      user: {
        id: user._id,
        username: user.username
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });
    const regularUserCount = await User.countDocuments({ role: 'user' });
    const recentUsers = await User.find({}, '-password')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      message: 'User statistics retrieved successfully',
      stats: {
        totalUsers,
        adminCount,
        regularUserCount,
        recentUsers
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
