const AuditLog = require('../models/AuditLog');

exports.getAuditLogs = async (req, res) => {
  try {
    const { targetType, action, actorId, limit = 50 } = req.query;
    const query = {};

    if (targetType) query.targetType = targetType;
    if (action) query.action = action;
    if (actorId) query.actorId = actorId;

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 50, 200));

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAuditTrailForEntity = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const logs = await AuditLog.find({
      targetType,
      targetId,
    }).sort({ createdAt: -1 });

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
