const test = require('node:test');
const assert = require('node:assert/strict');
const DeletedRecord = require('../models/DeletedRecord');
const { getExpiryDate, getRecordSummary, isDraftInspection } = require('../utils/softDelete');

test('deleted record schema supports facility types and expires via a TTL index', () => {
  const deletedRecord = new DeletedRecord({
    targetType: 'TestRun',
    originalId: '507f1f77bcf86cd799439011',
    record: { generatorSet: 'Generator A' },
    deletedAt: new Date('2026-10-16T12:00:00.000Z'),
    expiresAt: new Date('2027-01-16T12:00:00.000Z')
  });

  assert.equal(deletedRecord.validateSync(), undefined);
  assert.ok(DeletedRecord.schema.indexes().some(([, options]) => options.expireAfterSeconds === 0));
});

test('deleted records expire after three calendar months, clamped to the end of short months', () => {
  assert.equal(
    getExpiryDate(new Date('2026-10-16T12:00:00.000Z')).toISOString(),
    '2027-01-16T12:00:00.000Z'
  );
  assert.equal(
    getExpiryDate(new Date('2026-10-31T12:00:00.000Z')).toISOString(),
    '2027-01-31T12:00:00.000Z'
  );
  assert.equal(
    getExpiryDate(new Date('2026-11-30T12:00:00.000Z')).toISOString(),
    '2027-02-28T12:00:00.000Z'
  );
});

test('deleted record summaries use representative labels for each facility record type', () => {
  assert.deepEqual(getRecordSummary('TestRun', { generatorSet: 'G-1', status: 'Operational' }), {
    generatorSet: 'G-1',
    status: 'Operational'
  });
  assert.deepEqual(getRecordSummary('BoosterPump', { pumpNo: 'P-1', status: 'Operational' }), {
    pumpNo: 'P-1',
    status: 'Operational'
  });
  assert.deepEqual(getRecordSummary('DailyInspection', { inspectionDate: '2026-10-16', status: 'Good' }), {
    inspectionDate: '2026-10-16',
    status: 'Good'
  });
  assert.deepEqual(getRecordSummary('AvrRecording', { date: '2026-10-16', time: '10:00' }), {
    date: '2026-10-16',
    time: '10:00'
  });
});

test('draft inspections are excluded from the recoverable archive', () => {
  assert.equal(isDraftInspection({ status: ['Draft'] }), true);
  assert.equal(isDraftInspection({ status: ['No issues', 'Draft'] }), true);
  assert.equal(isDraftInspection({ status: ['No issues'] }), false);
});
