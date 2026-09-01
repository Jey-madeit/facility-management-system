const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const dailyInspectionController = require('../controllers/dailyInspectionController');

// Import daily inspection data (admin only) - MUST be before /:id routes
router.post('/import', authMiddleware, adminMiddleware, dailyInspectionController.importDailyInspections);

// Delete multiple daily inspections (admin only) - MUST be before /:id routes
router.post('/delete-multiple', authMiddleware, adminMiddleware, dailyInspectionController.deleteMultipleDailyInspections);

// Submit daily inspection - MUST be before /:id routes
router.post('/submit', authMiddleware, dailyInspectionController.submitDailyInspection);

// Save draft inspection - MUST be before /:id routes
router.post('/draft/:id?', authMiddleware, dailyInspectionController.saveDraftInspection);

// Export to Excel - MUST be before /:id routes
router.get('/export/excel', authMiddleware, dailyInspectionController.exportToExcel);

// Export report to Excel (admin only) - MUST be before /:id routes
router.get('/export/report', authMiddleware, adminMiddleware, dailyInspectionController.exportReportToExcel);

// Generate report (admin only) - MUST be before /:id routes
router.get('/report/generate', authMiddleware, adminMiddleware, dailyInspectionController.generateReport);

// Get all daily inspections
router.get('/', authMiddleware, dailyInspectionController.getDailyInspections);

// Get single daily inspection
router.get('/:id', authMiddleware, dailyInspectionController.getDailyInspectionById);

// Delete daily inspection
router.delete('/:id', authMiddleware, adminMiddleware, dailyInspectionController.deleteDailyInspection);

module.exports = router;
