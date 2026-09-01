const mongoose = require('mongoose');

const testRunSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // Generator test run specific fields
    testDate: {
      type: Date,
      default: Date.now
    },
    testTime: {
      type: String,
    },
    stopTime: {
      type: String,
    },
    generatorSet: {
      type: String
    },
    status: {
      type: String,
      enum: ['Faulty', 'Operational', 'Maintenance', 'Unavailable'],
      default: 'Operational'
    },
    hourRun: {
      type: Number
    },
    engineTemperature: {
      type: Number
    },
    oilPressure: {
      type: String
    },
    llVoltage: {
      type: String
    },
    lnVoltage: {
      type: String
    },
    loadCurrent: {
      type: Number
    },
    engineSpeed: {
      type: Number
    },
    engineFrequency: {
      type: Number
    },
    realPower: {
      type: Number
    },
    apparentPower: {
      type: Number
    },
    batteryVoltage: {
      type: Number
    },
    comments: {
      type: String
    },
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

// Normalize status to lowercase before validation
// This is necessary because Mongoose validates enums before save middleware runs.
testRunSchema.pre('validate', function(next) {
  if (this.status) {
    this.status = this.status.charAt(0).toUpperCase() + this.status.slice(1); // Capitalize the first letter for enum validation
  }
  next();
});

// Normalize status to lowercase before updating
// This ensures findOneAndUpdate operations also use lowercase enum values.
testRunSchema.pre('findOneAndUpdate', function(next) {
  if (this._update && this._update.status) {
    this._update.status = this._update.status.charAt(0).toUpperCase() + this._update.status.slice(1); // Capitalize the first letter for enum validation
  }
  next();
});

module.exports = mongoose.model('TestRun', testRunSchema);
