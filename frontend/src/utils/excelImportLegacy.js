import * as XLSX from 'xlsx';

/**
 * Maps Excel item names to dot-notation paths for the DailyInspection model
 * Note: Ambiguous items like "Lighting", "Male Washroom", etc. that appear
 * in multiple sections are handled in getMappedFieldPath() with section context
 */
const dateFormat = { 
  'inspectionDate': { day: '2-digit', month: 'short', year: 'numeric' }
};
const itemToFieldMapping = {
  'Cummins Generator Availability': 'externalAssets.cumminsGeneratorAvailability',
  'Cat Generator Availability': 'externalAssets.catGeneratorAvailability',
  'Cummins Generator Running Hours': 'externalAssets.cumminsGeneratorRunningHours',
  'Cat Generator Running Hours': 'externalAssets.catGeneratorRunningHours',
  'Cummins Remaining Hours': 'externalAssets.cumminsRemainingHours',
  'Cat Remaining Hours': 'externalAssets.catRemainingHours',
  'External Diesel Tank Fuel Level': 'externalAssets.externalDieselTankFuelLevel',
  'Cummins Radiator Tank': 'externalAssets.cumminsRadiatorTankCondition',
  'Cat Radiator Tank': 'externalAssets.catRadiatorTankCondition',
  'Cummins Air Filter': 'externalAssets.cumminsAirFilterCondition',
  'Cat Air Filter': 'externalAssets.catAirFilterCondition',
  'Cummins Oil Level': 'externalAssets.cumminsOilLevel',
  'Cat Oil Level': 'externalAssets.catOilLevel',
  'Cummins Coolant Level': 'externalAssets.cumminsCoolantLevel',
  'Cat Coolant Level': 'externalAssets.catCoolantLevel',
  'Cummins Battery Voltage': 'externalAssets.cumminsBatteryVoltage',
  'Cat Battery Voltage': 'externalAssets.catBatteryVoltage',
  'Cummins Control Panel': 'externalAssets.cumminsPendingAlarms',
  'Cat Control Panel': 'externalAssets.catPendingAlarms',
  'Cummins Drive Belt Damage': 'externalAssets.cumminsDriveBeltDamage',
  'Cat Drive Belt Damage': 'externalAssets.catDriveBeltDamage',
  'Cummins Electrical Connections': 'externalAssets.cumminsElectricalConnections',
  'Cat Electrical Connections': 'externalAssets.catElectricalConnections',
  'Cummins Unusual Noise': 'externalAssets.cumminsUnusualNoise',
  'Cat Unusual Noise': 'externalAssets.catUnusualNoise',
  'Cummins Generator Voltage': 'externalAssets.cumminsGeneratorVoltage',
  'Cat Generator Voltage': 'externalAssets.catGeneratorVoltage',
  'AVR Operational': 'externalAssets.avrOperational',
  'AVR Input Voltage LL': 'externalAssets.avrInputVoltageLL',
  'AVR Output Voltage LL': 'externalAssets.avrOutputVoltageLL',
  'AVR Input Voltage LN': 'externalAssets.avrInputVoltageLN',
  'AVR Output Voltage LN': 'externalAssets.avrOutputVoltageLN',
  'AVR Alarm': 'externalAssets.avrAlarm',
  'Cummins Frequency': 'externalAssets.cumminsFrequency',
  'Cat Frequency': 'externalAssets.catFrequency',
  'Water Tank Level @10000': 'externalAssets.waterTankLevel10000',
  'Water Tank Level @7000': 'externalAssets.waterTankLevel7000',
  'Pedrolo Pump 1 Pressure': 'externalAssets.pedroloPump1Pressure',
  'Pedrolo Pump 2 Pressure': 'externalAssets.pedroloPump2Pressure',
  'Pedrolo Pump 1 Report': 'externalAssets.pedroloPump1Report',
  'Pedrolo Pump 2 Report': 'externalAssets.pedroloPump2Report',
  'Security Post': 'externalAssets.securityPost',
  'Drivers Room': 'externalAssets.driversRoom',
  'Main Compound Observations': 'externalAssets.mainCompoundObservations',
  'Solid Waste Area Observations': 'externalAssets.solidWasteAreaObservations',
  'Car Parking Spaces': 'externalAssets.carParkingSpaces',
  // Note: Section-specific items handled in getMappedFieldPath()
};

