const DailyInspection = require('../models/DailyInspection');
const { exportDailyInspectionsToExcel, exportDailyInspectionsReportToExcel } = require('../utils/excelExport');
const { logAudit } = require('../utils/audit');
const { validateInspectionPayload } = require('../utils/validation');

// Get daily inspections
exports.getDailyInspections = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { userId: req.user.userId };
    const inspections = await DailyInspection.find(query).populate('userId', 'username');
    res.json(inspections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single daily inspection
exports.getDailyInspectionById = async (req, res) => {
  try {
    const inspection = await DailyInspection.findById(req.params.id).populate('userId', 'username');
    
    if (!inspection) {
      return res.status(404).json({ message: 'Daily inspection not found' });
    }

    if (req.user.role !== 'admin' && inspection.userId._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(inspection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create or update daily inspection
exports.submitDailyInspection = async (req, res) => {
  try {
    const { externalAssets, groundFloor, firstFloor, secondFloor, status, inspectionDate, draftId } = req.body;

    const validation = validateInspectionPayload({
      inspectionDate,
      status,
      externalAssets,
      groundFloor,
      firstFloor,
      secondFloor,
    }, req.user.userId);

    if (!validation.valid) {
      return res.status(400).json({ message: validation.errors.join('; ') });
    }

    const normalizedStatus = Array.isArray(status)
      ? status.filter((item) => item !== 'Draft')
      : [];

    const inspectionData = {
      userId: req.user.userId,
      inspectionDate: inspectionDate || new Date(),
      externalAssets,
      groundFloor,
      firstFloor,
      secondFloor,
      status: normalizedStatus.length > 0 ? normalizedStatus : ['No issues']
    };

    let inspection;
    if (draftId) {
      inspection = await DailyInspection.findById(draftId);
      if (inspection) {
        if (req.user.role !== 'admin' && inspection.userId.toString() !== req.user.userId) {
          return res.status(403).json({ message: 'Not authorized' });
        }
        Object.assign(inspection, inspectionData);
      }
    }

    if (!inspection) {
      inspection = new DailyInspection(inspectionData);
    }

    await inspection.save();
    await logAudit({
      actorId: req.user.userId,
      actorName: req.user.username,
      action: 'submitted',
      targetType: 'DailyInspection',
      targetId: inspection._id.toString(),
      details: { status: inspection.status },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.status(201).json(inspection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Save draft daily inspection
exports.saveDraftInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const { externalAssets, groundFloor, firstFloor, secondFloor, status, inspectionDate } = req.body;

    let inspection;
    if (id && id !== 'null') {
      inspection = await DailyInspection.findById(id);
      if (inspection) {
        // Check authorization - user can only update their own drafts
        if (req.user.role !== 'admin' && inspection.userId.toString() !== req.user.userId) {
          return res.status(403).json({ message: 'Not authorized' });
        }
      } else {
        inspection = new DailyInspection({
          userId: req.user.userId,
          status: ['Draft']
        });
      }
    } else {
      inspection = new DailyInspection({
        userId: req.user.userId,
        status: ['Draft']
      });
    }

    if (externalAssets) inspection.externalAssets = externalAssets;
    if (groundFloor) inspection.groundFloor = groundFloor;
    if (firstFloor) inspection.firstFloor = firstFloor;
    if (secondFloor) inspection.secondFloor = secondFloor;
    if (inspectionDate) inspection.inspectionDate = inspectionDate;

    const validation = validateInspectionPayload({
      inspectionDate: inspection.inspectionDate,
      status: inspection.status,
      externalAssets: inspection.externalAssets,
      groundFloor: inspection.groundFloor,
      firstFloor: inspection.firstFloor,
      secondFloor: inspection.secondFloor,
    }, req.user.userId);

    if (!validation.valid) {
      return res.status(400).json({ message: validation.errors.join('; ') });
    }

    if (Array.isArray(status) && status.length > 0) {
      const draftStatus = status.filter((item) => item !== 'Draft');
      inspection.status = draftStatus.length > 0 ? [...draftStatus, 'Draft'] : ['Draft'];
    } else if (!inspection.status || !inspection.status.includes('Draft')) {
      inspection.status = ['Draft'];
    }

    await inspection.save();
    await logAudit({
      actorId: req.user.userId,
      actorName: req.user.username,
      action: 'drafted',
      targetType: 'DailyInspection',
      targetId: inspection._id.toString(),
      details: { status: inspection.status },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.json(inspection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete daily inspection
exports.deleteDailyInspection = async (req, res) => {
  try {
    const inspection = await DailyInspection.findById(req.params.id);

    if (!inspection) {
      return res.status(404).json({ message: 'Daily inspection not found' });
    }

    if (req.user.role !== 'admin' && inspection.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const deletedId = inspection._id.toString();
    await DailyInspection.findByIdAndDelete(req.params.id);
    await logAudit({
      actorId: req.user.userId,
      actorName: req.user.username,
      action: 'deleted',
      targetType: 'DailyInspection',
      targetId: deletedId,
      details: { status: inspection.status },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.json({ message: 'Daily inspection deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export to Excel
exports.exportToExcel = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { userId: req.user.userId };
    const inspections = await DailyInspection.find(query).populate('userId', 'username');
    
    const buffer = exportDailyInspectionsToExcel(inspections);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=daily-inspections.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate report - admin only
exports.generateReport = async (req, res) => {
  try {
    const inspections = await DailyInspection.find().populate('userId', 'username');
    const report = {
      totalCount: inspections.length,
      byStatus: {},
      byUser: {},
      data: inspections
    };

    // Group by status
    inspections.forEach(inspection => {
      const statuses = Array.isArray(inspection.status) && inspection.status.length > 0
        ? inspection.status
        : ['No issues'];
      statuses.forEach(status => {
        report.byStatus[status] = (report.byStatus[status] || 0) + 1;
      });
      const userName = inspection.userId.username;
      if (!report.byUser[userName]) {
        report.byUser[userName] = [];
      }
      report.byUser[userName].push(inspection);
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export report to Excel - admin only
exports.exportReportToExcel = async (req, res) => {
  try {
    const inspections = await DailyInspection.find().populate('userId', 'username');
    const report = {
      totalCount: inspections.length,
      byStatus: {},
      byUser: {},
      data: inspections
    };

    inspections.forEach(inspection => {
      const statuses = Array.isArray(inspection.status) && inspection.status.length > 0
        ? inspection.status
        : ['No issues'];
      statuses.forEach(status => {
        report.byStatus[status] = (report.byStatus[status] || 0) + 1;
      });
      const userName = inspection.userId.username;
      if (!report.byUser[userName]) {
        report.byUser[userName] = [];
      }
      report.byUser[userName].push(inspection);
    });

    const buffer = exportDailyInspectionsReportToExcel(report);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=daily-inspections-report.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Import daily inspection data - admin only
exports.importDailyInspections = async (req, res) => {
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

    const createdInspections = await Promise.all(
      rows.map(async (row) => {
        // Normalize inspectionDate to a JS Date (if possible)
        let inspectionDate = null;
        if (row && row.inspectionDate) {
          const tryDate = new Date(row.inspectionDate);
          if (!Number.isNaN(tryDate.getTime())) {
            inspectionDate = tryDate;
          } else {
            // Try parsing common localized formats
            const parsed = Date.parse(row.inspectionDate);
            if (!Number.isNaN(parsed)) {
              inspectionDate = new Date(parsed);
            }
          }
        }

        // Normalize status to an array
        let status = ['No issues'];
        if (Array.isArray(row.status) && row.status.length > 0) {
          status = row.status;
        } else if (typeof row.status === 'string' && row.status.trim()) {
          status = row.status.includes(',')
            ? row.status.split(',').map((s) => s.trim()).filter(Boolean)
            : [row.status.trim()];
        }

        return DailyInspection.create({
          userId: assignedUserId,
          inspectionDate: inspectionDate || new Date(),
          externalAssets: row.externalAssets || {},
          groundFloor: row.groundFloor || {},
          firstFloor: row.firstFloor || {},
          secondFloor: row.secondFloor || {},
          status,
          importedDate,
          importedBy
        });
      })
    );

    res.status(201).json({
      message: `Successfully imported ${createdInspections.length} daily inspection entries`,
      data: createdInspections
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete multiple daily inspections - admin only
exports.deleteMultipleDailyInspections = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No IDs provided for deletion' });
    }

    const result = await DailyInspection.deleteMany({ _id: { $in: ids } });

    res.json({
      message: `Successfully deleted ${result.deletedCount} daily inspection entries`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
