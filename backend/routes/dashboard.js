const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

router.get('/summary', authMiddleware, adminMiddleware, dashboardController.getDashboardSummary);

module.exports = router;
