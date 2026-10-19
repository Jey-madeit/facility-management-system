const mongoose = require('mongoose');

const dailyInspectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    inspectionDate: {
      type: Date,
      default: Date.now
    },
    draftStep: {
      type: Number,
      min: 1,
      max: 4
    },
    // External Assets
    externalAssets: {
      cumminsGeneratorAvailability: {
        type: String,
        required: false
      },
      catGeneratorAvailability: {
        type: String,
        required: false
      },
      cumminsGeneratorRunningHours: {
        type: String,
        required: false
      },
      catGeneratorRunningHours: {
        type: String,
        required: false
      },
      cumminsRemainingHours: {
        type: String,
        required: false
      },
      catRemainingHours: {
        type: String,
        required: false
      },
      externalDieselTankFuelLevel: {
        type: String,
        required: false
      },
      cumminsRadiatorTankCondition: {
        type: String,
        required: false
      },
      catRadiatorTankCondition: {
        type: String,
        required: false
      },
      cumminsAirFilterCondition: {
        type: String,
        required: false
      },
      catAirFilterCondition: {
        type: String,
        required: false
      },
      cumminsOilLevel: {
        type: String,
        required: false
      },
      catOilLevel: {
        type: String,
        required: false
      },
      cumminsCoolantLevel: {
        type: String,
        required: false
      },
      catCoolantLevel: {
        type: String,
        required: false
      },
      cumminsBatteryVoltage: {
        type: String,
        required: false
      },
      catBatteryVoltage: {
        type: String,
        required: false
      },
      cumminsPendingAlarms: {
        type: String,
        required: false
      },
      catPendingAlarms: {
        type: String,
        required: false
      },
      cumminsDriveBeltDamage: {
        type: String,
        required: false
      },
      catDriveBeltDamage: {
        type: String,
        required: false
      },
      cumminsElectricalConnections: {
        type: String,
        required: false
      },
      catElectricalConnections: {
        type: String,
        required: false
      },
      cumminsUnusualNoise: {
        type: String,
        required: false
      },
      catUnusualNoise: {
        type: String,
        required: false
      },
      cumminsGeneratorVoltage: {
        type: String,
        required: false
      },
      catGeneratorVoltage: {
        type: String,
        required: false
      },
      avrOperational: {
        type: String,
        required: false
      },
      avrInputVoltageLL: {
        type: String,
        required: false
      },
      avrOutputVoltageLL: {
        type: String,
        required: false
      },
      avrInputVoltageLN: {
        type: String,
        required: false
      },
      avrOutputVoltageLN: {
        type: String,
        required: false
      },
      avrAlarm: {
        type: String,
        required: false
      },
      cumminsFrequency: {
        type: String,
        required: false
      },
      catFrequency: {
        type: String,
        required: false
      },
      waterTankLevel10000: {
        type: String,
        required: false
      },
      waterTankLevel7000: {
        type: String,
        required: false
      },
      pedroloPump1Pressure: {
        type: String,
        required: false
      },
      pedroloPump2Pressure: {
        type: String,
        required: false
      },
      pedroloPump1Report: {
        type: String,
        required: false
      },
      pedroloPump2Report: {
        type: String,
        required: false
      },
      securityPost: {
        type: String,
        required: false
      },
      driversRoom: {
        type: String,
        required: false
      },
      mainCompoundObservations: {
        type: String,
        required: false
      },
      solidWasteAreaObservations: {
        type: String,
        required: false
      },
      carParkingSpaces: {
        type: String,
        required: false
      },
    },

    // Ground Floor Section
    groundFloor: {
      lighting: {
        type: String,
        required: false
      },
      airCondition: {
        type: String,
        required: false
      },
      plumbing: {
        type: String,
        required: false
      },
      glazing: {
        type: String,
        required: false
      },
      workstationCleaning: {
        type: String,
        required: false
      },
      officeCleaning: {
        type: String,
        required: false
      },
      maleWashroom: {
        type: String,
        required: false
      },
      femaleWashroom: {
        type: String,
        required: false
      },
      cafeteria: {
        type: String,
        required: false
      },
      openOfficeGround: {
        type: String,
        required: false
      },
      managersOfficesGround: {
        type: String,
        required: false
      },
      reception: {
        type: String,
        required: false
      },
      generalObservations: {
        type: String,
        required: false
      }
    },

    // First Floor Section
    firstFloor: {
      lighting: {
        type: String,
        required: false
      },
      airCondition: {
        type: String,
        required: false
      },
      glazing: {
        type: String,
        required: false
      },
      trainingRoom: {
        type: String,
        required: false
      },
      emergencyCommandCentre: {
        type: String,
        required: false
      },
      workstationCleaning: {
        type: String,
        required: false
      },
      officeCleaning: {
        type: String,
        required: false
      },
      maleWashroom: {
        type: String,
        required: false
      },
      femaleWashroom: {
        type: String,
        required: false
      },
      openOffice1st: {
        type: String,
        required: false
      },
      managersOffices1st: {
        type: String,
        required: false
      },
      generalObservations: {
        type: String,
        required: false
      }
    },
    // Second Floor Section
    secondFloor: {
      lighting: {
        type: String,
        required: false
      },
      airCondition: {
        type: String,
        required: false
      },
      glazing: {
        type: String,
        required: false
      },
      workstationCleaning: {
        type: String,
        required: false
      },
      officeCleaning: {
        type: String,
        required: false
      },
      boardRoom: {
        type: String,
        required: false
      },
      maleWashroom: {
        type: String,
        required: false
      },
      femaleWashroom: {
        type: String,
        required: false
      },
      smtOffices: {
        type: String,
        required: false
      },
      openOffice2nd: {
        type: String,
        required: false
      },
      managersOffices2nd: {
        type: String,
        required: false
      },
      kitchenCafeteria: {
        type: String,
        required: false
      },
      generalObservations: {
        type: String,
        required: false
      },
      supervisorComments: String,
    },
    
    status: {
      type: [String],
      enum: ['', 'Draft', 'Issues on External Assets', 'Issues on GroundFloor',
        'Issues on FirstFloor', 'Issues on SecondFloor', 'No issues'],
      default: ['No issues']
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

module.exports = mongoose.model('DailyInspection', dailyInspectionSchema);