/**
 * Converts Excel serial date number or string to JavaScript Date
 */
function excelDateToJSDate(excelDate) {
  if (excelDate === null || excelDate === undefined || excelDate === '') {
    return null;
  }

  // Handle numeric Excel serial dates
  if (typeof excelDate === 'number') {
    // Excel epoch is 1900-01-01
    const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
    if (!Number.isNaN(jsDate.getTime())) {
      return jsDate;
    }
  }

  // Handle string dates (from text-formatted Excel cells)
  if (typeof excelDate === 'string') {
    const trimmed = String(excelDate).trim();
    if (trimmed) {
      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }

  return null;
}

/**
 * Parse legacy horizontal Excel format (dates as columns)
 */
export async function parseLegacyExcelFormat(file) {
  if (!file) return { rows: [], headers: [] };

  const name = file.name?.toLowerCase?.() || '';
  const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls');
  if (!isExcel) {
    throw new Error('Only Excel files (.xlsx, .xls) are supported.');
  }

  const arrayBuffer = await file.arrayBuffer();
  // Enable cellComments to read comments from cells
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellComments: true });
  if (!Array.isArray(workbook.SheetNames) || workbook.SheetNames.length === 0) {
    return { rows: [], headers: [] };
  }

  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: '' });

  if (!Array.isArray(data) || data.length < 2) {
    return { rows: [], headers: [] };
  }

  // Row 0 contains: "Date:" and date values
  // Row 1 contains headers (ITEM, COMMENTS, COMMENTS, ...)
  // Rows 2+ contain data

  const headerRow = data[0] || [];
  const dateValues = headerRow.slice(1); // Skip first "Date:" cell

  // Extract dates from first row
  const dates = dateValues
    .filter(d => d !== null && d !== undefined && d !== '')
    .map(d => {
      const result = excelDateToJSDate(d);
      return result;
    })
    .filter(d => d !== null);

  if (dates.length === 0) {
    console.warn('No valid dates found in first row. Raw values:', dateValues);
    throw new Error('No valid dates found in Excel file. Expected dates in first row.');
  }

  // Extract item names starting from row 2 (skip "Date" row 0 and "Item:" row 1)
  const itemsStartRow = 2;
  const transformedRows = [];

  for (let dateIdx = 0; dateIdx < dates.length; dateIdx++) {
    const inspectionObj = {
      inspectionDate: dates[dateIdx].toLocaleDateString('en-US', 
        { day: '2-digit', month: 'short', year: 'numeric' }),
      externalAssets: {},
      groundFloor: {},
      firstFloor: {},
      secondFloor: {},
    };

    // Reset section tracking for each date
    let activeSection = 'externalAssets';

    // Go through each item row
    for (let rowIdx = itemsStartRow; rowIdx < data.length; rowIdx++) {
      const row = data[rowIdx];
      const itemName = row[0] ? String(row[0]).trim() : '';
      const itemValue = row[dateIdx + 1] ? String(row[dateIdx + 1]).trim() : '';
      
      // Extract cell comment if it exists
      const cellAddress = XLSX.utils.encode_cell({ r: rowIdx, c: dateIdx + 1 });
      const cell = worksheet[cellAddress];
      let cellComment = '';
      if (cell?.c) {
        cellComment = cell.c.map(c => c.t || c).join('\n');
      }
      
      // Append comment to item value if it exists
      const itemValueWithComment = cellComment ? `${itemValue}${itemValue ? ' | ' : ''}(Note: ${cellComment})` : itemValue;

      if (!itemName) continue;

      // Update section based on section headers (handles multiple spaces)
      const lowerItemName = itemName.toLowerCase();
      if (/ground\s+floor/i.test(lowerItemName)) {
        activeSection = 'groundFloor';
        continue;
      } else if (/first\s+floor/i.test(lowerItemName)) {
        activeSection = 'firstFloor';
        continue;
      } else if (/second\s+floor/i.test(lowerItemName)) {
        activeSection = 'secondFloor';
        continue;
      }

      // Get mapped field path based on current section
      let fieldPath = getMappedFieldPath(itemName, activeSection);

      if (!fieldPath) {
        continue; // Skip unmapped items
      }

      if (fieldPath === null) {
        continue; // Skip section headers
      }

      // Set value using dot notation (use value with comment if comment exists)
      setNestedValue(inspectionObj, fieldPath, itemValueWithComment);
    }

    transformedRows.push(inspectionObj);
  }

  // Convert to header format for display
  const headers = Object.keys(transformedRows[0] || {});

  return { rows: transformedRows, headers };
}

