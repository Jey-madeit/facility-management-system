const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const testRunController = require('../controllers/testRunController');

// Import test run data (admin only) - MUST be before /:id routes
router.post('/import', authMiddleware, adminMiddleware, testRunController.importTestRuns);

// Delete multiple test runs (admin only) - MUST be before /:id routes
router.post('/delete-multiple', authMiddleware, adminMiddleware, testRunController.deleteMultipleTestRuns);

// Export to Excel - MUST be before /:id routes
router.get('/export/excel', authMiddleware, testRunController.exportToExcel);

// Export report to Excel (admin only) - MUST be before /:id routes
router.get('/export/report', authMiddleware, adminMiddleware, testRunController.exportReportToExcel);

// Generate report (admin only) - MUST be before /:id routes
router.get('/report/generate', authMiddleware, adminMiddleware, testRunController.generateReport);

// Get all test runs
router.get('/', authMiddleware, testRunController.getTestRuns);

// Get single test run
router.get('/:id', authMiddleware, testRunController.getTestRunById);

// Create test run
router.post('/', authMiddleware, testRunController.createTestRun);

// Update test run
router.put('/:id', authMiddleware, testRunController.updateTestRun);

// Delete test run
router.delete('/:id', authMiddleware, adminMiddleware, testRunController.deleteTestRun);

module.exports = router;
