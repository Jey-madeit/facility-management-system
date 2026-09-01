const XLSX = require ('xlsx');

const formatTimeTo12Hour = (timeStr) => {
  if (!timeStr || timeStr === 'N/A') return timeStr;
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
};

const createExcelBuffer = (data, sheetName, headers) => {
  const ws_data = [headers, ...data];
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
};

const exportTestRunsToExcel = (testRuns) => {
  const data = testRuns.map((run) => [
    //run._id.toString(),
    //run.userId.username || 'N/A',
    new Date(run.testDate || run.createdAt).toLocaleDateString('en-US',
      { day: '2-digit', month: 'short', year: 'numeric' }
    ),
    run.testTime || '',
    run.stopTime || '',
    run.generatorSet || '',
    run.status || '',
    run.hourRun || '',
    run.engineTemperature || '',
    run.oilPressure || '',
    run.llVoltage || '',
    run.lnVoltage || '',
    run.loadCurrent || '',
    run.engineSpeed || '',
    run.engineFrequency || '',
    run.realPower || '',
    run.apparentPower || '',
    run.batteryVoltage || '',
    run.comments || '',
  ]);

  const headers = [
    //'ID',
    //'User',
    'Date',
    'Time',
    'Stop Time',
    'Generator Set',
    'Status',
    'Hour Run (HR)',
    'Engine Temperature',
    'Oil Pressure',
    'L-L Voltage (L-L V)',
    'L-N Voltage(L-N V)',
    'Load Current (A)',
    'Engine Speed (RPM)',
    'Engine Frequency (HZ)',
    'Real Power (KW)',
    'Apparent Power (KVA)',
    'Battery Voltage (VDC)',
    'Comments'
  ];
  return createExcelBuffer(data, 'Test Runs', headers);
};

const exportBoosterPumpsToExcel = (pumps) => {
  const data = pumps.map((pump) => [
    //pump._id.toString(),
    //pump.userId.username || 'N/A',
    pump.startDate ? new Date(pump.startDate).toLocaleDateString('en-US',
      { day: '2-digit', month: 'short', year: 'numeric' }
    ) : 'N/A',
    pump.pumpNo,
    formatTimeTo12Hour(pump.startTime),
    pump.status,
    pump.stopDate ? new Date(pump.stopDate).toLocaleDateString('en-US',
      { day: '2-digit', month: 'short', year: 'numeric' }
    ) : 'N/A',
    formatTimeTo12Hour(pump.stopTime),
    pump.failureAlarm || 'N/A',
    pump.totalHours || 'N/A',
    pump.comments || '',
    //new Date(pump.createdAt).toLocaleDateString(),
  ]);

  const headers = [
    //'ID', 
    //'User', 
    'Start Date', 
    'Pump No./(HP)',  
    'Start Time', 
    'Status', 
    'Stop Date', 
    'Stop Time', 
    'Failure Alarm', 
    'Total Hours', 
    'Comments', 
    // 'Date'
  ];
  return createExcelBuffer(data, 'Booster Pumps', headers);
};

