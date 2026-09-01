const BoosterPump = require('../models/BoosterPump');
const { exportBoosterPumpsToExcel, exportBoosterPumpsReportToExcel } = require('../utils/excelExport');

// Get booster pumps
exports.getBoosterPumps = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { userId: req.user.userId };
    const pumps = await BoosterPump.find(query).populate('userId', 'username');
    res.json(pumps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single booster pump
exports.getBoosterPumpById = async (req, res) => {
  try {
    const pump = await BoosterPump.findById(req.params.id).populate('userId', 'username');
    
    if (!pump) {
      return res.status(404).json({ message: 'Booster pump not found' });
    }

    if (req.user.role !== 'admin' && pump.userId._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(pump);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create booster pump entry
exports.createBoosterPump = async (req, res) => {
  try {
    const { startDate, pumpNo, startTime, status, stopDate, stopTime, failureAlarm, totalHours, comments } = req.body;

    const pump = new BoosterPump({
      userId: req.user.userId,
      startDate,
      pumpNo,
      startTime,
      status: status || 'operational',
      stopDate,
      stopTime,
      failureAlarm,
      totalHours,
      comments
    });

    await pump.save();
    res.status(201).json(pump);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update booster pump
exports.updateBoosterPump = async (req, res) => {
  try {
    let pump = await BoosterPump.findById(req.params.id);

    if (!pump) {
      return res.status(404).json({ message: 'Booster pump not found' });
    }

    if (req.user.role !== 'admin' && pump.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { startDate, pumpNo, startTime, status, stopDate, stopTime, failureAlarm, totalHours, comments } = req.body;
    if (startDate) pump.startDate = startDate;
    if (pumpNo) pump.pumpNo = pumpNo;
    if (startTime) pump.startTime = startTime;
    if (status) pump.status = status;
    if (stopDate !== undefined) pump.stopDate = stopDate;
    if (stopTime !== undefined) pump.stopTime = stopTime;
    if (failureAlarm !== undefined) pump.failureAlarm = failureAlarm;
    if (totalHours !== undefined) pump.totalHours = totalHours;
    if (comments !== undefined) pump.comments = comments;

    await pump.save();
    res.json(pump);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete booster pump
exports.deleteBoosterPump = async (req, res) => {
  try {
    const pump = await BoosterPump.findById(req.params.id);

    if (!pump) {
      return res.status(404).json({ message: 'Booster pump not found' });
    }

    if (req.user.role !== 'admin' && pump.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await BoosterPump.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booster pump deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export to Excel
exports.exportToExcel = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { userId: req.user.userId };
    const pumps = await BoosterPump.find(query).populate('userId', 'username');
    
    const buffer = exportBoosterPumpsToExcel(pumps);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=booster-pumps.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate report - admin only
exports.generateReport = async (req, res) => {
  try {
    const pumps = await BoosterPump.find().populate('userId', 'username');
    const report = {
      totalCount: pumps.length,
      byStatus: {},
      byUser: {},
      data: pumps
    };

    // Group by status
    pumps.forEach(pump => {
      report.byStatus[pump.status] = (report.byStatus[pump.status] || 0) + 1;
      const userName = pump.userId.username;
      if (!report.byUser[userName]) {
        report.byUser[userName] = [];
      }
      report.byUser[userName].push(pump);
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export report to Excel - admin only
exports.exportReportToExcel = async (req, res) => {
  try {
    const pumps = await BoosterPump.find().populate('userId', 'username');
    const report = {
      totalCount: pumps.length,
      byStatus: {},
      byUser: {},
      data: pumps
    };

    pumps.forEach(pump => {
      report.byStatus[pump.status] = (report.byStatus[pump.status] || 0) + 1;
      const userName = pump.userId.username;
      if (!report.byUser[userName]) {
        report.byUser[userName] = [];
      }
      report.byUser[userName].push(pump);
    });

    const buffer = exportBoosterPumpsReportToExcel(report);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=booster-pumps-report.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Import booster pump data - admin only
exports.importBoosterPumps = async (req, res) => {
  try {
    const { rows, assignedUserId } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'No data to import' });
    }

    if (!assignedUserId) {
      return res.status(400).json({ message: 'Assigned user ID is required' });
    }

    const importedDate = new Date();
    const importedBy = req.user.userId;
      const allowedStatuses = new Set(['operational', 'maintenance', 'offline', 'faulty']);
      const createdPumps = [];
      const errors = [];

      await Promise.all(rows.map(async (row, idx) => {
        try {
          // Normalize and coerce fields
          let startDate = null;
          if (row.startDate) {
            const d = new Date(row.startDate);
            startDate = !Number.isNaN(d.getTime()) ? d : null;
          }
          if (!startDate) startDate = new Date();

          const pumpNo = String(row.pumpNo ?? '').trim() || 'N/A';
          const startTime = String(row.startTime ?? '').trim() || 'N/A';

          let status = (String(row.status ?? '').trim() || 'operational').toLowerCase();
          if (!allowedStatuses.has(status)) status = 'operational';

          let stopDate = null;
          if (row.stopDate) {
            const sd = new Date(row.stopDate);
            stopDate = !Number.isNaN(sd.getTime()) ? sd : null;
          }

          const pumpData = {
            userId: assignedUserId,
            startDate,
            pumpNo,
            startTime,
            status,
            stopDate,
            stopTime: row.stopTime,
            failureAlarm: row.failureAlarm,
            totalHours: row.totalHours,
            comments: row.comments,
            importedDate,
            importedBy
          };

          const created = await BoosterPump.create(pumpData);
          createdPumps.push(created);
        } catch (err) {
          errors.push({ row: idx, message: err.message || 'Unknown error' });
        }
      }));

      const response = { message: `Imported ${createdPumps.length} entries`, data: createdPumps };
      if (errors.length) response.errors = errors;
      res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete multiple booster pumps - admin only
exports.deleteMultipleBoosterPumps = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No IDs provided for deletion' });
    }

    const result = await BoosterPump.deleteMany({ _id: { $in: ids } });

    res.json({
      message: `Successfully deleted ${result.deletedCount} booster pump entries`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
