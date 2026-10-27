const test = require('node:test');
const assert = require('node:assert/strict');
const { validateInspectionPayload, validateAssetPayload } = require('../utils/validation');
const { buildDashboardSummary } = require('../utils/dashboard');
const { buildAuditEntry } = require('../utils/audit');

const inspectionPayload = {
  inspectionDate: '2026-09-18',
  status: ['No issues'],
  externalAssets: {
    cumminsBatteryVoltage: '13.2',
    catBatteryVoltage: '13.0',
  },
  groundFloor: { lighting: 'Good' },
  firstFloor: { lighting: 'Good' },
  secondFloor: { lighting: 'Good' },
};

test('validateInspectionPayload accepts complete valid inspection data', () => {
  const result = validateInspectionPayload(inspectionPayload, 'user-1');
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test('validateInspectionPayload rejects invalid status and missing inspection sections', () => {
  const result = validateInspectionPayload({
    status: ['InvalidStatus'],
    externalAssets: {},
    groundFloor: {},
    firstFloor: {},
    secondFloor: {}
  }, 'user-1');

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('status')));
  assert.ok(result.errors.some((error) => error.includes('required')));
});

test('validateAssetPayload rejects stop dates before start dates', () => {
  const result = validateAssetPayload({
    startDate: '2026-09-18',
    stopDate: '2026-09-10',
    pumpNo: 'P-101',
    startTime: '08:00',
    status: 'Operational'
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('stop date')));
});

test('buildDashboardSummary aggregates records and statuses', () => {
  const summary = buildDashboardSummary({
    totalTestRuns: 10,
    totalPumps: 8,
    totalInspections: 6,
    totalAvrRecordings: 4,
    testRunsByStatus: { Operational: 5, Maintenance: 2, Faulty: 3 },
    pumpsByStatus: { Operational: 5, Offline: 2, Maintenance: 1 },
    inspectionsByStatus: { 'No issues': 4, Draft: 1, 'Needs attention': 1 },
    avrByStatus: { 'Alarm reported': 1, 'No alarm': 2, 'Not specified': 1 },
    recentUsers: [{ username: 'admin' }, { username: 'user1' }],
  });

  assert.equal(summary.totalRecords, 28);
  assert.equal(summary.totalAvrRecordings, 4);
  assert.equal(summary.testRunStatusCounts.Operational, 5);
  assert.equal(summary.pumpStatusCounts.Offline, 2);
  assert.equal(summary.inspectionStatusCounts['No issues'], 4);
  assert.equal(summary.avrStatusCounts['Alarm reported'], 1);
  assert.equal(summary.recentUsers.length, 2);
});

test('buildAuditEntry includes actor, action and target metadata', () => {
  const entry = buildAuditEntry({
    actorId: 'user-1',
    actorName: 'admin',
    action: 'updated',
    targetType: 'DailyInspection',
    targetId: 'inspection-123',
    details: { status: 'Needs attention' }
  });

  assert.equal(entry.actorId, 'user-1');
  assert.equal(entry.action, 'updated');
  assert.equal(entry.targetType, 'DailyInspection');
  assert.ok(entry.createdAt);
});