const exportDailyInspectionsToExcel = (inspections) => {
  // Ensure inspections is an array
  if (!Array.isArray(inspections)) {
    throw new Error('Expected inspections to be an array');
  }

  // Handle empty array case
  if (inspections.length === 0) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([['No data available']]);
    XLSX.utils.book_append_sheet(wb, ws, 'Daily Inspections');
    return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  }

  // Define field definitions with labels and value extractors
  const fieldDefinitions = [
    // { label: 'ID', getValue: (i) => i._id.toString() },
    //{ label: 'User', getValue: (i) => i.userId.username || 'N/A' },
    { label: 'Inspection Date', getValue: (i) => new Date(i.inspectionDate).toLocaleDateString('en-US',
      { day: '2-digit', month: 'short', year: 'numeric' }
    ) },
    {label: 'External Assets:', getValue: () => 'COMMENTS/OBSERVATIONS'},

    // External Assets - Generator
    { label: 'Cummins Generator Availability', getValue: (i) => i.externalAssets?.cumminsGeneratorAvailability || '' },
    { label: 'Cat Generator Availability', getValue: (i) => i.externalAssets?.catGeneratorAvailability || '' },
    { label: 'Cummins Generator Running Hours', getValue: (i) => i.externalAssets?.cumminsGeneratorRunningHours || '' },
    { label: 'Cat Generator Running Hours', getValue: (i) => i.externalAssets?.catGeneratorRunningHours || '' },
    { label: 'Cummins Remaining Hours', getValue: (i) => i.externalAssets?.cumminsRemainingHours || '' },
    { label: 'Cat Remaining Hours', getValue: (i) => i.externalAssets?.catRemainingHours || '' },
    { label: 'External Diesel Tank Fuel Level', getValue: (i) => i.externalAssets?.externalDieselTankFuelLevel || '' },
    // External Assets - Conditions
    { label: 'Cummins Radiator Tank', getValue: (i) => i.externalAssets?.cumminsRadiatorTankCondition || '' },
    { label: 'Cat Radiator Tank', getValue: (i) => i.externalAssets?.catRadiatorTankCondition || '' },
    { label: 'Cummins Air Filter', getValue: (i) => i.externalAssets?.cumminsAirFilterCondition || '' },
    { label: 'Cat Air Filter', getValue: (i) => i.externalAssets?.catAirFilterCondition || '' },
    { label: 'Cummins Oil Level', getValue: (i) => i.externalAssets?.cumminsOilLevel || '' },
    { label: 'Cat Oil Level', getValue: (i) => i.externalAssets?.catOilLevel || '' },
    { label: 'Cummins Coolant Level', getValue: (i) => i.externalAssets?.cumminsCoolantLevel || '' },
    { label: 'Cat Coolant Level', getValue: (i) => i.externalAssets?.catCoolantLevel || '' },
    { label: 'Cummins Battery Voltage', getValue: (i) => i.externalAssets?.cumminsBatteryVoltage || '' },
    { label: 'Cat Battery Voltage', getValue: (i) => i.externalAssets?.catBatteryVoltage || '' },
    { label: 'Cummins Control Panel', getValue: (i) => i.externalAssets?.cumminsPendingAlarms || '' },
    { label: 'Cat Control Panel', getValue: (i) => i.externalAssets?.catPendingAlarms || '' },
    { label: 'Cummins Drive Belt Damage', getValue: (i) => i.externalAssets?.cumminsDriveBeltDamage || '' },
    { label: 'Cat Drive Belt Damage', getValue: (i) => i.externalAssets?.catDriveBeltDamage || '' },
    { label: 'Cummins Electrical Connections', getValue: (i) => i.externalAssets?.cumminsElectricalConnections || '' },
    { label: 'Cat Electrical Connections', getValue: (i) => i.externalAssets?.catElectricalConnections || '' },
    { label: 'Cummins Unusual Noise', getValue: (i) => i.externalAssets?.cumminsUnusualNoise || '' },
    { label: 'Cat Unusual Noise', getValue: (i) => i.externalAssets?.catUnusualNoise || '' },
    { label: 'Cummins Generator Voltage', getValue: (i) => i.externalAssets?.cumminsGeneratorVoltage || '' },
    { label: 'Cat Generator Voltage', getValue: (i) => i.externalAssets?.catGeneratorVoltage || '' },
    // AVR
    { label: 'AVR Operational', getValue: (i) => i.externalAssets?.avrOperational || '' },
    { label: 'AVR Input Voltage LL', getValue: (i) => i.externalAssets?.avrInputVoltageLL || '' },
    { label: 'AVR Output Voltage LL', getValue: (i) => i.externalAssets?.avrOutputVoltageLL || '' },
    { label: 'AVR Input Voltage LN', getValue: (i) => i.externalAssets?.avrInputVoltageLN || '' },
    { label: 'AVR Output Voltage LN', getValue: (i) => i.externalAssets?.avrOutputVoltageLN || '' },
    { label: 'AVR Alarm', getValue: (i) => i.externalAssets?.avrAlarm || '' },
    { label: 'Cummins Frequency', getValue: (i) => i.externalAssets?.cumminsFrequency || '' },
    { label: 'Cat Frequency', getValue: (i) => i.externalAssets?.catFrequency || '' },
    // Water Tank & Pumps
    { label: 'Water Tank Level @10000', getValue: (i) => i.externalAssets?.waterTankLevel10000 || '' },
    { label: 'Water Tank Level @7000', getValue: (i) => i.externalAssets?.waterTankLevel7000 || '' },
    { label: 'Pedrolo Pump 1 Pressure', getValue: (i) => i.externalAssets?.pedroloPump1Pressure || '' },
    { label: 'Pedrolo Pump 2 Pressure', getValue: (i) => i.externalAssets?.pedroloPump2Pressure || '' },
    { label: 'Pedrolo Pump 1 Report', getValue: (i) => i.externalAssets?.pedroloPump1Report || '' },
    { label: 'Pedrolo Pump 2 Report', getValue: (i) => i.externalAssets?.pedroloPump2Report || '' },
    // Facility Areas
    { label: 'Security Post', getValue: (i) => i.externalAssets?.securityPost || '' },
    { label: 'Drivers Room', getValue: (i) => i.externalAssets?.driversRoom || '' },
    { label: 'Main Compound Observations', getValue: (i) => i.externalAssets?.mainCompoundObservations || '' },
    { label: 'Solid Waste Area Observations', getValue: (i) => i.externalAssets?.solidWasteAreaObservations || '' },
    { label: 'Car Parking Spaces', getValue: (i) => i.externalAssets?.carParkingSpaces || '' },
    {},
    // Ground Floor
    { label: 'Ground Floor:', getValue: () => 'COMMENTS/OBSERVATIONS'},
    { label: 'Lighting', getValue: (i) => i.groundFloor?.lighting || '' },
    { label: 'Air Condition', getValue: (i) => i.groundFloor?.airCondition || '' },
    { label: 'Plumbing', getValue: (i) => i.groundFloor?.plumbing || '' },
    { label: 'Glazing', getValue: (i) => i.groundFloor?.glazing || '' },
    { label: 'Workstation Cleaning', getValue: (i) => i.groundFloor?.workstationCleaning || '' },
    { label: 'Office Cleaning', getValue: (i) => i.groundFloor?.officeCleaning || '' },
    { label: 'Male Washroom', getValue: (i) => i.groundFloor?.maleWashroom || '' },
    { label: 'Female Washroom', getValue: (i) => i.groundFloor?.femaleWashroom || '' },
    { label: 'Open Office Ground', getValue: (i) => i.groundFloor?.openOfficeGround || '' },
    { label: 'Managers Offices Ground', getValue: (i) => i.groundFloor?.managersOfficesGround || '' },
    { label: 'Cafeteria', getValue: (i) => i.groundFloor?.cafeteria || '' },
    { label: 'General Observations', getValue: (i) => i.groundFloor?.generalObservations || '' },
    {},
    // First Floor
    { label: 'First Floor:', getValue: () => 'COMMENTS/OBSERVATIONS' },
    { label: ' Lighting', getValue: (i) => i.firstFloor?.lighting || '' },
    { label: ' Air Condition', getValue: (i) => i.firstFloor?.airCondition || '' },
    { label: ' Glazing', getValue: (i) => i.firstFloor?.glazing || '' },
    { label: ' Training Room', getValue: (i) => i.firstFloor?.trainingRoom || '' },
    { label: ' Emergency Command Centre', getValue: (i) => i.firstFloor?.emergencyCommandCentre || '' },
    { label: ' Workstation Cleaning', getValue: (i) => i.firstFloor?.workstationCleaning || '' },
    { label: ' Office Cleaning', getValue: (i) => i.firstFloor?.officeCleaning || '' },
    { label: ' Male Washroom', getValue: (i) => i.firstFloor?.maleWashroom || '' },
    { label: ' Female Washroom', getValue: (i) => i.firstFloor?.femaleWashroom || '' },
    { label: 'Open Office 1st', getValue: (i) => i.firstFloor?.openOffice1st || '' },
    { label: 'Managers Offices 1st', getValue: (i) => i.firstFloor?.managersOffices1st || '' },
    { label: 'Reception', getValue: (i) => i.firstFloor?.reception || '' },
    { label: ' General Observations', getValue: (i) => i.firstFloor?.generalObservations || '' },
    {},
    // Second Floor
    { label: 'Second Floor:', getValue: () => 'COMMENTS/OBSERVATIONS' },
    { label: 'Lighting', getValue: (i) => i.secondFloor?.lighting || '' },
    { label: 'Air Condition', getValue: (i) => i.secondFloor?.airCondition || '' },
    { label: 'Glazing', getValue: (i) => i.secondFloor?.glazing || '' },
    { label: 'Workstation Cleaning', getValue: (i) => i.secondFloor?.workstationCleaning || '' },
    { label: 'Office Cleaning', getValue: (i) => i.secondFloor?.officeCleaning || '' },
    { label: 'Board Room', getValue: (i) => i.secondFloor?.boardRoom || '' },
    { label: 'Male Washroom', getValue: (i) => i.secondFloor?.maleWashroom || '' },
    { label: 'Female Washroom', getValue: (i) => i.secondFloor?.femaleWashroom || '' },
    { label: 'SMT Offices', getValue: (i) => i.secondFloor?.smtOffices || '' },

    { label: 'Open Office 2nd', getValue: (i) => i.secondFloor?.openOffice2nd || '' },
    { label: 'Managers Offices 2nd', getValue: (i) => i.secondFloor?.managersOffices2nd || '' },
    
    { label: 'Kitchen Cafeteria', getValue: (i) => i.secondFloor?.kitchenCafeteria || '' },
    
    { label: 'General Observations', getValue: (i) => i.secondFloor?.generalObservations || '' },
    { label: 'Supervisor Comments', getValue: (i) => i.secondFloor?.supervisorComments || '' },
    //{ label: 'Status', getValue: (i) => Array.isArray(i.status) ? i.status.join(', ') : (i.status || '') },
  ];

  // Build transposed data: each row is [label, inspection1_value, inspection2_value, ...]
  const wsData = fieldDefinitions.map((field) => {
    const row = [field.label];
    inspections.forEach((inspection) => {
      try {
        row.push(field.getValue(inspection));
      } catch (err) {
        row.push('');
      }
    });
    return row;
  });

  // Create workbook with transposed sheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Daily Inspections');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
};