/**
 * Set a nested object value using dot notation
 * e.g., setNestedValue(obj, 'externalAssets.cumminsGeneratorAvailability', 'Yes')
 */
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * Get mapped field path based on item name and current section context
 */
function getMappedFieldPath(itemName, section) {
  // For section-specific items, build the path
  const sectionSpecificMappings = {
    'inspectionDate': dateFormat.inspectionDate,
    externalAssets: {
      'Cummins Generator Availability': 'externalAssets.cumminsGeneratorAvailability',
    'Cat Generator Availability': 'externalAssets.catGeneratorAvailability',
    'Cummins Generator Running Hours': 'externalAssets.cumminsGeneratorRunningHours',
    'Cat Generator Running Hours': 'externalAssets.catGeneratorRunningHours',
    'Cummins Remaining Hours': 'externalAssets.cumminsRemainingHours',
    'Cat Remaining Hours': 'externalAssets.catRemainingHours',
    'External Diesel Tank Fuel Level': 'externalAssets.externalDieselTankFuelLevel',
    'Cummins Radiator Tank': 'externalAssets.cumminsRadiatorTankCondition',
    'Cat Radiator Tank': 'externalAssets.catRadiatorTankCondition',
    'Cummins Air Filter': 'externalAssets.cumminsAirFilterCondition',
    'Cat Air Filter': 'externalAssets.catAirFilterCondition',
    'Cummins Oil Level': 'externalAssets.cumminsOilLevel',
    'Cat Oil Level': 'externalAssets.catOilLevel',
    'Cummins Coolant Level': 'externalAssets.cumminsCoolantLevel',
    'Cat Coolant Level': 'externalAssets.catCoolantLevel',
    'Cummins Battery Voltage': 'externalAssets.cumminsBatteryVoltage',
    'Cat Battery Voltage': 'externalAssets.catBatteryVoltage',
    'Cummins Control Panel': 'externalAssets.cumminsPendingAlarms',
    'Cat Control Panel': 'externalAssets.catPendingAlarms',
    'Cummins Drive Belt Damage': 'externalAssets.cumminsDriveBeltDamage',
    'Cat Drive Belt Damage': 'externalAssets.catDriveBeltDamage',
    'Cummins Electrical Connections': 'externalAssets.cumminsElectricalConnections',
    'Cat Electrical Connections': 'externalAssets.catElectricalConnections',
    'Cummins Unusual Noise': 'externalAssets.cumminsUnusualNoise',
    'Cat Unusual Noise': 'externalAssets.catUnusualNoise',
    'Cummins Generator Voltage': 'externalAssets.cumminsGeneratorVoltage',
    'Cat Generator Voltage': 'externalAssets.catGeneratorVoltage',
    'AVR Operational': 'externalAssets.avrOperational',
    'AVR Input Voltage LL': 'externalAssets.avrInputVoltageLL',
    'AVR Output Voltage LL': 'externalAssets.avrOutputVoltageLL',
    'AVR Input Voltage LN': 'externalAssets.avrInputVoltageLN',
    'AVR Output Voltage LN': 'externalAssets.avrOutputVoltageLN',
    'AVR Alarm': 'externalAssets.avrAlarm',
    'Cummins Frequency': 'externalAssets.cumminsFrequency',
    'Cat Frequency': 'externalAssets.catFrequency',
    'Water Tank Level @10000': 'externalAssets.waterTankLevel10000',
    'Water Tank Level @7000': 'externalAssets.waterTankLevel7000',
    'Pedrolo Pump 1 Pressure': 'externalAssets.pedroloPump1Pressure',
    'Pedrolo Pump 2 Pressure': 'externalAssets.pedroloPump2Pressure',
    'Pedrolo Pump 1 Report': 'externalAssets.pedroloPump1Report',
    'Pedrolo Pump 2 Report': 'externalAssets.pedroloPump2Report',
    'Security Post': 'externalAssets.securityPost',
    'Drivers Room': 'externalAssets.driversRoom',
    'Main Compound Observations': 'externalAssets.mainCompoundObservations',
    'Solid Waste Area Observations': 'externalAssets.solidWasteAreaObservations',
    'Car Parking Spaces': 'externalAssets.carParkingSpaces',
    },
    groundFloor: {
      'Lighting': 'groundFloor.lighting',
      'Air Condition': 'groundFloor.airCondition',
      'Plumbing': 'groundFloor.plumbing',
      'Glazing': 'groundFloor.glazing',
      'Workstation Cleaning': 'groundFloor.workstationCleaning',
      'Office Cleaning': 'groundFloor.officeCleaning',
      'Male Washroom': 'groundFloor.maleWashroom',
      'Female Washroom': 'groundFloor.femaleWashroom',
      'Cafeteria and Kitchen': 'groundFloor.cafeteria',
      'Open Office Ground Floor': 'groundFloor.openOfficeGround',
      'Managers Offices Ground Floor': 'groundFloor.managersOfficesGround',
      'Reception': 'groundFloor.reception',
      'General Observations': 'groundFloor.generalObservations',
    },
    firstFloor: {
      'Lighting': 'firstFloor.lighting',
      'Air Condition': 'firstFloor.airCondition',
      'Glazing': 'firstFloor.glazing',
      'Training Room': 'firstFloor.trainingRoom',
      'Emergency Command Centre': 'firstFloor.emergencyCommandCentre',
      'Workstation Cleaning': 'firstFloor.workstationCleaning',
      'Office Cleaning': 'firstFloor.officeCleaning',
      'Male Washroom': 'firstFloor.maleWashroom',
      'Female Washroom': 'firstFloor.femaleWashroom',
      'Open Office 1st Floor': 'firstFloor.openOffice1st',
      'Managers Offices 1st Floor': 'firstFloor.managersOffices1st',
      'General Observations': 'firstFloor.generalObservations',
    },
    secondFloor: {
      'Lighting': 'secondFloor.lighting',
      'Air Condition': 'secondFloor.airCondition',
      'Glazing': 'secondFloor.glazing',
      'Workstation Cleaning': 'secondFloor.workstationCleaning',
      'Office Cleaning': 'secondFloor.officeCleaning',
      'Board Room': 'secondFloor.boardRoom',
      'Male Washroom': 'secondFloor.maleWashroom',
      'Female Washroom': 'secondFloor.femaleWashroom',
      'SMT Offices': 'secondFloor.smtOffices',
      
      'Open Office 2nd Floor': 'secondFloor.openOffice2nd',
      'Managers Offices 2nd Floor': 'secondFloor.managersOffices2nd',
      
      'Kitchen/Cafeteria': 'secondFloor.kitchenCafeteria',
      
      'General Observations': 'secondFloor.generalObservations',
      'Supervisor Comments': 'secondFloor.supervisorComments',
    }
  };

  // Check if this is a section-specific mapping
  if (sectionSpecificMappings[section] && sectionSpecificMappings[section][itemName]) {
    return sectionSpecificMappings[section][itemName];
  }

  // Fall back to global mapping
  return itemToFieldMapping[itemName];
}

/**
 * Detect if Excel file uses the legacy horizontal format
 */
export function isLegacyFormat(sheet) {
  if (!Array.isArray(sheet) || sheet.length < 2) {
    return false;
  }

  const firstRow = sheet[0];
  const secondRow = sheet[1];

  // Check if first row starts with "Date" and has dates (numbers or strings)
  const startsWithDate = firstRow[0] && String(firstRow[0]).toLowerCase().includes('date');
  const hasNumericDates = firstRow.slice(1).some(cell => typeof cell === 'number');
  const hasStringDates = firstRow.slice(1).some(cell => {
    if (typeof cell !== 'string') return false;
    const trimmed = String(cell).trim();
    // Check if it looks like a date string (basic check for common date patterns)
    return /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{2,4}/.test(trimmed);
  });

  // Check if second row contains "ITEM" (case-insensitive)
  const hasItemHeader = secondRow && String(secondRow[0]).toLowerCase().includes('item');

  return startsWithDate && (hasNumericDates || hasStringDates) && hasItemHeader;
}
