const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const auditController = require('../controllers/auditController');

router.get('/', authMiddleware, adminMiddleware, auditController.getAuditLogs);
router.get('/entity/:targetType/:targetId', authMiddleware, auditController.getAuditTrailForEntity);

module.exports = router;