const exportReportToExcel = (report) => {
  // Create workbook with multiple sheets
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryData = [
    ['Total Test Runs', report.totalCount],
    [],
    ['Status Breakdown'],
    ...Object.entries(report.byStatus).map(([status, count]) => [status, count]),
    [],
    ['User Breakdown'],
    ...Object.entries(report.byUser).map(([user, runs]) => [user, runs.length]),
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Sheet 2: Detailed Data
  const detailedData = report.data.map((run) => [
    //run._id.toString(),
    //run.userId.username || 'N/A',
    run.status,
    new Date(run.testDate || run.createdAt).toLocaleDateString(),
    run.testTime || '',
    run.stopTime || '',
    run.generatorSet || '',
    run.hourRun || '',
    run.engineTemperature || '',
    run.oilPressure || '',
    run.llVoltage || '',
    run.lnVoltage || '',
    run.loadCurrent || '',
    run.engineSpeed || '',
    run.engineFrequency || '',
    run.realPower || '',
    run.apparentPower || '',
    run.batteryVoltage || '',
    run.comments || '',
  ]);
  const wsDetailed = XLSX.utils.aoa_to_sheet([
    [
      //'ID',
      //'User',
      'Status',
      'Date',
      'Time',
      'Stop Time',
      'Generator Set',
      'Hour Run (HR)',
      'Engine Temperature',
      'Oil Pressure',
      'L-L Voltage',
      'L-N Voltage',
      'Load Current (A)',
      'Engine Speed (RPM)',
      'Engine Frequency (HZ)',
      'Real Power (KW)',
      'Apparent Power (KVA)',
      'Battery Voltage (VDC)',
      'Comments'
    ],
    ...detailedData,
  ]);
  XLSX.utils.book_append_sheet(wb, wsDetailed, 'Detailed');

  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
};

const exportBoosterPumpsReportToExcel = (report) => {
  // Create workbook with multiple sheets
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryData = [
    ['Total Booster Pumps', report.totalCount],
    [],
    ['Status Breakdown'],
    ...Object.entries(report.byStatus).map(([status, count]) => [status, count]),
    [],
    ['User Breakdown'],
    ...Object.entries(report.byUser).map(([user, pumps]) => [user, pumps.length]),
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Sheet 2: Detailed Data
  const detailedData = report.data.map((pump) => [
    //pump._id.toString(),
    //pump.userId.username || 'N/A',
    pump.startDate ? new Date(pump.startDate).toLocaleDateString() : 'N/A',
    pump.pumpNo,
    formatTimeTo12Hour(pump.startTime),
    pump.status,
    pump.stopDate ? new Date(pump.stopDate).toLocaleDateString() : 'N/A',
    formatTimeTo12Hour(pump.stopTime),
    pump.failureAlarm || 'N/A',
    pump.totalHours || 'N/A',
    pump.comments || '',
    //new Date(pump.createdAt).toLocaleDateString(),
  ]);
  const wsDetailed = XLSX.utils.aoa_to_sheet([
    [
      //'ID', 
      //'User', 
      'Start Date', 
      'Pump No',  
      'Start Time', 
      'Status', 
      'Stop Date', 
      'Stop Time', 
      'Failure Alarm', 
      'Total Hours', 
      'Comments', 
      // 'Date'
    ],
    ...detailedData,
  ]);
  XLSX.utils.book_append_sheet(wb, wsDetailed, 'Detailed');

  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
};

const exportDailyInspectionsReportToExcel = (report) => {
  // Create workbook with multiple sheets
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryData = [
    ['Total Daily Inspections', report.totalCount],
    [],
    ['Status Breakdown'],
    ...Object.entries(report.byStatus).map(([status, count]) => [status, count]),
    [],
    ['User Breakdown'],
    ...Object.entries(report.byUser).map(([user, inspections]) => [user, inspections.length]),
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Sheet 2: Detailed Data
  const detailedData = report.data.map((inspection) => [
    //inspection._id.toString(),
    inspection.inspectionDate ? new Date(inspection.inspectionDate).toLocaleDateString('en-US', 
      { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
      // General Items - Generator
    inspection || 'Comments',
    inspection.externalAssets?.cumminsGeneratorAvailability || '',
    inspection.externalAssets?.catGeneratorAvailability || '',
    inspection.externalAssets?.cumminsGeneratorRunningHours || '',
    inspection.externalAssets?.catGeneratorRunningHours || '',
    inspection.externalAssets?.cumminsRemainingHours || '',
    inspection.externalAssets?.catRemainingHours || '',
    inspection.externalAssets?.externalDieselTankFuelLevel || '',
    // General Items - Conditions
    inspection.externalAssets?.cumminsRadiatorTankCondition || '',
    inspection.externalAssets?.catRadiatorTankCondition || '',
    inspection.externalAssets?.cumminsAirFilterCondition || '',
    inspection.externalAssets?.catAirFilterCondition || '',
    inspection.externalAssets?.cumminsOilLevel || '',
    inspection.externalAssets?.catOilLevel || '',
    inspection.externalAssets?.cumminsCoolantLevel || '',
    inspection.externalAssets?.catCoolantLevel || '',
    inspection.externalAssets?.cumminsBatteryVoltage || '',
    inspection.externalAssets?.catBatteryVoltage || '',
    inspection.externalAssets?.cumminsPendingAlarms || '',
    inspection.externalAssets?.catPendingAlarms || '',
    inspection.externalAssets?.cumminsDriveBeltDamage || '',
    inspection.externalAssets?.catDriveBeltDamage || '',
    inspection.externalAssets?.cumminsElectricalConnections || '',
    inspection.externalAssets?.catElectricalConnections || '',
    inspection.externalAssets?.cumminsUnusualNoise || '',
    inspection.externalAssets?.catUnusualNoise || '',
    inspection.externalAssets?.cumminsGeneratorVoltage || '',
    inspection.externalAssets?.catGeneratorVoltage || '',
    // AVR
    inspection.externalAssets?.avrOperational || '',
    inspection.externalAssets?.avrInputVoltageLL || '',
    inspection.externalAssets?.avrOutputVoltageLL || '',
    inspection.externalAssets?.avrInputVoltageLN || '',
    inspection.externalAssets?.avrOutputVoltageLN || '',
    inspection.externalAssets?.avrAlarm || '',
    inspection.externalAssets?.cumminsFrequency || '',
    inspection.externalAssets?.catFrequency || '',
    // Water Tank & Pumps
    inspection.externalAssets?.waterTankLevel10000 || '',
    inspection.externalAssets?.waterTankLevel7000 || '',
    inspection.externalAssets?.pedroloPump1Pressure || '',
    inspection.externalAssets?.pedroloPump2Pressure || '',
    inspection.externalAssets?.pedroloPump1Report || '',
    inspection.externalAssets?.pedroloPump2Report || '',
    // Facility Areas
    inspection.externalAssets?.securityPost || '',
    inspection.externalAssets?.driversRoom || '',
    inspection.externalAssets?.mainCompoundObservations || '',
    inspection.externalAssets?.solidWasteAreaObservations || '',
    inspection.externalAssets?.carParkingSpaces || '',
    // Ground Floor
    inspection.groundFloor?.lighting || '',
    inspection.groundFloor?.airCondition || '',
    inspection.groundFloor?.plumbing || '',
    inspection.groundFloor?.glazing || '',
    inspection.groundFloor?.workstationCleaning || '',
    inspection.groundFloor?.officeCleaning || '',
    inspection.groundFloor?.maleWashroom || '',
    inspection.groundFloor?.femaleWashroom || '',
    inspection.groundFloor?.cafeteria || '',
    inspection.groundFloor?.openOfficeGround || '',
    inspection.groundFloor?.managersOfficesGround || '',
    inspection.groundFloor?.generalObservations || '',
    // First Floor
    inspection.firstFloor?.lighting || '',
    inspection.firstFloor?.airCondition || '',
    inspection.firstFloor?.glazing || '',
    inspection.firstFloor?.trainingRoom || '',
    inspection.firstFloor?.emergencyCommandCentre || '',
    inspection.firstFloor?.workstationCleaning || '',
    inspection.firstFloor?.officeCleaning || '',
    inspection.firstFloor?.maleWashroom || '',
    inspection.firstFloor?.femaleWashroom || '',
    inspection.firstFloor?.openOffice1st || '',
    inspection.firstFloor?.managersOffices1st || '',
    inspection.firstFloor?.reception || '',
    inspection.firstFloor?.generalObservations || '',
    // Second Floor
    inspection.secondFloor?.lighting || '',
    inspection.secondFloor?.airCondition || '',
    inspection.secondFloor?.glazing || '',
    inspection.secondFloor?.workstationCleaning || '',
    inspection.secondFloor?.officeCleaning || '',
    inspection.secondFloor?.boardRoom || '',
    inspection.secondFloor?.maleWashroom || '',
    inspection.secondFloor?.femaleWashroom || '',
    inspection.secondFloor?.smtOffices || '',
    inspection.secondFloor?.openOffice2nd || '',
    inspection.secondFloor?.managersOffices2nd || '',
    inspection.secondFloor?.kitchenCafeteria || '',
    inspection.secondFloor?.generalObservations || '',
    inspection.secondFloor?.supervisorComments || '',
    //Array.isArray(inspection.status) ? inspection.status.join(', ') : (inspection.status || ''),
  ]);
  const wsDetailed = XLSX.utils.aoa_to_sheet([
    [/*'ID', 'User',*/ 'Inspection Date',
    // General Items - Generator
    'Cummins Gen Availability', 'Cat Gen Availability', 'Cummins Gen Running Hours', 'Cat Gen Running Hours',
    'Cummins Remaining Hours', 'Cat Remaining Hours', 'External Diesel Tank Fuel Level',
    // General Items - Conditions
    'Cummins Radiator Tank', 'Cat Radiator Tank', 'Cummins Air Filter', 'Cat Air Filter',
    'Cummins Oil Level', 'Cat Oil Level', 'Cummins Coolant Level', 'Cat Coolant Level',
    'Cummins Battery Voltage', 'Cat Battery Voltage', 'Cummins Pending Alarms', 'Cat Pending Alarms',
    'Cummins Drive Belt Damage', 'Cat Drive Belt Damage', 'Cummins Electrical Connections', 'Cat Electrical Connections',
    'Cummins Unusual Noise', 'Cat Unusual Noise', 'Cummins Generator Voltage', 'Cat Generator Voltage',
    // AVR
    'AVR Operational', 'AVR Input Voltage LL', 'AVR Output Voltage LL', 'AVR Input Voltage LN', 'AVR Output Voltage LN',
    'AVR Alarm', 'Cummins Frequency', 'Cat Frequency',
    // Water Tank & Pumps
    'Water Tank', 'Level @10000', 'Level @7000', 'Pedrolo Pump 1 Pressure', 'Pedrolo Pump 2 Pressure',
    'Pedrolo Pump 1 Report', 'Pedrolo Pump 2 Report',
    // Facility Areas
    'Security Post', 'Drivers Room', 'Main Compound Observations', 'Solid Waste Area Observations', 'Car Parking Spaces',
    // Ground Floor
    'GF Lighting', 'GF Air Condition', 'GF Plumbing', 'GF Glazing', 'GF Workstation Cleaning',
    'GF Office Cleaning', 'GF Male Washroom', 'GF Female Washroom', 'GF Cafeteria', 'GF Open Office Ground',
    'GF Managers Offices Ground', 'GF Reception', 'GF General Observations',
    // First Floor
    '1F Lighting', '1F Air Condition', '1F Glazing', '1F Training Room', '1F Emergency Command Centre',
    '1F Workstation Cleaning', '1F Office Cleaning', '1F Male Washroom', '1F Female Washroom',  '1F Open Office 1st',
    '1F Managers Offices 1st', '1F General Observations',
    // Second Floor
    '2F Lighting', '2F Air Condition', '2F Glazing', '2F Workstation Cleaning', '2F Office Cleaning',
    '2F Board Room', '2F Male Washroom', '2F Female Washroom', '2F SMT Offices',  '2F Open Office 2nd', '2F Managers Offices 2nd', , '2F Kitchen Cafeteria', '2F General Observations', '2F Supervisor Comments',
    'Status'],
    ...detailedData,
  ]);
  XLSX.utils.book_append_sheet(wb, wsDetailed, 'Detailed');

  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
};

module.exports = {
  exportTestRunsToExcel,
  exportBoosterPumpsToExcel,
  exportDailyInspectionsToExcel,
  exportReportToExcel,
  exportBoosterPumpsReportToExcel,
  exportDailyInspectionsReportToExcel,
};
