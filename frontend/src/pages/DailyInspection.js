import React, { useState, useEffect, useContext } from 'react';
import { Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AuthContext } from '../contexts/AuthContext';
import { dailyInspectionService, userService } from '../services/apiService';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import SubmitConfirmationModal from '../components/SubmitConfirmationModal';
import { parseExcelFileToRows } from '../utils/excelImport';
import { parseLegacyExcelFormat, isLegacyFormat } from '../utils/excelImportLegacy';
import NavBar from '../components/NavBar';
import '../styles/DailyInspection.css';

const DailyInspection = () => {
  const { user } = useContext(AuthContext);
  const [inspections, setInspections] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [draftId, setDraftId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [importPreview, setImportPreview] = useState({ rows: [], fileName: '' });
  const [importError, setImportError] = useState('');
  const [formData, setFormData] = useState({
    externalAssets: {
      cumminsGeneratorAvailability: '',
      catGeneratorAvailability: '',
      cumminsGeneratorRunningHours: '',
      catGeneratorRunningHours: '',
      cumminsRemainingHours: '',
      catRemainingHours: '',
      externalDieselTankFuelLevel: '',
      cumminsRadiatorTankCondition: '',
      catRadiatorTankCondition: '',
      cumminsAirFilterCondition: '',
      catAirFilterCondition: '',
      cumminsOilLevel: '',
      catOilLevel: '',
      cumminsCoolantLevel: '',
      catCoolantLevel: '',
      cumminsBatteryVoltage: '',
      catBatteryVoltage: '',
      cumminsPendingAlarms: '',
      catPendingAlarms: '',
      cumminsDriveBeltDamage: '',
      catDriveBeltDamage: '',
      cumminsElectricalConnections: '',
      catElectricalConnections: '',
      cumminsUnusualNoise: '',
      catUnusualNoise: '',
      cumminsGeneratorVoltage: '',
      catGeneratorVoltage: '',
      avrOperational: '',
      avrInputVoltageLL: '',
      avrOutputVoltageLL: '',
      avrInputVoltageLN: '',
      avrOutputVoltageLN: '',
      avrAlarm: '',
      cumminsFrequency: '',
      catFrequency: '',
      waterTankLevel10000: '',
      waterTankLevel7000: '',
      pedroloPump1Pressure: '',
      pedroloPump2Pressure: '',
      pedroloPump1Report: '',
      pedroloPump2Report: '',
      securityPost: '',
      driversRoom: '',
      mainCompoundObservations: '',
      solidWasteAreaObservations: '',
      carParkingSpaces: ''
    },
    groundFloor: {
      lighting: '',
      airCondition: '',
      plumbing: '',
      glazing: '',
      workstationCleaning: '',
      officeCleaning: '',
      maleWashroom: '',
      femaleWashroom: '',
      cafeteria: '',
      openOfficeGround: '',
      managersOfficesGround: '',
      reception: '',
      generalObservations: ''
    },
    firstFloor: {
      lighting: '',
      airCondition: '',
      glazing: '',
      trainingRoom: '',
      emergencyCommandCentre: '',
      workstationCleaning: '',
      officeCleaning: '',
      maleWashroom: '',
      femaleWashroom: '',
      openOffice1st: '',
      managersOffices1st: '',
      generalObservations: ''
    },
    secondFloor: {
      lighting: '',
      airCondition: '',
      glazing: '',
      workstationCleaning: '',
      officeCleaning: '',
      boardRoom: '',
      maleWashroom: '',
      femaleWashroom: '',
      smtOffices: '',
      openOffice2nd: '',
      managersOffices2nd: '',
      kitchenCafeteria: '',
      generalObservations: '',
      supervisorComments: ''
    },
    status: ['No issues'],
    inspectionDate: ''
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
  const [submitModal, setSubmitModal] = useState(false);
  const [clearFormModal, setClearFormModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [users, setUsers] = useState([]);
  const [selectedUserForImport, setSelectedUserForImport] = useState('');
  const [/*showUserSelectionModal*/, setShowUserSelectionModal] = useState(false);
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    fetchInspections();
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user?.role]);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const response = await dailyInspectionService.getAll();
      setInspections(response.data);
    } catch (error) {
      console.error('Error fetching inspections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userService.getAll();
      // Avoid logging full user objects (may contain sensitive fields)
      console.debug('Fetched users count:', response?.data?.users?.length || 0);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
    }
  };

  const handleStartForm = () => {
    setShowForm(true);
    setCurrentStep(1);
    setDraftId(null);
  };

  const handleNext = async () => {
    if (!isCurrentStepComplete()) return;

    if (currentStep < 4) {
      // Auto-save draft
      try {
        const response = await dailyInspectionService.saveDraft(draftId, formData);
        setDraftId(response.data._id);
      } catch (error) {
        console.error('Error saving draft:', error);
      }
      setCurrentStep(currentStep + 1);
    }
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!isCurrentStepComplete()) return;
    setSubmitModal(true);
  };

  const confirmSubmit = async () => {
    try {
      setLoading(true);
      await dailyInspectionService.submit(formData, draftId);
      resetForm();
      setDraftId(null);
      setSubmitModal(false);
      fetchInspections();
    } catch (error) {
      console.error('Error submitting inspection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      const response = await dailyInspectionService.saveDraft(draftId, formData);
      setDraftId(response.data._id);
      fetchInspections();
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setLoading(false);
    }
  };

  const mergeSection = (defaultSection, draftSection) => ({
    ...defaultSection,
    ...(draftSection || {})
  });

  const handleLoadDraft = async (draftInspection) => {
    try {
      setLoading(true);
      // Load the draft data into the form
      const loadedStatus = Array.isArray(draftInspection.status)
        ? draftInspection.status.filter((item) => item !== 'Draft')
        : typeof draftInspection.status === 'string' && draftInspection.status
        ? [draftInspection.status]
        : ['No issues'];

      const normalizedStatus = loadedStatus.length > 0 ? loadedStatus : ['No issues'];

      setFormData((prev) => ({
        externalAssets: mergeSection(prev.externalAssets, draftInspection.externalAssets),
        groundFloor: mergeSection(prev.groundFloor, draftInspection.groundFloor),
        firstFloor: mergeSection(prev.firstFloor, draftInspection.firstFloor),
        secondFloor: mergeSection(prev.secondFloor, draftInspection.secondFloor),
        status: normalizedStatus,
        inspectionDate: draftInspection.inspectionDate || prev.inspectionDate
      }));
      setDraftId(draftInspection._id);
      setShowForm(true);
      setCurrentStep(1);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error loading draft:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      const response = await dailyInspectionService.generateReport();
      setReport(response.data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEmptyInspectionFromShape = () => {
    const base = JSON.parse(JSON.stringify(formData));
    ['externalAssets', 'groundFloor', 'firstFloor', 'secondFloor'].forEach((section) => {
      Object.keys(base?.[section] || {}).forEach((key) => {
        base[section][key] = '';
      });
    });
    base.status = ['No issues'];
    base.inspectionDate = '';
    return base;
  };

  const setDeepValue = (obj, path, value) => {
    if (!path) return;
    const parts = path.split('.').filter(Boolean);
    if (parts.length === 0) return;

    let cur = obj;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const p = parts[i];
      if (cur[p] === undefined || cur[p] === null || typeof cur[p] !== 'object') cur[p] = {};
      cur = cur[p];
    }
    cur[parts[parts.length - 1]] = value;
  };

  const tryParseJsonCell = (value) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return null;
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  };

  const DAILY_EXPORT_LABEL_TO_PATH = {
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
    'Lighting': 'groundFloor.lighting',
    'Air Condition': 'groundFloor.airCondition',
    'Plumbing': 'groundFloor.plumbing',
    'Glazing': 'groundFloor.glazing',
    'Workstation Cleaning': 'groundFloor.workstationCleaning',
    'Office Cleaning': 'groundFloor.officeCleaning',
    'Male Washroom': 'groundFloor.maleWashroom',
    'Female Washroom': 'groundFloor.femaleWashroom',
    'Cafeteria': 'groundFloor.cafeteria',
    'General Observations': 'groundFloor.generalObservations',
    'Training Room': 'firstFloor.trainingRoom',
    'Emergency Command Centre': 'firstFloor.emergencyCommandCentre',
    'Board Room': 'secondFloor.boardRoom',
    'SMT Offices': 'secondFloor.smtOffices',
    'Open Office 1st': 'firstFloor.openOffice1st',
    'Managers Offices 1st': 'firstFloor.managersOffices1st',
    'Open Office 2nd': 'secondFloor.openOffice2nd',
    'Managers Offices 2nd': 'secondFloor.managersOffices2nd',
    'Open Office Ground': 'groundFloor.openOfficeGround',
    'Managers Offices Ground': 'groundFloor.managersOfficesGround',
    'Kitchen Cafeteria': 'secondFloor.kitchenCafeteria',
    'Reception': 'groundFloor.reception',
    'Supervisor Comments': 'secondFloor.supervisorComments'
  };

  const parseExportStyleRows = (rows, headers) => {
    if (!headers.length || headers.length < 2 || !rows.length) return [];
    const labelColumn = headers[0];
    if (!labelColumn) return [];

    const candidateColumns = headers.slice(1).filter(Boolean);
    if (!candidateColumns.length) return [];

    const parsed = candidateColumns.map(() => createEmptyInspectionFromShape());
    let currentFloor = 'externalAssets'; // Track which floor section we're in

    // Set inspectionDate from export column headers if available
    candidateColumns.forEach((column, idx) => {
      if (!parsed[idx].inspectionDate && column) {
        const parsedDate = new Date(column);
        if (!Number.isNaN(parsedDate.getTime())) {
          parsed[idx].inspectionDate = parsedDate.toISOString();
        }
      }
    });

    // Create floor-aware path mapping
    const getPathForField = (fieldName, floor) => {
      // Handle fields that appear in multiple sections
      const multiSectionFields = {
        'Lighting': {
          'groundFloor': 'groundFloor.lighting',
          'firstFloor': 'firstFloor.lighting',
          'secondFloor': 'secondFloor.lighting'
        },
        'Air Condition': {
          'groundFloor': 'groundFloor.airCondition',
          'firstFloor': 'firstFloor.airCondition',
          'secondFloor': 'secondFloor.airCondition'
        },
        'Glazing': {
          'groundFloor': 'groundFloor.glazing',
          'firstFloor': 'firstFloor.glazing',
          'secondFloor': 'secondFloor.glazing'
        },
        'Workstation Cleaning': {
          'groundFloor': 'groundFloor.workstationCleaning',
          'firstFloor': 'firstFloor.workstationCleaning',
          'secondFloor': 'secondFloor.workstationCleaning'
        },
        'Office Cleaning': {
          'groundFloor': 'groundFloor.officeCleaning',
          'firstFloor': 'firstFloor.officeCleaning',
          'secondFloor': 'secondFloor.officeCleaning'
        },
        'Male Washroom': {
          'groundFloor': 'groundFloor.maleWashroom',
          'firstFloor': 'firstFloor.maleWashroom',
          'secondFloor': 'secondFloor.maleWashroom'
        },
        'Female Washroom': {
          'groundFloor': 'groundFloor.femaleWashroom',
          'firstFloor': 'firstFloor.femaleWashroom',
          'secondFloor': 'secondFloor.femaleWashroom'
        },
        'General Observations': {
          'groundFloor': 'groundFloor.generalObservations',
          'firstFloor': 'firstFloor.generalObservations',
          'secondFloor': 'secondFloor.generalObservations'
        }
      };

      // If it's a multi-section field, use the floor context
      if (multiSectionFields[fieldName] && multiSectionFields[fieldName][floor]) {
        return multiSectionFields[fieldName][floor];
      }

      // Otherwise, use the static mapping
      return DAILY_EXPORT_LABEL_TO_PATH[fieldName];
    };

    rows.forEach((row) => {
      const rawLabel = String(row?.[labelColumn] ?? '').trim();
      if (!rawLabel) return;

      // Update current floor based on section headers
      if (rawLabel.includes('Ground Floor') && !rawLabel.includes('Observations')) {
        currentFloor = 'groundFloor';
        return;
      }
      if (rawLabel.includes('First Floor') && !rawLabel.includes('Observations')) {
        currentFloor = 'firstFloor';
        return;
      }
      if (rawLabel.includes('Second Floor') && !rawLabel.includes('Observations')) {
        currentFloor = 'secondFloor';
        return;
      }

      let label = rawLabel;
      
      // Handle Inspection Date
      if (label === 'Inspection Date') {
        candidateColumns.forEach((column, idx) => {
          const dateValue = row?.[column];
          if (dateValue) {
            const parsed_date = new Date(dateValue);
            if (!Number.isNaN(parsed_date.getTime())) {
              parsed[idx].inspectionDate = parsed_date.toISOString();
            }
          }
        });
        return;
      }
      
      if (label === 'User' || label === 'External Assets' || label === 'External Assets:' ||
        label === 'Ground Floor' || label === 'Ground Floor:' || 
        label === 'First Floor' || label === 'First Floor:' || 
        label === 'Second Floor' || label === 'Second Floor:') {
        return;
      }

      // Get the target path using floor context
      const targetPath = getPathForField(label, currentFloor);
      if (!targetPath) return;

      candidateColumns.forEach((column, idx) => {
        const value = row?.[column];
        setDeepValue(parsed[idx], targetPath, String(value ?? '').trim());
      });
    });

    return parsed.filter((inspection) =>
      countFilled(inspection.externalAssets) > 0 ||
      countFilled(inspection.groundFloor) > 0 ||
      countFilled(inspection.firstFloor) > 0 ||
      countFilled(inspection.secondFloor) > 0
    );
  };

  const handleImportFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportError('');
      setImportPreview({ rows: [], fileName: '' });

      // Check file format by reading raw sheet data
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const rawSheet = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, blankrows: false, defval: '' });

      // Check if this is the legacy horizontal format (dates as columns)
      if (isLegacyFormat(rawSheet)) {
        try {
          const legacyResult = await parseLegacyExcelFormat(file);
          const { rows: legacyRows } = legacyResult;
          
          if (!legacyRows.length) {
            setImportError('The Excel file appears to be empty or missing data rows.');
            return;
          }

          // Map legacy format rows directly
          const mapped = legacyRows.map((row) => {
            const inspection = createEmptyInspectionFromShape();
            
            // Set inspection date
            if (row.inspectionDate) {
              inspection.inspectionDate = row.inspectionDate;
            }
            
            // Map all nested fields
            Object.entries(row).forEach(([key, value]) => {
              if (key === 'inspectionDate') return;
              
              if (typeof value === 'object' && value !== null) {
                // Merge nested objects
                inspection[key] = { ...inspection[key], ...value };
              }
            });

            return inspection;
          });

          setImportPreview({ rows: mapped, fileName: file.name });
          return;
        } catch (legacyErr) {
          setImportError('Error parsing legacy format: ' + (legacyErr?.message || 'Unknown error'));
          return;
        }
      }

      // Fall back to standard format parsing
      const { rows, headers } = await parseExcelFileToRows(file);
      if (!rows.length) {
        setImportError('The Excel file appears to be empty or missing data rows.');
        return;
      }

      const knownTopSections = ['externalAssets', 'groundFloor', 'firstFloor', 'secondFloor'];
      const firstColumnKey = headers[0];
      const transposedRowMarkers = new Set([
        'Inspection Date',
        'External Assets',
        'Ground Floor',
        'First Floor',
        'Second Floor',
        'Cummins Generator Availability',
        'Cat Generator Availability'
      ]);
      const transposedMarkerHits = rows.reduce((count, row) => {
        const label = String(row?.[firstColumnKey] ?? '').trim();
        return transposedRowMarkers.has(label) ? count + 1 : count;
      }, 0);
      const isLikelyTransposedExport =
        headers.length >= 2 &&
        transposedMarkerHits >= 2 &&
        !headers.some((h) => h.includes('.')) &&
        !knownTopSections.includes(firstColumnKey);

      if (isLikelyTransposedExport) {
        const transposedRows = parseExportStyleRows(rows, headers);
        if (!transposedRows.length) {
          setImportError('Could not map rows from the exported Daily Inspection format.');
          return;
        }
        setImportPreview({ rows: transposedRows, fileName: file.name });
        return;
      }

      const hasAnyKnownHeader = headers.some((h) => h === 'status' || knownTopSections.includes(h) || h.includes('.'));
      if (!hasAnyKnownHeader) {
        setImportError(
          'The Excel columns do not match the daily inspection format. Use dot-notation headers like "externalAssets.cumminsGeneratorAvailability" (or JSON columns "externalAssets", "groundFloor", etc.).'
        );
        return;
      }

      const mapped = rows.map((row) => {
        const inspection = createEmptyInspectionFromShape();

        Object.entries(row).forEach(([header, value]) => {
          if (!header) return;

          // Match both camelCase and title case variations of the inspection date
          if (header === 'inspectionDate' || header === 'Inspection Date' || header === 'inspection date') {
            if (value) {
              // Parse various date formats
              let dateValue = value;
              if (typeof value === 'string') {
                // Handle locale date format (e.g., "5/19/2026")
                const parsed = new Date(value);
                if (!Number.isNaN(parsed.getTime())) {
                  inspection.inspectionDate = parsed.toISOString();
                } else {
                  inspection.inspectionDate = value;
                }
              } else {
                // If it's already a date or timestamp
                inspection.inspectionDate = new Date(dateValue).toISOString();
              }
            }
            return;
          }

          if (header === 'status') {
            const raw = String(value || '').trim();
            if (!raw) {
              inspection.status = ['No issues'];
              return;
            }
            inspection.status = raw.includes(',')
              ? raw.split(',').map((s) => s.trim()).filter(Boolean)
              : [raw];
            return;
          }

          if (knownTopSections.includes(header)) {
            const parsed = tryParseJsonCell(value);
            if (parsed && typeof parsed === 'object') {
              inspection[header] = { ...inspection[header], ...parsed };
            }
            return;
          }

          if (header.includes('.')) {
            setDeepValue(inspection, header, String(value ?? '').trim());
          }
        });

        return inspection;
      });

      setImportPreview({ rows: mapped, fileName: file.name });
    } catch (err) {
      setImportError(err?.message || 'There was a problem reading the Excel file.');
    } finally {
      e.target.value = null;
    }
  };

  const countFilled = (obj) => {
    if (!obj) return 0;
    return Object.values(obj).filter((v) => String(v ?? '').trim() !== '').length;
  };

  const handleConfirmImport = async () => {
    if (!importPreview.rows.length) return;

    if (user?.role === 'admin' && !selectedUserForImport) {
      return;
    }

    try {
      setLoading(true);
      
      if (user?.role === 'admin') {
        // Use the apiService import method
        await dailyInspectionService.import(importPreview.rows, selectedUserForImport);
      } else {
        // Regular user imports data for themselves
        for (const inspection of importPreview.rows) {
          await dailyInspectionService.submit(inspection);
        }
      }

      setImportPreview({ rows: [], fileName: '' });
      setImportError('');
      setSelectedUserForImport('');
      setShowUserSelectionModal(false);
      await fetchInspections();
    } catch (error) {
      console.error('Error importing inspections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelImport = () => {
    setImportPreview({ rows: [], fileName: '' });
    setImportError('');
    setSelectedUserForImport('');
    setShowUserSelectionModal(false);
  };

  const toggleSelectId = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    const filteredInspections = getFilteredInspections();
    if (selectedIds.size === filteredInspections.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredInspections.map(i => i._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      return;
    }

    try {
      setIsDeleting(true);
      await dailyInspectionService.deleteMultiple(Array.from(selectedIds));
      setSelectedIds(new Set());
      await fetchInspections();
    } catch (error) {
      console.error('Error deleting entries:', error);
    } finally {
      setIsDeleting(false);
    }
  };


  const resetForm = () => {
    setFormData({
      externalAssets: {
        cumminsGeneratorAvailability: '',
        catGeneratorAvailability: '',
        cumminsGeneratorRunningHours: '',
        catGeneratorRunningHours: '',
        cumminsRemainingHours: '',
        catRemainingHours: '',
        externalDieselTankFuelLevel: '',
        cumminsRadiatorTankCondition: '',
        catRadiatorTankCondition: '',
        cumminsAirFilterCondition: '',
        catAirFilterCondition: '',
        cumminsOilLevel: '',
        catOilLevel: '',
        cumminsCoolantLevel: '',
        catCoolantLevel: '',
        cumminsBatteryVoltage: '',
        catBatteryVoltage: '',
        cumminsPendingAlarms: '',
        catPendingAlarms: '',
        cumminsDriveBeltDamage: '',
        catDriveBeltDamage: '',
        cumminsElectricalConnections: '',
        catElectricalConnections: '',
        cumminsUnusualNoise: '',
        catUnusualNoise: '',
        cumminsGeneratorVoltage: '',
        catGeneratorVoltage: '',
        avrOperational: '',
        avrInputVoltageLL: '',
        avrOutputVoltageLL: '',
        avrInputVoltageLN: '',
        avrOutputVoltageLN: '',
        avrAlarm: '',
        cumminsFrequency: '',
        catFrequency: '',
        waterTankLevel10000: '',
        waterTankLevel7000: '',
        pedroloPump1Pressure: '',
        pedroloPump2Pressure: '',
        pedroloPump1Report: '',
        pedroloPump2Report: '',
        securityPost: '',
        driversRoom: '',
        mainCompoundObservations: '',
        solidWasteAreaObservations: '',
        carParkingSpaces: ''
      },
      groundFloor: {
        lighting: '',
        airCondition: '',
        plumbing: '',
        glazing: '',
        workstationCleaning: '',
        officeCleaning: '',
        maleWashroom: '',
        femaleWashroom: '',
        cafeteria: '',
        openOfficeGround: '',
        managersOfficesGround: '',
        reception: '',
        generalObservations: ''
      },
      firstFloor: {
        lighting: '',
        airCondition: '',
        glazing: '',
        trainingRoom: '',
        emergencyCommandCentre: '',
        workstationCleaning: '',
        officeCleaning: '',
        maleWashroom: '',
        femaleWashroom: '',
        openOffice1st: '',
        managersOffices1st: '',
        generalObservations: ''
      },
      secondFloor: {
        lighting: '',
        airCondition: '',
        glazing: '',
        workstationCleaning: '',
        officeCleaning: '',
        boardRoom: '',
        maleWashroom: '',
        femaleWashroom: '',
        smtOffices: '',
        openOffice2nd: '',
        managersOffices2nd: '',
        kitchenCafeteria: '',
        generalObservations: '',
        supervisorComments: ''
      },
      status: [],
      inspectionDate: ''
    });
    setShowForm(false);
    setCurrentStep(1);
    setDraftId(null);
  };

  const confirmClearForm = () => {
    clearCurrentStep();
    setClearFormModal(false);
  };

  const handleClearForm = () => {
    setClearFormModal(true);
  };

  const handleCancel = () => {
    setCancelModal(true);
  };

  const confirmCancel = () => {
    resetForm();
    setCancelModal(false);
  };

  const isFieldFilled = (value) => {
    if (Array.isArray(value)) {
      return value.some((item) => isFieldFilled(item));
    }
    if (typeof value === 'string') {
      return value.trim() !== '';
    }
    return value !== null && value !== undefined && value !== '';
  };

  const isFormDataComplete = (section) => {
    return Object.values(section).every((value) => isFieldFilled(value));
  };

  const isCurrentStepComplete = () => {
    if (currentStep === 1) return isFormDataComplete(formData.externalAssets);
    if (currentStep === 2) return isFormDataComplete(formData.groundFloor);
    if (currentStep === 3) return isFormDataComplete(formData.firstFloor);
    if (currentStep === 4) {
      return isFormDataComplete(formData.secondFloor) && isFieldFilled(formData.status);
    }
    return false;
  };

  const clearCurrentStep = () => {
    setFormData((prev) => {
      const currentSection =
        currentStep === 1 ? 'externalAssets' :
        currentStep === 2 ? 'groundFloor' :
        currentStep === 3 ? 'firstFloor' :
        'secondFloor';

      const emptySection = Object.keys(prev[currentSection]).reduce((acc, key) => {
        acc[key] = '';
        return acc;
      }, {});

      return {
        ...prev,
        [currentSection]: emptySection,
        ...(currentStep === 4 ? { status: [] } : {})
      };
    });
  };

  const handleDeleteInspection = (id, itemName) => {
    setDeleteModal({ isOpen: true, id, name: itemName });
  };

  const confirmDeleteInspection = async () => {
    if (!deleteModal.id) return;
    try {
      setIsDeleting(true);
      await dailyInspectionService.delete(deleteModal.id);
      setDeleteModal({ isOpen: false, id: null, name: '' });
      fetchInspections();
    } catch (error) {
      console.error('Error deleting inspection:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSection = (inspectionId, section) => {
    setExpandedSections(prev => ({
      ...prev,
      [`${inspectionId}-${section}`]: !prev[`${inspectionId}-${section}`]
    }));
  };

  const formatFieldName = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  const SectionDataTable = ({ data }) => {
    if (!data || Object.keys(data).length === 0) {
      return <p className="no-data">No data available</p>;
    }

    const entries = Object.entries(data).filter(([_, value]) => value && value.toString().trim() !== '');

    if (entries.length === 0) {
      return <p className="no-data">No data available</p>;
    }

    return (
      <table className="section-data-table">
        <thead>
          <tr>
            <th>ITEM</th>
            <th>COMMENTS/OBSERVATION</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key}>
              <td className="field-name">{formatFieldName(key)}</td>
              <td className="field-value">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const getFilteredInspections = () => {
    let filtered = inspections.filter((inspection) => {
      // Filter by user (admin only)
      if (filterUser && inspection.userId?._id !== filterUser) {
        return false;
      }

      // Search query across multiple fields
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = JSON.stringify({
          user: inspection.userId?.username || '',
          date: new Date(inspection.inspectionDate).toLocaleDateString('en-US', 
            { day: '2-digit', month: 'short', year: '2-digit' }),
          status: inspection.status || '',
          externalAssets: inspection.externalAssets || {},
          groundFloor: inspection.groundFloor || {},
          firstFloor: inspection.firstFloor || {},
          secondFloor: inspection.secondFloor || {}
        }).toLowerCase();
        
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });

    const getTimestamp = (item) => {
      const value = item.createdAt || item.updatedAt || item.inspectionDate || '';
      const parsed = new Date(value).getTime();
      return Number.isFinite(parsed) ? parsed : 0;
    };

    if (sortOrder === 'oldest') {
      filtered.sort((a, b) => getTimestamp(a) - getTimestamp(b));
    } else {
      filtered.sort((a, b) => getTimestamp(b) - getTimestamp(a));
    }

    return filtered;
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterUser('');
    setSortOrder('newest');
  };

  const formatDateForDisplay = (value) => {
    if (!value) return '-';

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    const str = String(value).trim();
    if (!str || str.toLowerCase() === 'n/a') return '-';

    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [year, month, day] = str.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    const parsed = new Date(str);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    return str;
  };

  return (
    <>
      <NavBar heading="Daily Inspection" />
      <div className="inspection-container">
        
        {!showForm && (
          <button 
            onClick={handleStartForm} 
            className="add-btn"
          >
            Add New Data
          </button>
        )}

        {user?.role === 'admin' && !showForm && (
          <button onClick={generateReport} className="report-btn">
            Generate Report
          </button>
        )}
        
        {user?.role === 'admin' && inspections.length > 0 && !showForm && (
          <button onClick={() => dailyInspectionService.exportToExcel()} className="export-btn">
            Export Data
          </button>
        )}



        {user?.role === 'admin' && report && !showForm && (
          <div className="report-section">
            <h2>Report Summary</h2>
            <p>Total Daily Inspections: {report.totalCount}</p>
            <div className="status-summary">
              {Object.entries(report.byStatus).map(([status, count]) => (
                <div key={status}>
                  <strong>
                    {status}:
                  </strong> 
                  {count}
                </div>
              ))}
            </div>
          </div>
        )}

        {showForm && (
          <div className="form-container">
            <div className="step-indicator">
              <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
                <span>1</span>
                <p>External Assets</p>
              </div>
              <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
                <span>2</span>
                <p>Ground Floor</p>
              </div>
              <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                <span>3</span>
                <p>First Floor</p>
              </div>
              <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
                <span>4</span>
                <p>Second Floor</p>
              </div>
            </div>

            <form className="form">
              {currentStep === 1 && (
                <div>
                  <h2>External Assets</h2>
                  
                  <h3>Generator Availability & Hours</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='cumgen'>Cummins Generator Availability:</label>
                      <input
                        type='text'
                        id='cumgen'
                        value={formData.externalAssets.cumminsGeneratorAvailability}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, cumminsGeneratorAvailability: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='catgen'>Cat Generator Availability:</label>
                      <input
                        type='text'
                        id='catgen'
                        value={formData.externalAssets.catGeneratorAvailability}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, catGeneratorAvailability: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='cumgen hours'>Cummins Generator Running Hours:</label>
                      <input
                        type="text"
                        id='cumgen hours'
                        value={formData.externalAssets.cumminsGeneratorRunningHours}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, cumminsGeneratorRunningHours: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='catgen hours'>Cat Generator Running Hours:</label>
                      <input
                        type="text"
                        id='catgen hours'
                        value={formData.externalAssets.catGeneratorRunningHours}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, catGeneratorRunningHours: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='cum hours'>Cummins Remaining Hours:</label>
                      <input
                        type="text"
                        id='cum hours'
                        value={formData.externalAssets.cumminsRemainingHours}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, cumminsRemainingHours: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='cat hours'>Cat Remaining Hours:</label>
                      <input
                        type="text"
                        id='cat hours'
                        value={formData.externalAssets.catRemainingHours}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, catRemainingHours: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor='tank'>External Diesel Tank Fuel Level:</label>
                    <input
                      type="text"
                      id='tank'
                      value={formData.externalAssets.externalDieselTankFuelLevel}
                      onChange={(e) => setFormData({
                        ...formData,
                        externalAssets: {...formData.externalAssets, externalDieselTankFuelLevel: e.target.value}
                      })}
                      required
                      autoComplete='No'
                    />
                  </div>

                  <h3>Radiator Tank Condition</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='cum radiator'>Cummins Radiator Tank Condition:</label>
                      <input
                        type='text'
                        id='cum radiator'
                        value={formData.externalAssets.cumminsRadiatorTankCondition}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, cumminsRadiatorTankCondition: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='cat radiator'>Cat Radiator Tank Condition:</label>
                      <input
                        type='text'
                        id='cat radiator'
                        value={formData.externalAssets.catRadiatorTankCondition}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, catRadiatorTankCondition: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                  </div>

                  <h3>Air Filter Condition</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='cum filter'>Cummins Air Filter Condition:</label>
                      <input
                        type='text'
                        id='cum filter'
                        value={formData.externalAssets.cumminsAirFilterCondition}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, cumminsAirFilterCondition: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='cat filter'>Cat Air Filter Condition:</label>
                      <input
                        type='text'
                        id='cat filter'
                        value={formData.externalAssets.catAirFilterCondition}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, catAirFilterCondition: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                  </div>

                  <h3>Oil Level</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='cum oil'>Cummins Oil Level:</label>
                      <input
                        type='text'
                        id='cum oil'
                        value={formData.externalAssets.cumminsOilLevel}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, cumminsOilLevel: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='cat oil'>Cat Oil Level:</label>
                      <input
                        type='text'
                        id='cat oil'
                        value={formData.externalAssets.catOilLevel}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, catOilLevel: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                  </div>

                  <h3>Coolant Level</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='cum coolant'>Cummins Coolant Level:</label>
                      <input
                        type='text'
                        id='cum coolant'
                        value={formData.externalAssets.cumminsCoolantLevel}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, cumminsCoolantLevel: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='cat coolant'>Cat Coolant Level:</label>
                      <input
                        type='text'
                        id='cat coolant'
                        value={formData.externalAssets.catCoolantLevel}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, catCoolantLevel: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                  </div>

                  <h3>Battery Voltage</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='cum battery'>Cummins Battery Voltage:</label>
                      <input
                        type="text"
                        id='cum battery'
                        value={formData.externalAssets.cumminsBatteryVoltage}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, cumminsBatteryVoltage: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='cat battery'>Cat Battery Voltage:</label>
                      <input
                        type="text"
                        id='cat battery'
                        value={formData.externalAssets.catBatteryVoltage}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, catBatteryVoltage: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                  </div>

                  <h3>Pending Alarms</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='cum control'>Cummins Control Panel:</label>
                      <input
                        type="text"
                        id='cum control'
                        value={formData.externalAssets.cumminsPendingAlarms}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, cumminsPendingAlarms: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='cat control'>Cat Control Panel:</label>
                      <input
                        type="text"
                        id='cat control'
                        value={formData.externalAssets.catPendingAlarms}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, catPendingAlarms: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                  </div>

                  <h3>Drive Belt Damage</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='cum belt'>Cummins Drive Belt Damage:</label>
                      <input
                        type='text'
                        id='cum belt'
                        value={formData.externalAssets.cumminsDriveBeltDamage}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, cumminsDriveBeltDamage: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='cat belt'>Cat Drive Belt Damage:</label>
                      <input
                        type='text'
                        id='cat belt'
                        value={formData.externalAssets.catDriveBeltDamage}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, catDriveBeltDamage: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                  </div>

                  <h3>Electrical Connections</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='cum electrical'>Cummins Electrical Connections:</label>
                      <input
                        type='text'
                        id='cum electrical'
                        value={formData.externalAssets.cumminsElectricalConnections}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, cumminsElectricalConnections: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='cat electrical'>Cat Electrical Connections:</label>
                      <input
                        type='text'
                        id='cat electrical'
                        value={formData.externalAssets.catElectricalConnections}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, catElectricalConnections: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                  </div>

                  <h3>Unusual Noise</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='cum noise'>Cummins Unusual Noise:</label>
                      <input
                        type='text'
                        id='cum noise'
                        value={formData.externalAssets.cumminsUnusualNoise}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, cumminsUnusualNoise: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='cat noise'>Cat Unusual Noise:</label>
                      <input
                        type='text'
                        id='cat noise'
                        value={formData.externalAssets.catUnusualNoise}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, catUnusualNoise: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                  </div>

                  <h3>Generator Voltage</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='cum voltage'>Cummins Generator Voltage:</label>
                      <input
                        type="text"
                        id='cum voltage'
                        value={formData.externalAssets.cumminsGeneratorVoltage}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, cumminsGeneratorVoltage: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='cat voltage'>Cat Generator Voltage:</label>
                      <input
                        type="text"
                        id='cat voltage'
                        value={formData.externalAssets.catGeneratorVoltage}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, catGeneratorVoltage: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                  </div>

                  <h3>AVR Details</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='operational'>AVR Operational:</label>
                      <select
                        id='operational'
                        value={formData.externalAssets.avrOperational}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, avrOperational: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      >
                        <option value="" disabled>Select...</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor='avr alarm'>AVR Alarm:</label>
                      <input
                        type="text"
                        id='avr alarm'
                        value={formData.externalAssets.avrAlarm}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, avrAlarm: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='input ll'>AVR Input Voltage LL:</label>
                      <input
                        type="text"
                        id='input ll'
                        value={formData.externalAssets.avrInputVoltageLL}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, avrInputVoltageLL: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='output ll'>AVR Output Voltage LL:</label>
                      <input
                        type="text"
                        id='output ll'
                        value={formData.externalAssets.avrOutputVoltageLL}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, avrOutputVoltageLL: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='input ln'>AVR Input Voltage LN:</label>
                      <input
                        type="text"
                        id='input ln'
                        value={formData.externalAssets.avrInputVoltageLN}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, avrInputVoltageLN: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='output ln'>AVR Output Voltage LN:</label>
                      <input
                        type="text"
                        id='output ln'
                        value={formData.externalAssets.avrOutputVoltageLN}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, avrOutputVoltageLN: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                  </div>

                  <h3>Frequency</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='cum frequency'>Cummins Frequency:</label>
                      <input
                        type="text"
                        id='cum frequency'
                        value={formData.externalAssets.cumminsFrequency}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, cumminsFrequency: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='cat frequency'>Cat Frequency:</label>
                      <input
                        type="text"
                        id='cat frequency'
                        value={formData.externalAssets.catFrequency}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, catFrequency: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                  </div>

                  <h3>Water Tank</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='level1000'>Level @10000:</label>
                      <input
                        type="text"
                        id='level1000'
                        value={formData.externalAssets.waterTankLevel10000}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, waterTankLevel10000: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='level7000'>Level @7000:</label>
                      <input
                        type="text"
                        id='level7000'
                        value={formData.externalAssets.waterTankLevel7000}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, waterTankLevel7000: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                  </div>

                  <h3>Pedrolo Pumps</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='pressure1'>Pedrolo Pump 1 Pressure:</label>
                      <input
                        type="text"
                        id='pressure1'
                        value={formData.externalAssets.pedroloPump1Pressure}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, pedroloPump1Pressure: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='pressure2'>Pedrolo Pump 2 Pressure:</label>
                      <input
                        type="text"
                        id='pressure2'
                        value={formData.externalAssets.pedroloPump2Pressure}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, pedroloPump2Pressure: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='report1'>Pedrolo Pump 1 Report:</label>
                      <input
                        type="text"
                        id='report1'
                        value={formData.externalAssets.pedroloPump1Report}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, pedroloPump1Report: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='report2'>Pedrolo Pump 2 Report:</label>
                      <input
                        type="text"
                        id='report2'
                        value={formData.externalAssets.pedroloPump2Report}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, pedroloPump2Report: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                  </div>

                  <h3>Facility Areas</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='security'>Security Post:</label>
                      <input
                        type='text'
                        id='security'
                        value={formData.externalAssets.securityPost}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, securityPost: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='drivers'>Drivers Room:</label>
                      <input
                        type='text'
                        id='drivers'
                        value={formData.externalAssets.driversRoom}
                        onChange={(e) => setFormData({
                          ...formData,
                          externalAssets: {...formData.externalAssets, driversRoom: e.target.value}
                        })}
                        required
                        autoComplete='No'
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor='main'>Main Compound Observations:</label>
                    <textarea
                      id='main'
                      value={formData.externalAssets.mainCompoundObservations}
                      onChange={(e) => setFormData({
                        ...formData,
                        externalAssets: {...formData.externalAssets, mainCompoundObservations: e.target.value}
                      })}
                      required
                      autoComplete='No'
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor='waste'>Solid Waste Area Observations:</label>
                    <textarea
                      id='waste'
                      value={formData.externalAssets.solidWasteAreaObservations}
                      onChange={(e) => setFormData({
                        ...formData,
                        externalAssets: {...formData.externalAssets, solidWasteAreaObservations: e.target.value}
                      })}
                      required
                      autoComplete='No'
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor='car'>Car Parking Spaces:</label>
                    <input
                      type='text'
                      id='car'
                      value={formData.externalAssets.carParkingSpaces}
                      onChange={(e) => setFormData({
                        ...formData,
                        externalAssets: {...formData.externalAssets, carParkingSpaces: e.target.value}
                      })}
                      required
                      autoComplete='No'
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h2>Ground Floor</h2>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='g light'>Lighting:</label>
                      <input
                        type='text'
                        id='g light'
                        value={formData.groundFloor.lighting}
                        onChange={(e) => setFormData({
                          ...formData,
                          groundFloor: {...formData.groundFloor, lighting: e.target.value}
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='g air'>Air Condition:</label>
                      <input
                        type='text'
                        id='g air'
                        value={formData.groundFloor.airCondition}
                        onChange={(e) => setFormData({
                          ...formData,
                          groundFloor: {...formData.groundFloor, airCondition: e.target.value}
                        })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='g plumbing'>Plumbing:</label>
                      <input
                        type='text'
                        id='g plumbing'
                        value={formData.groundFloor.plumbing}
                        onChange={(e) => setFormData({
                          ...formData,
                          groundFloor: {...formData.groundFloor, plumbing: e.target.value}
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='g glazing'>Glazing:</label>
                      <input
                        type='text'
                        id='g glazing'
                        value={formData.groundFloor.glazing}
                        onChange={(e) => setFormData({
                          ...formData,
                          groundFloor: {...formData.groundFloor, glazing: e.target.value}
                        })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='g cleaning'>Workstation Cleaning:</label>
                      <input
                        type='text'
                        id='g cleaning'
                        value={formData.groundFloor.workstationCleaning}
                        onChange={(e) => setFormData({
                          ...formData,
                          groundFloor: {...formData.groundFloor, workstationCleaning: e.target.value}
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='g office cleaning'>Office Cleaning:</label>
                      <input
                        type='text'
                        id='g office cleaning'
                        value={formData.groundFloor.officeCleaning}
                        onChange={(e) => setFormData({
                          ...formData,
                          groundFloor: {...formData.groundFloor, officeCleaning: e.target.value}
                        })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='g male'>Male Washroom:</label>
                      <input
                        type='text'
                        id='g male'
                        value={formData.groundFloor.maleWashroom}
                        onChange={(e) => setFormData({
                          ...formData,
                          groundFloor: {...formData.groundFloor, maleWashroom: e.target.value}
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='g female'>Female Washroom:</label>
                      <input
                        type='text'
                        id='g female'
                        value={formData.groundFloor.femaleWashroom}
                        onChange={(e) => setFormData({
                          ...formData,
                          groundFloor: {...formData.groundFloor, femaleWashroom: e.target.value}
                        })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor='g cafetaria'>Cafeteria:</label>
                    <input
                      type='text'
                      id='g cafetaria'
                      value={formData.groundFloor.cafeteria}
                      onChange={(e) => setFormData({
                        ...formData,
                        groundFloor: {...formData.groundFloor, cafeteria: e.target.value}
                      })}
                    />
                  </div>

                  <h3>Area Offices</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='g ground'>Open Office Ground Floor:</label>
                      <input
                        type='text'
                        id='g ground'
                        value={formData.groundFloor.openOfficeGround}
                        onChange={(e) => setFormData({
                          ...formData,
                          groundFloor: {...formData.groundFloor, openOfficeGround: e.target.value}
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='g managers'>Managers Offices Ground Floor:</label>
                      <input
                        type='text'
                        id='g managers'
                        value={formData.groundFloor.managersOfficesGround}
                        onChange={(e) => setFormData({
                          ...formData,
                          groundFloor: {...formData.groundFloor, managersOfficesGround: e.target.value}
                        })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor='g reception'>Reception:</label>
                    <input
                      type='text'
                      id='g reception'
                      value={formData.groundFloor.reception}
                      onChange={(e) => setFormData({
                        ...formData,
                        groundFloor: {...formData.groundFloor, reception: e.target.value}
                      })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor='g general'>General Observations:</label>
                    <textarea
                      id='g general'
                      value={formData.groundFloor.generalObservations}
                      onChange={(e) => setFormData({
                        ...formData,
                        groundFloor: {...formData.groundFloor, generalObservations: e.target.value}
                      })}
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <h2>First Floor</h2>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='f light'>Lighting:</label>
                      <input
                        type='text'
                        id='f light'
                        value={formData.firstFloor.lighting}
                        onChange={(e) => setFormData({
                          ...formData,
                          firstFloor: {...formData.firstFloor, lighting: e.target.value}
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='f air'>Air Condition:</label>
                      <input
                        type='text'
                        id='f air'
                        value={formData.firstFloor.airCondition}
                        onChange={(e) => setFormData({
                          ...formData,
                          firstFloor: {...formData.firstFloor, airCondition: e.target.value}
                        })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='f glazing'>Glazing:</label>
                      <input
                        type='text'
                        id='f glazing'
                        value={formData.firstFloor.glazing}
                        onChange={(e) => setFormData({
                          ...formData,
                          firstFloor: {...formData.firstFloor, glazing: e.target.value}
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='f training'>Training Room:</label>
                      <input
                        type='text'
                        id='f training'
                        value={formData.firstFloor.trainingRoom}
                        onChange={(e) => setFormData({
                          ...formData,
                          firstFloor: {...formData.firstFloor, trainingRoom: e.target.value}
                        })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor='f command'>Emergency Command Centre:</label>
                    <input
                      type='text'
                      id='f command'
                      value={formData.firstFloor.emergencyCommandCentre}
                      onChange={(e) => setFormData({
                        ...formData,
                        firstFloor: {...formData.firstFloor, emergencyCommandCentre: e.target.value}
                      })}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='f cleaning'>Workstation Cleaning:</label>
                      <input
                        type='text'
                        id='f cleaning'
                        value={formData.firstFloor.workstationCleaning}
                        onChange={(e) => setFormData({
                          ...formData,
                          firstFloor: {...formData.firstFloor, workstationCleaning: e.target.value}
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='f office'>Office Cleaning:</label>
                      <input
                        type='text'
                        id='f office'
                        value={formData.firstFloor.officeCleaning}
                        onChange={(e) => setFormData({
                          ...formData,
                          firstFloor: {...formData.firstFloor, officeCleaning: e.target.value}
                        })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='f male'>Male Washroom:</label>
                      <input
                        type='text'
                        id='f male'
                        value={formData.firstFloor.maleWashroom}
                        onChange={(e) => setFormData({
                          ...formData,
                          firstFloor: {...formData.firstFloor, maleWashroom: e.target.value}
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='f female'>Female Washroom:</label>
                      <input
                        type='text'
                        id='f female'
                        value={formData.firstFloor.femaleWashroom}
                        onChange={(e) => setFormData({
                          ...formData,
                          firstFloor: {...formData.firstFloor, femaleWashroom: e.target.value}
                        })}
                      />
                    </div>
                  </div>
                  
                  <h3>Area Offices</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='f open1'>Open Office 1st Floor:</label>
                      <input
                        type='text'
                        id='f open1'
                        value={formData.firstFloor.openOffice1st}
                        onChange={(e) => setFormData({
                          ...formData,
                          firstFloor: {...formData.firstFloor, openOffice1st: e.target.value}
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='f managers1'>Managers Offices 1st Floor:</label>
                      <input
                        type='text'
                        id='f managers1'
                        value={formData.firstFloor.managersOffices1st}
                        onChange={(e) => setFormData({
                          ...formData,
                          firstFloor: {...formData.firstFloor, managersOffices1st: e.target.value}
                        })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor='f general'>General Observations:</label>
                    <textarea
                      id='f general'
                      value={formData.firstFloor.generalObservations}
                      onChange={(e) => setFormData({
                        ...formData,
                        firstFloor: {...formData.firstFloor, generalObservations: e.target.value}
                      })}
                    />
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div>
                  <h2>Second Floor</h2>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='s light'>Lighting:</label>
                      <input
                        type='text'
                        id='s light'
                        value={formData.secondFloor.lighting}
                        onChange={(e) => setFormData({
                          ...formData,
                          secondFloor: {...formData.secondFloor, lighting: e.target.value}
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='s air'>Air Condition:</label>
                      <input
                        type='text'
                        id='s air'
                        value={formData.secondFloor.airCondition}
                        onChange={(e) => setFormData({
                          ...formData,
                          secondFloor: {...formData.secondFloor, airCondition: e.target.value}
                        })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor='s glazing'>Glazing:</label>
                    <input
                      type='text'
                      id='s glazing'
                      value={formData.secondFloor.glazing}
                      onChange={(e) => setFormData({
                        ...formData,
                        secondFloor: {...formData.secondFloor, glazing: e.target.value}
                      })}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='s cleaning'>Workstation Cleaning:</label>
                      <input
                        type='text'
                        id='s cleaning'
                        value={formData.secondFloor.workstationCleaning}
                        onChange={(e) => setFormData({
                          ...formData,
                          secondFloor: {...formData.secondFloor, workstationCleaning: e.target.value}
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='s office'>Office Cleaning:</label>
                      <input
                        type='text'
                        id='s office'
                        value={formData.secondFloor.officeCleaning}
                        onChange={(e) => setFormData({
                          ...formData,
                          secondFloor: {...formData.secondFloor, officeCleaning: e.target.value}
                        })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor='s board'>Board Room:</label>
                    <input
                      type='text'
                      id='s board'
                      value={formData.secondFloor.boardRoom}
                      onChange={(e) => setFormData({
                        ...formData,
                        secondFloor: {...formData.secondFloor, boardRoom: e.target.value}
                      })}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='s male'>Male Washroom:</label>
                      <input
                        type='text'
                        id='s male'
                        value={formData.secondFloor.maleWashroom}
                        onChange={(e) => setFormData({
                          ...formData,
                          secondFloor: {...formData.secondFloor, maleWashroom: e.target.value}
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='s female'>Female Washroom:</label>
                      <input
                        type='text'
                        id='s female'
                        value={formData.secondFloor.femaleWashroom}
                        onChange={(e) => setFormData({
                          ...formData,
                          secondFloor: {...formData.secondFloor, femaleWashroom: e.target.value}
                        })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='s smt'>SMT Offices:</label>
                      <input
                        type='text'
                        id='s smt'
                        value={formData.secondFloor.smtOffices}
                        onChange={(e) => setFormData({
                          ...formData,
                          secondFloor: {...formData.secondFloor, smtOffices: e.target.value}
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='s open2'>Open Office 2nd Floor:</label>
                      <input
                        type='text'
                        id='s open2'
                        value={formData.secondFloor.openOffice2nd}
                        onChange={(e) => setFormData({
                          ...formData,
                          secondFloor: {...formData.secondFloor, openOffice2nd: e.target.value}
                        })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor='s managers2'>Managers Offices 2nd Floor:</label>
                      <input
                        type='text'
                        id='s managers2'
                        value={formData.secondFloor.managersOffices2nd}
                        onChange={(e) => setFormData({
                          ...formData,
                          secondFloor: {...formData.secondFloor, managersOffices2nd: e.target.value}
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor='s kitchen'>Kitchen/Cafeteria:</label>
                      <input
                        type='text'
                        id='s kitchen'
                        value={formData.secondFloor.kitchenCafeteria}
                        onChange={(e) => setFormData({
                          ...formData,
                          secondFloor: {...formData.secondFloor, kitchenCafeteria: e.target.value}
                        })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor='s general'>General Observations:</label>
                    <textarea
                      id='s general'
                      value={formData.secondFloor.generalObservations}
                      onChange={(e) => setFormData({
                        ...formData,
                        secondFloor: {...formData.secondFloor, generalObservations: e.target.value}
                      })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor='super'>Supervisor Comments:</label>
                    <textarea
                      id='super'
                      value={formData.secondFloor.supervisorComments}
                      onChange={(e) => setFormData({
                        ...formData,
                        secondFloor: {...formData.secondFloor, supervisorComments: e.target.value}
                      })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor='inspectionDate'>Inspection Date:</label>
                    <input
                      type='date'
                      id='inspectionDate'
                      value={
                        formData.inspectionDate
                          ? new Date(formData.inspectionDate).toISOString().split('T')[0]
                          : ''
                      }
                      onChange={(e) => {
                        const dateValue = e.target.value;
                        if (dateValue) {
                          const date = new Date(dateValue + 'T00:00:00');
                          setFormData({
                            ...formData,
                            inspectionDate: date.toISOString()
                          });
                        } else {
                          setFormData({
                            ...formData,
                            inspectionDate: ''
                          });
                        }
                      }}
                    />
                  </div>

                  <div className="form-group status-section">
                    <label>Inspection Status:</label>
                    <div className="status-checkboxes">
                      {[
                        'Issues on External Assets', 
                        'Issues on GroundFloor', 
                        'Issues on FirstFloor', 
                        'Issues on SecondFloor', 
                        'No issues'
                      ].map((statusOption) => (
                        <label key={statusOption} className="status-checkbox">
                          <input
                            type="checkbox"
                            value={statusOption}
                            checked={formData.status?.includes(statusOption) || false}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData(prev => {
                                const current = Array.isArray(prev.status) ? prev.status : [];
                                if (checked) {
                                  if (statusOption === 'No issues') {
                                    return { ...prev, status: ['No issues'] };
                                  }
                                  const filtered = current.filter(s => s !== 'No issues');
                                  return { ...prev, status: [...filtered, statusOption] };
                                } else {
                                  const updated = current.filter(s => s !== statusOption);
                                  return { ...prev, status: updated.length > 0 ? updated : ['No issues'] };
                                }
                              });
                            }}
                          />
                          {statusOption}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="button-group">
                {currentStep > 1 && (
                  <button type="button" onClick={handleBack} className="btn-back">
                    Back
                  </button>
                )}
                
                {currentStep < 4 && (
                  <button 
                    type="button" 
                    onClick={handleNext} 
                    className="btn-next"
                    disabled={!isCurrentStepComplete()}
                  >
                    Next
                  </button>
                )}

                {currentStep === 4 && (
                  <button 
                    type="button" 
                    onClick={handleSubmit}
                    className="btn-submit"
                    disabled={!isCurrentStepComplete()}
                  >
                    Submit All
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="btn-save-draft"
                  title="Save your current progress as a draft to continue later"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  onClick={handleClearForm}
                  className="btn-clear"
                >
                  Clear Form
                </button>

                <button 
                  type="button" 
                  onClick={handleCancel}
                  className="btn-cancel"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}


        {!showForm && (
        <div className="data-section">
          <div className="data-header"> 
            <h2>Submitted Inspections</h2>
            {user?.role === 'admin' && (<div className="import-section">
              <label className="import-label">
                <span className="import-btn">Import Data</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            )}
          </div>

          {/* Filter and Search Section */}
          <div className="filter-search-section">
            <div className="filter-container">
              <div className="search-box">
                <input
                  type="text"
                  id='search'
                  placeholder="Search inspections (user, date, data, comments...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                  autoComplete='OFF'
                />
              </div>

              <div className="filter-controls">
                {user?.role === 'admin' && (
                  <div className="filter-group">
                    <label htmlFor="filter-user">Filter by User:</label>
                    <select
                      id="filter-user"
                      value={filterUser}
                      onChange={(e) => setFilterUser(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">All Users</option>
                      {users.map(u => (
                        <option key={u._id} value={u._id}>
                          {u.username}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                  <div className="filter-group">
                    <label htmlFor="sort-order">Sort by Date:</label>
                    <select
                      id="sort-order"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="filter-select"
                    >
                      <option value="default">Default</option>
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>

                {user?.role === 'admin' && (<div>
                  <button
                    onClick={resetFilters}
                    className="reset-filters-btn"
                  >
                    Reset Filters
                  </button>
                </div>)}
              </div>

              <div className="filter-results-info">
                Showing {getFilteredInspections().length} of {inspections.length} inspections
              </div>
            </div>
          </div>

          {selectedIds.size > 0 && user?.role === 'admin' && (
            <div className="bulk-actions">
              <span>{selectedIds.size} item(s) selected</span>
              <button
                onClick={handleBulkDelete}
                className="delete-btn"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : `Delete ${selectedIds.size} Selected`}
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="reset-btn"
              >
                Clear Selection
              </button>
            </div>
          )}

          {importPreview.fileName && (
            <div className="import-meta">
              Previewing: <strong>{importPreview.fileName}</strong> ({importPreview.rows.length} rows)
            </div>
          )}

          {importError && (
            <p className="import-error">{importError}</p>
          )}

          {importPreview.rows.length > 0 && !importError && (
            <div className="import-preview">
              <h3>Import Preview</h3>
              <p>Review the summary below before adding it to submitted inspections.</p>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>External Assets (46)</th>
                      <th>Ground Floor (13)</th>
                      <th>First Floor (12)</th>
                      <th>Second Floor (14)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.rows.map((row, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        {/*<td>{Array.isArray(row.status) ? row.status.join(', ') : (row.status || '-')}</td>*/}
                        <td>{formatDateForDisplay(row.inspectionDate)}</td>
                        <td>{countFilled(row.externalAssets)}</td>
                        <td>{countFilled(row.groundFloor)}</td>
                        <td>{countFilled(row.firstFloor)}</td>
                        <td>{countFilled(row.secondFloor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="import-actions">
                {user?.role === 'admin' && !selectedUserForImport && (
                  <div className="user-selection">
                    <label htmlFor="user-select">Select User for Import:</label>
                    <select
                      id="user-select"
                      value={selectedUserForImport}
                      onChange={(e) => setSelectedUserForImport(e.target.value)}
                      required
                    >
                      <option value="">-- Select a user --</option>
                      {users.map(user => (
                        <option key={user._id} value={user._id}>
                          {user.username}
                        </option>
                      ))} 
                    </select>
                  </div>
                )}
                <button
                  type="button"
                  className="btn-submit"
                  onClick={handleConfirmImport}
                  disabled={loading || (user?.role === 'admin' && !selectedUserForImport)}
                >
                  {loading ? 'Importing...' : 'Confirm Import'}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCancelImport}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {loading ? (
            <p>Loading...</p>
          ) : getFilteredInspections().length === 0 ? (
            <p>{inspections.length === 0 ? 'No inspections submitted yet' : 'No inspections match your filters'}</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    {user?.role === 'admin' && (
                      <th>
                        <input
                          type="checkbox"
                          checked={selectedIds.size === getFilteredInspections().length && getFilteredInspections().length > 0}
                          onChange={selectAll}
                          title="Select all"
                        />
                      </th>
                    )}
                    <th>#</th>
                    <th>Inspection Date</th>
                    <th>Imported Date</th>
                    <th>Status</th>
                    <th>External Assets</th>
                    <th>Ground Floor</th>
                    <th>First Floor</th>
                    <th>Second Floor</th>
                    {user?.role === 'admin' && <th>User</th>}
                    {user?.role === 'admin' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {getFilteredInspections().map((inspection, index) => (
                    <React.Fragment key={inspection._id}>
                      <tr>
                        {user?.role === 'admin' && (
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(inspection._id)}
                              onChange={() => toggleSelectId(inspection._id)}
                            />
                          </td>
                        )}
                        <td>{index +1}</td>
                        <td>{formatDateForDisplay(inspection.inspectionDate)}</td>
                        <td>{inspection.importedDate ? new Date(inspection.importedDate).toLocaleDateString('en-US', 
                          {
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric'
                          }) : '-'
                        }</td>
                        <td>
                          <span 
                            className={`status-badge ${inspection.status?.includes('Draft') ? 'draft' : 'submitted'}`}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.85em',
                              fontWeight: 'bold',
                              textTransform: 'capitalize'
                            }}
                          >
                            {inspection.status?.includes('Draft') ? ' Draft' : '✓ Submitted'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => toggleSection(inspection._id, 'externalAssets')}
                            className="view-btn"
                          >
                            {expandedSections[`${inspection._id}-externalAssets`] ? 'Hide' : 'View'}
                          </button>
                        </td>
                        <td>
                          <button
                            onClick={() => toggleSection(inspection._id, 'groundFloor')}
                            className="view-btn"
                          >
                            {expandedSections[`${inspection._id}-groundFloor`] ? 'Hide' : 'View'}
                          </button>
                        </td>
                        <td>
                          <button
                            onClick={() => toggleSection(inspection._id, 'firstFloor')}
                            className="view-btn"
                          >
                            {expandedSections[`${inspection._id}-firstFloor`] ? 'Hide' : 'View'}
                          </button>
                        </td>
                        <td>
                          <button
                            onClick={() => toggleSection(inspection._id, 'secondFloor')}
                            className="view-btn"
                          >
                            {expandedSections[`${inspection._id}-secondFloor`] ? 'Hide' : 'View'}
                          </button>
                        </td>
                        {user?.role === 'admin' && 
                        <td style={{textTransform: 'capitalize'}}>
                          {inspection.userId?.username} 
                        </td>}
                        <td>
                          {user?.role === 'admin' && (
                            <button
                            onClick={() => handleDeleteInspection(inspection._id, `Inspection - ${new Date(inspection.inspectionDate).toLocaleDateString()}`)}
                            className="delete-btn"
                            title="Delete this inspection"
                            >
                              Delete <Trash2 size={16} style={{verticalAlign: 'middle'}} />
                            </button>
                          )}
                          {user?.username === inspection.userId?.username && inspection.status && inspection.status.includes('Draft') && (
                            <button
                              onClick={() => handleLoadDraft(inspection)} 
                              className="resume-btn"
                              title="Resume editing this draft"
                            >
                              Resume Draft
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedSections[`${inspection._id}-externalAssets`] && (
                        <tr className="expanded-row">
                          <td colSpan={user?.role === 'admin' ? 7 : 6}>
                            <div className="expanded-content">
                              <h4>External Assets Details</h4>
                              <SectionDataTable data={inspection.externalAssets} />
                            </div>
                          </td>
                        </tr>
                      )}
                      {expandedSections[`${inspection._id}-groundFloor`] && (
                        <tr className="expanded-row">
                          <td colSpan={user?.role === 'admin' ? 7 : 6}>
                            <div className="expanded-content">
                              <h4>Ground Floor Details</h4>
                              <SectionDataTable data={inspection.groundFloor} />
                            </div>
                          </td>
                        </tr>
                      )}
                      {expandedSections[`${inspection._id}-firstFloor`] && (
                        <tr className="expanded-row">
                          <td colSpan={user?.role === 'admin' ? 7 : 6}>
                            <div className="expanded-content">
                              <h4>First Floor Details</h4>
                              <SectionDataTable data={inspection.firstFloor} />
                            </div>
                          </td>
                        </tr>
                      )}
                      {expandedSections[`${inspection._id}-secondFloor`] && (
                        <tr className="expanded-row">
                          <td colSpan={user?.role === 'admin' ? 7 : 6}>
                            <div className="expanded-content">
                              <h4>Second Floor Details</h4>
                              <SectionDataTable data={inspection.secondFloor} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>)}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          title="Delete Daily Inspection"
          message="Are you sure you want to delete this daily inspection? This action cannot be undone."
          itemName={deleteModal.name}
          onConfirm={confirmDeleteInspection}
          onCancel={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
          isLoading={isDeleting}
        />

        {/* Submit Confirmation Modal */}
        <SubmitConfirmationModal
          isOpen={submitModal}
          title="Submit Daily Inspection"
          message="Are you sure you want to submit this daily inspection? Once submitted, it will be added to the database."
          itemName="Daily Inspection"
          onConfirm={confirmSubmit}
          onCancel={() => setSubmitModal(false)}
          isLoading={loading}
        />

        <DeleteConfirmationModal 
          isOpen={clearFormModal}
          title="Clear Form"
          message="Are you sure you want to clear all form data? This action cannot be undone."
          onConfirm={confirmClearForm}
          onCancel={() => setClearFormModal(false)}
          isLoading={false}
        />

        <DeleteConfirmationModal 
          isOpen={cancelModal}
          title="Cancel Form"
          message="Are you sure you want to cancel and discard all changes? This action cannot be undone."
          onConfirm={confirmCancel}
          onCancel={() => setCancelModal(false)}
          isLoading={false}
        />
      </div>
    </>
  );
};

export default DailyInspection;
