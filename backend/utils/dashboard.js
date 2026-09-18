const buildDashboardSummary = ({
  totalTestRuns = 0,
  totalPumps = 0,
  totalInspections = 0,
  testRunsByStatus = {},
  pumpsByStatus = {},
  inspectionsByStatus = {},
  recentUsers = [],
}) => {
  const totalRecords = totalTestRuns + totalPumps + totalInspections;

  return {
    totalRecords,
    totalTestRuns,
    totalPumps,
    totalInspections,
    testRunStatusCounts: testRunsByStatus,
    pumpStatusCounts: pumpsByStatus,
    inspectionStatusCounts: inspectionsByStatus,
    recentUsers,
    generatedAt: new Date().toISOString(),
  };
};

module.exports = { buildDashboardSummary };
