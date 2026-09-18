const AuditLog = require('../models/AuditLog');

const buildAuditEntry = ({
  actorId,
  actorName,
  action,
  targetType,
  targetId,
  details = {},
  createdAt = new Date(),
  ipAddress = null,
  userAgent = null,
}) => ({
  actorId,
  actorName,
  action,
  targetType,
  targetId,
  details,
  ipAddress,
  userAgent,
  createdAt: createdAt instanceof Date ? createdAt.toISOString() : new Date(createdAt).toISOString(),
});

const logAudit = async ({ actorId, actorName, action, targetType, targetId, details = {}, ipAddress = null, userAgent = null }) => {
  try {
    const entry = buildAuditEntry({
      actorId,
      actorName,
      action,
      targetType,
      targetId,
      details,
      ipAddress,
      userAgent,
    });

    return await AuditLog.create(entry);
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
    return null;
  }
};

module.exports = { buildAuditEntry, logAudit };
