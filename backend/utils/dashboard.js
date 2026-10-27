const buildDashboardSummary = ({
  totalTestRuns = 0,
  totalPumps = 0,
  totalInspections = 0,
  totalAvrRecordings = 0,
  testRunsByStatus = {},
  pumpsByStatus = {},
  inspectionsByStatus = {},
  avrByStatus = {},
  recentUsers = [],
}) => {
  const totalRecords = totalTestRuns + totalPumps + totalInspections + totalAvrRecordings;

  return {
    totalRecords,
    totalTestRuns,
    totalPumps,
    totalInspections,
    totalAvrRecordings,
    testRunStatusCounts: testRunsByStatus,
    pumpStatusCounts: pumpsByStatus,
    inspectionStatusCounts: inspectionsByStatus,
    avrStatusCounts: avrByStatus,
    recentUsers,
    generatedAt: new Date().toISOString(),
  };
};

module.exports = { buildDashboardSummary };
