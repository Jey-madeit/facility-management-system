const TestRun = require('../models/TestRun');
const { exportTestRunsToExcel, exportReportToExcel } = require('../utils/excelExport');
const { logAudit } = require('../utils/audit');
const { validateAssetPayload } = require('../utils/validation');

// Get test runs - users see only their own, admins see all
exports.getTestRuns = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { userId: req.user.userId };
    const testRuns = await TestRun.find(query).populate('userId', 'username');
    res.json(testRuns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single test run
exports.getTestRunById = async (req, res) => {
  try {
    const testRun = await TestRun.findById(req.params.id).populate('userId', 'username');
    
    if (!testRun) {
      return res.status(404).json({ message: 'Test run not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && testRun.userId._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(testRun);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create test run
exports.createTestRun = async (req, res) => {
  try {
    const {
      testDate,
      testTime,
      stopTime,
      generatorSet,
      status,
      hourRun,
      engineTemperature,
      oilPressure,
      llVoltage,
      lnVoltage,
      loadCurrent,
      engineSpeed,
      engineFrequency,
      realPower,
      apparentPower,
      batteryVoltage,
      comments
    } = req.body;

    const assetValidation = validateAssetPayload({
      generatorSet,
      status,
      startDate: testDate,
      stopDate: testDate,
    });

    if (!assetValidation.valid) {
      return res.status(400).json({ message: assetValidation.errors.join('; ') });
    }

    const testRun = new TestRun({
      userId: req.user.userId,
      testDate,
      testTime,
      stopTime,
      generatorSet,
      status: status || 'operational',
      hourRun,
      engineTemperature,
      oilPressure,
      llVoltage,
      lnVoltage,
      loadCurrent,
      engineSpeed,
      engineFrequency,
      realPower,
      apparentPower,
      batteryVoltage,
      comments
    });

    await testRun.save();
    await logAudit({
      actorId: req.user.userId,
      actorName: req.user.username,
      action: 'created',
      targetType: 'TestRun',
      targetId: testRun._id.toString(),
      details: { generatorSet: testRun.generatorSet || 'N/A', status: testRun.status },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.status(201).json(testRun);
  } catch (error) {
    console.error('Error creating test run:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update test run
exports.updateTestRun = async (req, res) => {
  try {
    let testRun = await TestRun.findById(req.params.id);

    if (!testRun) {
      return res.status(404).json({ message: 'Test run not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && testRun.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const {
      testDate,
      testTime,
      stopTime,
      generatorSet,
      status,
      hourRun,
      engineTemperature,
      oilPressure,
      llVoltage,
      lnVoltage,
      loadCurrent,
      engineSpeed,
      engineFrequency,
      realPower,
      apparentPower,
      batteryVoltage,
      comments
    } = req.body;

    if (testDate !== undefined) testRun.testDate = testDate;
    if (testTime !== undefined) testRun.testTime = testTime;
    if (stopTime !== undefined) testRun.stopTime = stopTime;
    if (generatorSet !== undefined) testRun.generatorSet = generatorSet;
    if (status !== undefined) testRun.status = status;
    if (hourRun !== undefined) testRun.hourRun = hourRun;
    if (engineTemperature !== undefined) testRun.engineTemperature = engineTemperature;
    if (oilPressure !== undefined) testRun.oilPressure = oilPressure;
    if (llVoltage !== undefined) testRun.llVoltage = llVoltage;
    if (lnVoltage !== undefined) testRun.lnVoltage = lnVoltage;
    if (loadCurrent !== undefined) testRun.loadCurrent = loadCurrent;
    if (engineSpeed !== undefined) testRun.engineSpeed = engineSpeed;
    if (engineFrequency !== undefined) testRun.engineFrequency = engineFrequency;
    if (realPower !== undefined) testRun.realPower = realPower;
    if (apparentPower !== undefined) testRun.apparentPower = apparentPower;
    if (batteryVoltage !== undefined) testRun.batteryVoltage = batteryVoltage;
    if (comments !== undefined) testRun.comments = comments;

    const assetValidation = validateAssetPayload({
      generatorSet: testRun.generatorSet,
      status: testRun.status,
      startDate: testRun.testDate,
      stopDate: testRun.testDate,
    });

    if (!assetValidation.valid) {
      return res.status(400).json({ message: assetValidation.errors.join('; ') });
    }

    await testRun.save();
    await logAudit({
      actorId: req.user.userId,
      actorName: req.user.username,
      action: 'updated',
      targetType: 'TestRun',
      targetId: testRun._id.toString(),
      details: { generatorSet: testRun.generatorSet || 'N/A', status: testRun.status },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.json(testRun);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete test run
exports.deleteTestRun = async (req, res) => {
  try {
    const testRun = await TestRun.findById(req.params.id);

    if (!testRun) {
      return res.status(404).json({ message: 'Test run not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && testRun.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const deletedId = testRun._id.toString();
    await TestRun.findByIdAndDelete(req.params.id);
    await logAudit({
      actorId: req.user.userId,
      actorName: req.user.username,
      action: 'deleted',
      targetType: 'TestRun',
      targetId: deletedId,
      details: { generatorSet: testRun.generatorSet || 'N/A', status: testRun.status },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.json({ message: 'Test run deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate report - admin only
exports.generateReport = async (req, res) => {
  try {
    const testRuns = await TestRun.find().populate('userId', 'username');
    const report = {
      totalCount: testRuns.length,
      byStatus: {},
      byUser: {},
      data: testRuns
    };

    // Group by status
    testRuns.forEach(run => {
      report.byStatus[run.status] = (report.byStatus[run.status] || 0) + 1;
      const userName = run.userId.username;
      if (!report.byUser[userName]) {
        report.byUser[userName] = [];
      }
      report.byUser[userName].push(run);
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export to Excel
exports.exportToExcel = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { userId: req.user.userId };
    const testRuns = await TestRun.find(query).populate('userId', 'username');
    
    const buffer = exportTestRunsToExcel(testRuns);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=test-runs.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export report to Excel - admin only
exports.exportReportToExcel = async (req, res) => {
  try {
    const testRuns = await TestRun.find().populate('userId', 'username');
    const report = {
      totalCount: testRuns.length,
      byStatus: {},
      byUser: {},
      data: testRuns
    };

    testRuns.forEach(run => {
      report.byStatus[run.status] = (report.byStatus[run.status] || 0) + 1;
      const userName = run.userId.username;
      if (!report.byUser[userName]) {
        report.byUser[userName] = [];
      }
      report.byUser[userName].push(run);
    });

    const buffer = exportReportToExcel(report);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=test-runs-report.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Import test run data - admin only
exports.importTestRuns = async (req, res) => {
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

    const createdTestRuns = await Promise.all(
      rows.map(row =>
        TestRun.create({
          userId: assignedUserId,
          testDate: row.date || row.testDate,
          testTime: row.testTime,
          stopTime: row.stopTime,
          generatorSet: row.generatorSet,
          status: row.status || 'operational',
          hourRun: row.hourRun,
          engineTemperature: row.engineTemperature,
          oilPressure: row.oilPressure,
          llVoltage: row.llVoltage,
          lnVoltage: row.lnVoltage,
          loadCurrent: row.loadCurrent,
          engineSpeed: row.engineSpeed,
          engineFrequency: row.engineFrequency,
          realPower: row.realPower,
          apparentPower: row.apparentPower,
          batteryVoltage: row.batteryVoltage,
          comments: row.comments,
          importedDate,
          importedBy
        })
      )
    );

    res.status(201).json({
      message: `Successfully imported ${createdTestRuns.length} test run entries`,
      data: createdTestRuns
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete multiple test runs - admin only
exports.deleteMultipleTestRuns = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No IDs provided for deletion' });
    }

    const result = await TestRun.deleteMany({ _id: { $in: ids } });

    res.json({
      message: `Successfully deleted ${result.deletedCount} test run entries`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
