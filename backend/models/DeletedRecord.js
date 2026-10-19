const mongoose = require('mongoose');

const deletedRecordSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ['TestRun', 'BoosterPump', 'DailyInspection', 'AvrRecording'],
      required: true
    },
    originalId: {
      type: String,
      required: true,
      index: true
    },
    record: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    deletedByName: {
      type: String,
      default: null
    },
    deletedAt: {
      type: Date,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeletedRecord', deletedRecordSchema);
