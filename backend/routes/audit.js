const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const auditController = require('../controllers/auditController');
const deletedRecordController = require('../controllers/deletedRecordController');

router.get('/', authMiddleware, adminMiddleware, auditController.getAuditLogs);
router.get('/deleted', authMiddleware, adminMiddleware, deletedRecordController.getDeletedRecords);
router.post('/deleted/:id/restore', authMiddleware, adminMiddleware, deletedRecordController.restoreDeletedRecord);
router.get('/entity/:targetType/:targetId', authMiddleware, auditController.getAuditTrailForEntity);

module.exports = router;
