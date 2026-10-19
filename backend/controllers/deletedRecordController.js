const AvrRecording = require('../models/AvrRecording');
const BoosterPump = require('../models/BoosterPump');
const DailyInspection = require('../models/DailyInspection');
const DeletedRecord = require('../models/DeletedRecord');
const TestRun = require('../models/TestRun');
const { getRecordSummary } = require('../utils/softDelete');
const { logAudit } = require('../utils/audit');

const recordModels = {
  TestRun,
  BoosterPump,
  DailyInspection,
  AvrRecording
};

const recordLabels = {
  TestRun: 'Generator Test Run',
  BoosterPump: 'Booster Pump',
  DailyInspection: 'Daily Inspection',
  AvrRecording: 'AVR System'
};

exports.getDeletedRecords = async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(requestedLimit, 200)) : 100;
    const records = await DeletedRecord.find({ expiresAt: { $gt: new Date() } })
      .sort({ deletedAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      records: records.map((entry) => ({
        _id: entry._id,
        targetType: entry.targetType,
        targetLabel: recordLabels[entry.targetType] || entry.targetType,
        originalId: entry.originalId,
        deletedByName: entry.deletedByName,
        deletedAt: entry.deletedAt,
        expiresAt: entry.expiresAt,
        summary: getRecordSummary(entry.targetType, entry.record)
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.restoreDeletedRecord = async (req, res) => {
  try {
    const deletedRecord = await DeletedRecord.findById(req.params.id);
    if (!deletedRecord) {
      return res.status(404).json({ message: 'Deleted record was not found or its recovery period has ended.' });
    }
    if (deletedRecord.expiresAt <= new Date()) {
      await deletedRecord.deleteOne();
      return res.status(410).json({ message: 'The recovery period for this record has ended.' });
    }

    const model = recordModels[deletedRecord.targetType];
    if (!model) {
      return res.status(400).json({ message: 'This record type cannot be restored.' });
    }

    let restored;
    try {
      [restored] = await model.create([deletedRecord.record]);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ message: 'A record with this ID already exists and cannot be restored.' });
      }
      throw error;
    }

    await deletedRecord.deleteOne();
    await logAudit({
      actorId: req.user.userId,
      actorName: req.user.username,
      action: 'restored',
      targetType: deletedRecord.targetType,
      targetId: deletedRecord.originalId,
      details: getRecordSummary(deletedRecord.targetType, restored),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      message: `${recordLabels[deletedRecord.targetType]} restored successfully.`,
      targetType: deletedRecord.targetType,
      targetId: deletedRecord.originalId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
