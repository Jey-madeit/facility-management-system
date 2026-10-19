const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const avrRecordingController = require('../controllers/avrRecordingController');

router.use(authMiddleware);
router.post('/import', adminMiddleware, avrRecordingController.importAvrRecordings);
router.post('/delete-multiple', adminMiddleware, avrRecordingController.deleteMultipleAvrRecordings);
router.get('/export/excel', avrRecordingController.exportToExcel);
router.get('/export/report', adminMiddleware, avrRecordingController.exportReportToExcel);
router.get('/report/generate', adminMiddleware, avrRecordingController.generateReport);
router.get('/', avrRecordingController.getAvrRecordings);
router.post('/', avrRecordingController.createAvrRecording);
router.put('/:id', avrRecordingController.updateAvrRecording);
router.delete('/:id', avrRecordingController.deleteAvrRecording);

module.exports = router;
