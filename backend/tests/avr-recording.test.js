const test = require('node:test');
const assert = require('node:assert/strict');
const XLSX = require('xlsx');
const AvrRecording = require('../models/AvrRecording');
const {
  exportAvrRecordingsToExcel,
  exportAvrRecordingsReportToExcel
} = require('../utils/excelExport');

const measurementFields = [
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
  'outputkwh24Hrs'
];

test('AVR recording schema accepts the supplied measurements', () => {
  const recording = new AvrRecording({
    userId: '507f1f77bcf86cd799439011',
    date: '2026-10-16',
    time: '07:30',
    ...measurementFields.reduce((values, field, index) => ({
      ...values,
      [field]: index + 1
    }), {}),
    anyAlarm: 'None',
    comments: 'Routine recording'
  });

  assert.equal(recording.validateSync(), undefined);
  measurementFields.forEach((field) => assert.equal(typeof recording[field], 'number'));
});

test('AVR recording schema requires date and time', () => {
  const recording = new AvrRecording({ userId: '507f1f77bcf86cd799439011' });
  const error = recording.validateSync();

  assert.ok(error.errors.date);
  assert.ok(error.errors.time);
});

test('AVR Excel exports include all input columns and a report summary', () => {
  const recordings = [{
    date: '2026-10-16',
    time: '07:30',
    inputVoltageLL: 400,
    anyAlarm: 'None',
    comments: 'Routine'
  }];
  const dataWorkbook = XLSX.read(exportAvrRecordingsToExcel(recordings), { type: 'buffer' });
  const data = XLSX.utils.sheet_to_json(dataWorkbook.Sheets['AVR Recordings'], { header: 1 });

  assert.equal(data[0].length, 22);
  assert.equal(data[0][0], 'DATE');
  assert.equal(data[0][1], 'TIME');
  assert.equal(data[1][2], 400);

  const reportWorkbook = XLSX.read(exportAvrRecordingsReportToExcel(recordings), { type: 'buffer' });
  const summary = XLSX.utils.sheet_to_json(reportWorkbook.Sheets.Summary, { header: 1 });
  assert.deepEqual(summary.slice(0, 3), [
    ['AVR Recordings Report'],
    ['Total Recordings', 1],
    ['Recordings With Alarm', 0]
  ]);
});

test('AVR Excel export matches the current form field names and reads legacy values', () => {
  const workbook = XLSX.read(exportAvrRecordingsToExcel([{
    date: '2026-10-16',
    time: '07:30',
    inputPowerFactor: 0.95,
    outputPowerFactor: 0.96,
    inputKWh: 120,
    outputKWh: 115,
    inputkwh24Hrs: 130,
    outputkwh24Hrs: 125
  }, {
    inputPF: 0.9,
    outputPF: 0.91,
    inputKwh: 100,
    outputKwh: 98,
    kwh24Hrs: 110,
    outputKwhDay: 108
  }]), { type: 'buffer' });
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets['AVR Recordings'], { header: 1 });

  assert.deepEqual(rows[0].slice(14, 20), [
    'INPUT POWER FACTOR (PF)',
    'OUTPUT POWER FACTOR (PF)',
    'INPUT KWh',
    'OUTPUT KWh',
    'INPUT KWh/24HRS',
    'OUTPUT KWh/24HRS'
  ]);
  assert.deepEqual(rows[1].slice(14, 20), [0.95, 0.96, 120, 115, 130, 125]);
  assert.deepEqual(rows[2].slice(14, 20), [0.9, 0.91, 100, 98, 110, 108]);
});

test('AVR recording schema accepts the current form fields', () => {
  const recording = new AvrRecording({
    userId: '507f1f77bcf86cd799439011',
    date: '2026-10-16',
    time: '07:30',
    inputPowerFactor: 0.95,
    outputPowerFactor: 0.96,
    inputKWh: 120,
    outputKWh: 115,
    inputkwh24Hrs: 130,
    outputkwh24Hrs: 125
  });

  assert.equal(recording.validateSync(), undefined);
  assert.equal(recording.inputPowerFactor, 0.95);
  assert.equal(recording.outputPowerFactor, 0.96);
  assert.equal(recording.inputKWh, 120);
  assert.equal(recording.outputKWh, 115);
  assert.equal(recording.inputkwh24Hrs, 130);
  assert.equal(recording.outputkwh24Hrs, 125);
});
