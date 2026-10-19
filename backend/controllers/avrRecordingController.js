const AvrRecording = require('../models/AvrRecording');
const User = require('../models/User');
const { logAudit } = require('../utils/audit');
const { exportAvrRecordingsToExcel, exportAvrRecordingsReportToExcel } = require('../utils/excelExport');
const { softDeleteRecords } = require('../utils/softDelete');

const recordingFields = [
  'date',
  'time',
  'inputVoltageLL',
  'outputVoltageLL',
  'inputVoltageLN',
  'outputVoltageLN',
  'inputLoadCurrent',
  'outputLoadCurrent',
  'neutralN',
  'frequency',
  'inputKilowatt',
  'outputKilowatt',
  'inputKilovoltAmpere',
  'outputKilovoltAmpere',
  'inputPowerFactor',
  'outputPowerFactor',
  'inputKWh',
  'outputKWh',
  'inputkwh24Hrs',
  'outputkwh24Hrs',
  'anyAlarm',
  'comments'
];

const legacyFieldAliases = {
  inputPowerFactor: 'inputPF',
  outputPowerFactor: 'outputPF',
  inputKWh: 'inputKwh',
  outputKWh: 'outputKwh',
  inputkwh24Hrs: 'kwh24Hrs',
  outputkwh24Hrs: 'outputKwhDay'
};

const getRecordingData = (body) => recordingFields.reduce((data, field) => {
  const alias = legacyFieldAliases[field];
  if (body[field] !== undefined) data[field] = body[field];
  else if (alias && body[alias] !== undefined) data[field] = body[alias];
  return data;
}, {});

const respondToError = (res, error) => {
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ message: error.message });
  }
  return res.status(500).json({ message: error.message });
};

exports.getAvrRecordings = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { userId: req.user.userId };
    const recordings = await AvrRecording.find(query)
      .populate('userId', 'username')
      .sort({ date: -1, time: -1, createdAt: -1 });
    res.json(recordings);
  } catch (error) {
    respondToError(res, error);
  }
};

exports.createAvrRecording = async (req, res) => {
  try {
    const recording = new AvrRecording({
      ...getRecordingData(req.body),
      userId: req.user.userId
    });
    await recording.save();
    await logAudit({
      actorId: req.user.userId,
      actorName: req.user.username,
      action: 'created',
      targetType: 'AvrRecording',
      targetId: recording._id.toString(),
      details: { date: recording.date, time: recording.time },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.status(201).json(recording);
  } catch (error) {
    respondToError(res, error);
  }
};

exports.updateAvrRecording = async (req, res) => {
  try {
    const recording = await AvrRecording.findById(req.params.id);
    if (!recording) {
      return res.status(404).json({ message: 'AVR recording not found' });
    }
    if (req.user.role !== 'admin' && recording.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(recording, getRecordingData(req.body));
    await recording.save();
    await logAudit({
      actorId: req.user.userId,
      actorName: req.user.username,
      action: 'updated',
      targetType: 'AvrRecording',
      targetId: recording._id.toString(),
      details: { date: recording.date, time: recording.time },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.json(recording);
  } catch (error) {
    respondToError(res, error);
  }
};

exports.deleteAvrRecording = async (req, res) => {
  try {
    const recording = await AvrRecording.findById(req.params.id);
    if (!recording) {
      return res.status(404).json({ message: 'AVR recording not found' });
    }
    if (req.user.role !== 'admin' && recording.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { deletedRecords, recoverableCount } = await softDeleteRecords({
      model: AvrRecording,
      targetType: 'AvrRecording',
      filter: { _id: recording._id },
      actor: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.json({
      message: 'AVR system entry moved to the recoverable deleted records log',
      deletedCount: deletedRecords.length,
      recoverableCount
    });
  } catch (error) {
    respondToError(res, error);
  }
};

exports.generateReport = async (req, res) => {
  try {
    const recordings = await AvrRecording.find().populate('userId', 'username')
      .sort({ date: -1, time: -1, createdAt: -1 });
    const report = {
      totalCount: recordings.length,
      alarmCount: recordings.filter((recording) => String(recording.anyAlarm || '').trim()
        && !['none', 'no', 'n/a', '-'].includes(String(recording.anyAlarm).trim().toLowerCase())).length,
      byUser: {},
      data: recordings
    };
    recordings.forEach((recording) => {
      const username = recording.userId?.username || 'Unknown user';
      report.byUser[username] = (report.byUser[username] || 0) + 1;
    });
    res.json(report);
  } catch (error) {
    respondToError(res, error);
  }
};

exports.exportToExcel = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { userId: req.user.userId };
    const recordings = await AvrRecording.find(query).populate('userId', 'username')
      .sort({ date: -1, time: -1, createdAt: -1 });
    const buffer = exportAvrRecordingsToExcel(recordings);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=avr-recordings.xlsx');
    res.send(buffer);
  } catch (error) {
    respondToError(res, error);
  }
};

exports.exportReportToExcel = async (req, res) => {
  try {
    const recordings = await AvrRecording.find().populate('userId', 'username')
      .sort({ date: -1, time: -1, createdAt: -1 });
    const buffer = exportAvrRecordingsReportToExcel(recordings);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=avr-recordings-report.xlsx');
    res.send(buffer);
  } catch (error) {
    respondToError(res, error);
  }
};

exports.importAvrRecordings = async (req, res) => {
  try {
    const { rows, assignedUserId } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'No data to import' });
    }
    if (!assignedUserId) {
      return res.status(400).json({ message: 'Assigned user ID is required' });
    }
    const assignedUser = await User.findById(assignedUserId);
    if (!assignedUser) {
      return res.status(404).json({ message: 'Assigned user not found' });
    }

    const importedDate = new Date();
    const createdRecordings = [];
    const errors = [];
    for (const [index, row] of rows.entries()) {
      try {
        if (!row.date || !row.time) {
          throw new Error('Date and time are required');
        }
        const recording = new AvrRecording({
          ...getRecordingData(row),
          userId: assignedUserId,
          importedDate,
          importedBy: req.user.userId
        });
        await recording.save();
        createdRecordings.push(recording);
        await logAudit({
          actorId: req.user.userId,
          actorName: req.user.username,
          action: 'imported',
          targetType: 'AvrRecording',
          targetId: recording._id.toString(),
          details: { date: recording.date, time: recording.time, assignedUser: assignedUser.username },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
      } catch (error) {
        errors.push({ row: index + 1, message: error.message || 'Unable to import row' });
      }
    }

    const response = {
      message: `Imported ${createdRecordings.length} AVR recording(s)`,
      importedCount: createdRecordings.length,
      data: createdRecordings
    };
    if (errors.length) response.errors = errors;
    res.status(createdRecordings.length ? 201 : 400).json(response);
  } catch (error) {
    respondToError(res, error);
  }
};

exports.deleteMultipleAvrRecordings = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No IDs provided for deletion' });
    }
    const { deletedRecords, recoverableCount } = await softDeleteRecords({
      model: AvrRecording,
      targetType: 'AvrRecording',
      filter: { _id: { $in: ids } },
      actor: req.user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      bulk: true
    });
    res.json({
      message: `Successfully deleted ${deletedRecords.length} AVR system entries; ${recoverableCount} can be restored for three months`,
      deletedCount: deletedRecords.length,
      recoverableCount
    });
  } catch (error) {
    respondToError(res, error);
  }
};
