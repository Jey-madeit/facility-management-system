const User = require('../models/User');
const TestRun = require('../models/TestRun');
const BoosterPump = require('../models/BoosterPump');
const DailyInspection = require('../models/DailyInspection');
const { buildDashboardSummary } = require('../utils/dashboard');

exports.getDashboardSummary = async (req, res) => {
  try {
    const [totalUsers, totalTestRuns, totalPumps, totalInspections] = await Promise.all([
      User.countDocuments(),
      TestRun.countDocuments(),
      BoosterPump.countDocuments(),
      DailyInspection.countDocuments(),
    ]);

    const [testRuns, pumps, inspections, recentUsers] = await Promise.all([
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
      User.find({}, 'username role createdAt').sort({ createdAt: -1 }).limit(5),
    ]);

    const testRunsByStatus = Object.fromEntries(testRuns.map((item) => [item._id || 'Unknown', item.count]));
    const pumpsByStatus = Object.fromEntries(pumps.map((item) => [item._id || 'Unknown', item.count]));
    const inspectionsByStatus = Object.fromEntries(inspections.map((item) => [item._id || 'Unknown', item.count]));

    const summary = buildDashboardSummary({
      totalTestRuns,
      totalPumps,
      totalInspections,
      testRunsByStatus,
      pumpsByStatus,
      inspectionsByStatus,
      recentUsers,
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
