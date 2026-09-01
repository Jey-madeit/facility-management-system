const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const boosterPumpController = require('../controllers/boosterPumpController');

// Import booster pump data (admin only) - MUST be before /:id routes
router.post('/import', authMiddleware, adminMiddleware, boosterPumpController.importBoosterPumps);

// Delete multiple booster pumps (admin only) - MUST be before /:id routes
router.post('/delete-multiple', authMiddleware, adminMiddleware, boosterPumpController.deleteMultipleBoosterPumps);

// Export to Excel - MUST be before /:id routes
router.get('/export/excel', authMiddleware, boosterPumpController.exportToExcel);

// Export report to Excel (admin only) - MUST be before /:id routes
router.get('/export/report', authMiddleware, adminMiddleware, boosterPumpController.exportReportToExcel);

// Generate report (admin only) - MUST be before /:id routes
router.get('/report/generate', authMiddleware, adminMiddleware, boosterPumpController.generateReport);

// Get all booster pumps
router.get('/', authMiddleware, boosterPumpController.getBoosterPumps);

// Get single booster pump
router.get('/:id', authMiddleware, boosterPumpController.getBoosterPumpById);

// Create booster pump
router.post('/', authMiddleware, boosterPumpController.createBoosterPump);

// Update booster pump
router.put('/:id', authMiddleware, boosterPumpController.updateBoosterPump);

// Delete booster pump
router.delete('/:id', authMiddleware, boosterPumpController.deleteBoosterPump);

module.exports = router;
