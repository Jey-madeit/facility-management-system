const mongoose = require('mongoose');

const boosterPumpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    pumpNo: {
      type: String,
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['Operational', 'Maintenance', 'Offline', 'Faulty'],
      default: 'Operational'
    },
    stopDate: {
      type: Date
    },
    stopTime: {
      type: String
    },
    failureAlarm: {
      type: String
    },
    totalHours: {
      type: String
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
boosterPumpSchema.pre('validate', function(next) {
  if (this.status) {
    this.status = this.status.charAt(0).toUpperCase() + this.status.slice(1); // Capitalize the first letter for enum validation
  }
  next();
}); 

// Normalize status to lowercase before updating
// This ensures findOneAndUpdate operations also use lowercase enum values.
boosterPumpSchema.pre('findOneAndUpdate', function(next) {
  if (this._update && this._update.status) {
    this._update.status = this._update.status.charAt(0).toUpperCase() + this._update.status.slice(1); // Capitalize the first letter for enum validation
  }
  next();
});


module.exports = mongoose.model('BoosterPump', boosterPumpSchema);
