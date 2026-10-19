const mongoose = require('mongoose');

const avrRecordingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    time: {
      type: String,
      required: true,
      trim: true
    },
    inputVoltageLL: Number,
    outputVoltageLL: Number,
    inputVoltageLN: Number,
    outputVoltageLN: Number,
    inputLoadCurrent: Number,
    outputLoadCurrent: Number,
    neutralN: Number,
    frequency: Number,
    inputKilowatt: Number,
    outputKilowatt: Number,
    inputKilovoltAmpere: Number,
    outputKilovoltAmpere: Number,
    inputPF: Number,
    outputPF: Number,
    inputKwh: Number,
    kwh24Hrs: Number,
    outputKwh: Number,
    outputKwhDay: Number,
    inputPowerFactor: Number,
    outputPowerFactor: Number,
    inputKWh: Number,
    outputKWh: Number,
    inputkwh24Hrs: Number,
    outputkwh24Hrs: Number,
    anyAlarm: String,
    comments: String,
    importedDate: {
      type: Date,
      default: null
    },
    importedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AvrRecording', avrRecordingSchema);
