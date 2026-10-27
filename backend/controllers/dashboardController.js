const User = require('../models/User');
const TestRun = require('../models/TestRun');
const BoosterPump = require('../models/BoosterPump');
const DailyInspection = require('../models/DailyInspection');
const AvrRecording = require('../models/AvrRecording');
const { buildDashboardSummary } = require('../utils/dashboard');

exports.getDashboardSummary = async (req, res) => {
  try {
    const [totalTestRuns, totalPumps, totalInspections, totalAvrRecordings] = await Promise.all([
      TestRun.countDocuments(),
      BoosterPump.countDocuments(),
      DailyInspection.countDocuments(),
      AvrRecording.countDocuments(),
    ]);

    const [testRuns, pumps, inspections, avrRecordings, recentUsers] = await Promise.all([
      TestRun.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      BoosterPump.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      DailyInspection.aggregate([
        { $project: { status: { $ifNull: ['$status', ['No issues']] } } },
        { $unwind: '$status' },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      AvrRecording.aggregate([
        {
          $project: {
            avrStatus: {
              $let: {
                vars: {
                  alarm: {
                    $toLower: {
                      $trim: {
                        input: {
                          $convert: {
                            input: '$anyAlarm',
                            to: 'string',
                            onError: '',
                            onNull: '',
                          },
                        },
                      },
                    },
                  },
                },
                in: {
                  $switch: {
                    branches: [
                      { case: { $eq: ['$$alarm', ''] }, then: 'Not specified' },
                      { case: { $in: ['$$alarm', ['none', 'no', 'n/a', '-']] }, then: 'No alarm' },
                    ],
                    default: 'Alarm reported',
                  },
                },
              },
            },
          },
        },
        { $group: { _id: '$avrStatus', count: { $sum: 1 } } },
      ]),
      User.find({}, 'username role createdAt').sort({ createdAt: -1 }).limit(5),
    ]);

    const testRunsByStatus = Object.fromEntries(testRuns.map((item) => [item._id || 'Unknown', item.count]));
    const pumpsByStatus = Object.fromEntries(pumps.map((item) => [item._id || 'Unknown', item.count]));
    const inspectionsByStatus = Object.fromEntries(inspections.map((item) => [item._id || 'Unknown', item.count]));
    const avrByStatus = Object.fromEntries(avrRecordings.map((item) => [item._id || 'Unknown', item.count]));

    const summary = buildDashboardSummary({
      totalTestRuns,
      totalPumps,
      totalInspections,
      totalAvrRecordings,
      testRunsByStatus,
      pumpsByStatus,
      inspectionsByStatus,
      avrByStatus,
      recentUsers,
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
