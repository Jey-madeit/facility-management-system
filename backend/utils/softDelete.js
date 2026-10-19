const DeletedRecord = require('../models/DeletedRecord');
const { logAudit } = require('./audit');

const getExpiryDate = (date) => {
  const expiresAt = new Date(date);
  const originalDay = expiresAt.getUTCDate();
  expiresAt.setUTCDate(1);
  expiresAt.setUTCMonth(expiresAt.getUTCMonth() + 3);
  const lastDayOfExpiryMonth = new Date(Date.UTC(
    expiresAt.getUTCFullYear(),
    expiresAt.getUTCMonth() + 1,
    0
  )).getUTCDate();
  expiresAt.setUTCDate(Math.min(originalDay, lastDayOfExpiryMonth));
  return expiresAt;
};

const getRecordSummary = (targetType, record) => {
  switch (targetType) {
    case 'TestRun':
      return { generatorSet: record.generatorSet || 'N/A', status: record.status };
    case 'BoosterPump':
      return { pumpNo: record.pumpNo || 'N/A', status: record.status };
    case 'DailyInspection':
      return { inspectionDate: record.inspectionDate, status: record.status };
    case 'AvrRecording':
      return { date: record.date, time: record.time };
    default:
      return {};
  }
};

const isDraftInspection = (record) => (
  Array.isArray(record.status) && record.status.includes('Draft')
);

const softDeleteRecords = async ({
  model,
  targetType,
  filter,
  actor,
  ipAddress,
  userAgent,
  bulk = false,
  shouldArchive = () => true
}) => {
  const records = await model.find(filter);
  if (!records.length) return { deletedRecords: [], recoverableCount: 0 };

  const deletedAt = new Date();
  const expiresAt = getExpiryDate(deletedAt);
  const archived = [];
  const recoverableRecords = records.filter(shouldArchive);

  for (const record of recoverableRecords) {
    try {
      archived.push(await DeletedRecord.create({
        targetType,
        originalId: record._id.toString(),
        record: record.toObject({ depopulate: true }),
        deletedBy: actor.userId,
        deletedByName: actor.username,
        deletedAt,
        expiresAt
      }));
    } catch (error) {
      if (archived.length) {
        await DeletedRecord.deleteMany({ _id: { $in: archived.map((entry) => entry._id) } });
      }
      throw error;
    }
  }

  await model.deleteMany({ _id: { $in: records.map((record) => record._id) } });
  const remaining = await model.find({
    _id: { $in: records.map((record) => record._id) }
  }).select('_id');
  const remainingIds = new Set(remaining.map((record) => record._id.toString()));
  const deleted = records.filter((record) => !remainingIds.has(record._id.toString()));
  const recoverableIds = new Set(recoverableRecords.map((record) => record._id.toString()));
  const staleArchiveIds = archived
    .filter((entry) => remainingIds.has(entry.originalId))
    .map((entry) => entry._id);

  if (staleArchiveIds.length) await DeletedRecord.deleteMany({ _id: { $in: staleArchiveIds } });

  await Promise.all(deleted.map((record) => logAudit({
    actorId: actor.userId,
    actorName: actor.username,
    action: 'deleted',
    targetType,
    targetId: record._id.toString(),
    details: {
      ...getRecordSummary(targetType, record),
      bulk,
      ...(recoverableIds.has(record._id.toString())
        ? { recoverableUntil: expiresAt }
        : { recoveryExcluded: true })
    },
    ipAddress,
    userAgent
  })));

  return {
    deletedRecords: deleted,
    recoverableCount: deleted.filter((record) => recoverableIds.has(record._id.toString())).length
  };
};

module.exports = { getRecordSummary, getExpiryDate, isDraftInspection, softDeleteRecords };
