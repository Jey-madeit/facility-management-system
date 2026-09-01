const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const userController = require('../controllers/userController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// All routes require authentication and admin access
router.use(authMiddleware, adminMiddleware);

// Create new user
router.post(
  '/',
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
      .withMessage('Password must be between 6 and 128 characters'),
    body('role')
      .optional()
      .isIn(['user', 'admin'])
      .withMessage('Role must be either user or admin'),
    body('email')
      .optional({ values: 'falsy' })
      .trim()
      .isEmail()
      .withMessage('Invalid email format')
  ],
  userController.createUser
);

// Get all users
router.get('/', userController.getAllUsers);

// Get user statistics
router.get('/stats', userController.getUserStats);

// Get user by ID
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid user ID')],
  userController.getUserById
);

// Update user
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('username')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Username cannot be empty'),
    body('email')
      .optional({ values: 'falsy' })
      .trim()
      .isEmail()
      .withMessage('Invalid email format'),
    body('role')
      .optional()
      .isIn(['user', 'admin'])
      .withMessage('Role must be either user or admin')
  ],
  userController.updateUser
);

// Delete user
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid user ID')],
  userController.deleteUser
);

// Toggle user lock (lock/unlock account)
router.put(
  '/:id/lock',
  [param('id').isMongoId().withMessage('Invalid user ID')],
  userController.toggleLock
);

module.exports = router;
