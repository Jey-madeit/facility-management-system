import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Pencil, RotateCcw, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AuthContext } from '../contexts/AuthContext';
import NavBar from '../components/NavBar';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import SubmitConfirmationModal from '../components/SubmitConfirmationModal';
import { parseExcelFileToRows } from '../utils/excelImport';
import { avrRecordingService, userService } from '../services/apiService';
import '../styles/AvrSystems.css';

const fields = [
  { key: 'inputVoltageLL', label: 'INPUT VOLTAGE L-L (V)' },
  { key: 'outputVoltageLL', label: 'OUTPUT VOLTAGE L-L (V)' },
  { key: 'inputVoltageLN', label: 'INPUT VOLTAGE L-N (V)' },
  { key: 'outputVoltageLN', label: 'OUTPUT VOLTAGE L-N (V)' },
  { key: 'inputLoadCurrent', label: 'INPUT LOAD CURRENT (A)' },
  { key: 'outputLoadCurrent', label: 'OUTPUT LOAD CURRENT (A)' },
  { key: 'neutralN', label: 'NEUTRAL (N)' },
  { key: 'frequency', label: 'FREQUENCY' },
  { key: 'inputKilowatt', label: 'INPUT - KILOWATT  (KW)' },
  { key: 'outputKilowatt', label: 'OUTPUT - KILOWATT  (KW)' },
  { key: 'inputKilovoltAmpere', label: 'INPUT-KILOVOLT AMPERE( KVA)' },
  { key: 'outputKilovoltAmpere', label: 'OUTPUT - KILOVOLT AMPERE (KVA)' },
  { key: 'inputPowerFactor', label: 'INPUT POWER FACTOR (PF)', aliases: ['inputPF'] },
  { key: 'outputPowerFactor', label: 'OUTPUT POWER FACTOR (PF)', aliases: ['outputPF'] },
  { key: 'inputKWh', label: 'INPUT KWh', aliases: ['inputKwh'] },
  { key: 'outputKWh', label: 'OUTPUT KWh', aliases: ['outputKwh'] },
  { key: 'inputkwh24Hrs', label: 'INPUT KWh/24HRS', aliases: ['kwh24Hrs'] },
  { key: 'outputkwh24Hrs', label: 'OUTPUT KWh/24HRS', aliases: ['outputKwhDay'] },
  { key: 'anyAlarm', label: 'ANY ALARM', type: 'text' },
  { key: 'comments', label: 'COMMENTS', type: 'textarea' }
];

const createEmptyForm = () => ({
  date: new Date().toISOString().slice(0, 10),
  time: '',
  ...fields.reduce((form, field) => ({ ...form, [field.key]: '' }), {})
});

const normalizeHeader = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const formatExcelDate = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed?.y && parsed?.m && parsed?.d) {
      value = `${String(parsed.y).padStart(4, '0')}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    } else {
      return '';
    }
  }

  const valueString = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(valueString)) {
    const parsed = new Date(`${valueString}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === valueString ? valueString : '';
  }
  const slashParts = valueString.split(/[/-]/);
  let candidate = '';
  if (slashParts.length === 3) {
    const [first, , third] = slashParts;
    const [a, b, c] = slashParts.map(Number);
    if (first.length === 4 && a > 0 && b >= 1 && b <= 12 && c >= 1 && c <= 31) {
      candidate = `${String(a).padStart(4, '0')}-${String(b).padStart(2, '0')}-${String(c).padStart(2, '0')}`;
    }
    if (!candidate && third.length === 4 && a >= 1 && a <= 31 && b >= 1 && b <= 12) {
      candidate = `${String(c).padStart(4, '0')}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
    }
  }
  if (!candidate) {
    const parsed = new Date(valueString);
    if (Number.isNaN(parsed.getTime())) return '';
    candidate = parsed.toISOString().slice(0, 10);
  }
  const parsed = new Date(`${candidate}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === candidate ? candidate : '';
};

const formatExcelTime = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return `${String(parsed.H).padStart(2, '0')}:${String(parsed.M).padStart(2, '0')}`;
    }
  }

  const valueString = String(value).trim();
  const twelveHour = valueString.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (twelveHour) {
    let hour = Number(twelveHour[1]) % 12;
    if (twelveHour[3].toUpperCase() === 'PM') hour += 12;
    return `${String(hour).padStart(2, '0')}:${twelveHour[2]}`;
  }
  const twentyFourHour = valueString.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (twentyFourHour) {
    const hour = Number(twentyFourHour[1]);
    const minute = Number(twentyFourHour[2]);
    if (hour < 24 && minute < 60) {
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
  }
  return '';
};

const AvrSystems = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';
  const [recordings, setRecordings] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState(createEmptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clearFormModal, setClearFormModal] = useState(false);
  const [submitModal, setSubmitModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
  const [report, setReport] = useState(null);
  const [importPreview, setImportPreview] = useState({ rows: [], fileName: '' });
  const [importError, setImportError] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [selectedUserForImport, setSelectedUserForImport] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  const fetchRecordings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await avrRecordingService.getAll();
      setRecordings(response.data.map((recording) => ({
        ...recording,
        inputPowerFactor: recording.inputPowerFactor ?? recording.inputPF ?? '',
        outputPowerFactor: recording.outputPowerFactor ?? recording.outputPF ?? '',
        inputKWh: recording.inputKWh ?? recording.inputKwh ?? '',
        outputKWh: recording.outputKWh ?? recording.outputKwh ?? '',
        inputkwh24Hrs: recording.inputkwh24Hrs ?? recording.kwh24Hrs ?? '',
        outputkwh24Hrs: recording.outputkwh24Hrs ?? recording.outputKwhDay ?? ''
      })));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load AVR system data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await userService.getAll();
      setUsers(response.data.users || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load users for import.');
    }
  }, []);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [fetchUsers, isAdmin]);

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(createEmptyForm());
    setSubmitModal(false);
  };

  const startNewRecording = () => {
    setError('');
    setEditingId(null);
    setFormData(createEmptyForm());
    setShowForm(true);
  };

  const startEditing = (recording) => {
    setError('');
    setEditingId(recording._id);
    setFormData({
      date: recording.date ? String(recording.date).slice(0, 10) : '',
      time: recording.time || '',
      ...fields.reduce((form, field) => ({
        ...form,
        [field.key]: recording[field.key] ?? ''
      }), {})
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateField = (key, value) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const saveRecording = async () => {
    try {
      setLoading(true);
      setError('');
      const payload = { ...formData };
      fields.forEach((field) => {
        if (!field.type) payload[field.key] = payload[field.key] === '' ? null : Number(payload[field.key]);
      });
      if (editingId) {
        await avrRecordingService.update(editingId, payload);
      } else {
        await avrRecordingService.create(payload);
      }
      closeForm();
      await fetchRecordings();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save AVR system data.');
      setSubmitModal(false);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      setError('');
      if (Array.isArray(deleteModal.id)) {
        await avrRecordingService.deleteMultiple(deleteModal.id);
        setSelectedIds(new Set());
      } else {
        await avrRecordingService.delete(deleteModal.id);
      }
      setDeleteModal({ isOpen: false, id: null, name: '' });
      await fetchRecordings();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete AVR system data.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportError('');
      setImportMessage('');
      setImportPreview({ rows: [], fileName: '' });
      const { rows, headers } = await parseExcelFileToRows(file);
      if (!rows.length) {
        setImportError('The Excel file appears to be empty or missing data rows.');
        return;
      }

      const normalizedHeaders = headers.map(normalizeHeader);
      if (!normalizedHeaders.includes('date') || !normalizedHeaders.includes('time')) {
        setImportError('The Excel file must include DATE and TIME columns to match AVR Systems format.');
        return;
      }

      const mapped = [];
      const rowErrors = [];
      rows.forEach((row, index) => {
        const normalizedRow = Object.entries(row).reduce((accumulator, [key, value]) => {
          accumulator[normalizeHeader(key)] = value;
          return accumulator;
        }, {});
        const pick = (...keys) => {
          for (const key of keys) {
            const value = normalizedRow[normalizeHeader(key)];
            if (value !== undefined && value !== null && String(value).trim() !== '') return value;
          }
          return '';
        };
        const entry = {
          date: formatExcelDate(pick('date')),
          time: formatExcelTime(pick('time')),
          ...fields.reduce((result, field) => {
            const value = pick(field.key, field.label, ...(field.aliases || []));
            if (field.type) {
              result[field.key] = value === '' ? '' : String(value).trim();
            } else if (value === '' || ['-', 'n/a'].includes(String(value).trim().toLowerCase())) {
              result[field.key] = null;
            } else {
              const number = Number(value);
              if (!Number.isFinite(number)) {
                rowErrors.push(`Row ${index + 2}: ${field.label} must be a number.`);
              } else {
                result[field.key] = number;
              }
            }
            return result;
          }, {})
        };
        if (!entry.date || !entry.time) {
          rowErrors.push(`Row ${index + 2}: DATE or TIME is missing or invalid.`);
        }
        mapped.push(entry);
      });

      if (rowErrors.length) {
        setImportError(rowErrors.slice(0, 10).join(' '));
        return;
      }
      setImportPreview({ rows: mapped, fileName: file.name });
      setSelectedUserForImport('');
    } catch (fileError) {
      setImportError(fileError.message || 'There was a problem reading the Excel file.');
    } finally {
      event.target.value = '';
    }
  };

  const isAnyFieldFilled = () => {
    return Object.entries(formData).some(([key, value]) => {
      if (key === 'date') return false;
      return value && value !== '';
    });
  };

  const handleClearForm = () => {
    setClearFormModal(true);
  };

  const confirmClearForm = () => {
    setFormData(createEmptyForm());
    setClearFormModal(false);
  };
  const handleConfirmImport = async () => {
    if (!importPreview.rows.length || !selectedUserForImport) return;
    try {
      setLoading(true);
      setImportError('');
      const response = await avrRecordingService.import(importPreview.rows, selectedUserForImport);
      const failures = response.data.errors || [];
      setImportMessage(
        failures.length
          ? `${response.data.message}. ${failures.length} row(s) could not be imported.`
          : response.data.message
      );
      if (failures.length) {
        setImportError(failures.slice(0, 10).map((failure) => `Row ${failure.row}: ${failure.message}`).join(' '));
      }
      setImportPreview({ rows: [], fileName: '' });
      setSelectedUserForImport('');
      await fetchRecordings();
    } catch (requestError) {
      const failures = requestError.response?.data?.errors || [];
      setImportError(failures.length
        ? failures.map((failure) => `Row ${failure.row}: ${failure.message}`).join(' ')
        : requestError.response?.data?.message || 'Unable to import AVR system data.');
    } finally {
      setLoading(false);
    }
  };

  const cancelImport = () => {
    setImportPreview({ rows: [], fileName: '' });
    setImportError('');
    setImportMessage('');
    setSelectedUserForImport('');
  };

  const filteredRecordings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = recordings.filter((recording) => {
      if (filterUser && recording.userId?._id !== filterUser) return false;
      if (!query) return true;
      const searchable = JSON.stringify({
        ...recording,
        username: recording.userId?.username || ''
      }).toLowerCase();
      return searchable.includes(query);
    });
    if (sortOrder !== 'default') {
      filtered.sort((left, right) => {
        const leftDate = new Date(`${String(left.date).slice(0, 10)}T${left.time || '00:00'}`).getTime();
        const rightDate = new Date(`${String(right.date).slice(0, 10)}T${right.time || '00:00'}`).getTime();
        const difference = (Number.isFinite(leftDate) ? leftDate : 0) - (Number.isFinite(rightDate) ? rightDate : 0);
        return sortOrder === 'oldest' ? difference : -difference;
      });
    }
    return filtered;
  }, [filterUser, recordings, searchQuery, sortOrder]);

  const resetFilters = () => {
    setSearchQuery('');
    setFilterUser('');
    setSortOrder('newest');
  };

  const selectAll = () => {
    const visibleIds = filteredRecordings.map((recording) => recording._id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
    setSelectedIds((current) => {
      const updated = new Set(current);
      visibleIds.forEach((id) => {
        if (allVisibleSelected) updated.delete(id);
        else updated.add(id);
      });
      return updated;
    });
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await avrRecordingService.generateReport();
      setReport(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to generate AVR report.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (exportReport = false) => {
    try {
      setLoading(true);
      setError('');
      if (exportReport) await avrRecordingService.exportReportToExcel();
      else await avrRecordingService.exportToExcel();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to export AVR system data.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value) => (value ? String(value).slice(0, 10) : '-');
  const formatValue = (value) => (value === null || value === undefined || value === '' ? '-' : value);
  const hasSelectedVisible = filteredRecordings.length > 0
    && filteredRecordings.every((recording) => selectedIds.has(recording._id));

  return (
    <>
      <NavBar heading="AVR Systems" />
      <main className="avr-recordings-container">
        <div className="avr-module-actions">
          <button
            onClick={() => {
              if (showForm) closeForm();
              else startNewRecording();
            }}
            className="avr-add-button"
          >
            {showForm ? 'Submitted Data' : 'Add New Data'}
          </button>
          {showForm && (
            <button
              onClick={handleClearForm}
              className="avr-clear-button"
              disabled={!isAnyFieldFilled()}
            >
              Clear Form
            </button>
          )}
        
          {user?.role === 'admin' && !showForm && (
            <button onClick={generateReport} className="avr-report-button">
              Generate Report
            </button>
          )}

          {user?.role === 'admin' && filteredRecordings.length > 0 && !showForm && (
            <button onClick={() => handleExport()} className="avr-export-button">
              Export Data
            </button>
          )}
        </div>

        {error && <div className="avr-error" role="alert">{error}</div>}

        {showForm && (
          <form
            className="avr-form"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitModal(true);
            }}
          >
            <div className="form-group">
              <label htmlFor="avr-date">DATE</label>
              <input
                id="avr-date"
                type="date"
                value={formData.date}
                onChange={(event) => updateField('date', event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="avr-time">TIME</label>
              <input
                id="avr-time"
                type="time"
                value={formData.time}
                onChange={(event) => updateField('time', event.target.value)}
                required
              />
            </div>

            <h3>Voltage L-L(V)</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="inputVoltageLL">INPUT</label>
                <input
                  id="inputVoltageLL"
                  type="number"
                  value={formData.inputVoltageLL}
                  onChange={(event) => updateField('inputVoltageLL', event.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="outputVoltageLL">OUTPUT</label>
                <input
                  id="outputVoltageLL"
                  type="number"
                  value={formData.outputVoltageLL}
                  onChange={(event) => updateField('outputVoltageLL', event.target.value)}
                  required
                />
              </div>
            </div>

            <h3>Voltage L-N(V)</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="inputVoltageLN">INPUT</label>
                <input
                  id="inputVoltageLN"
                  type="number"
                  value={formData.inputVoltageLN}
                  onChange={(event) => updateField('inputVoltageLN', event.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="outputVoltageLN">OUTPUT</label>
                <input
                  id="outputVoltageLN"
                  type="number"
                  value={formData.outputVoltageLN}
                  onChange={(event) => updateField('outputVoltageLN', event.target.value)}
                  required
                />
              </div>
            </div>

            <h3>Load Current(A)</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="inputLoadCurrent">INPUT</label>
                <input
                  id="inputLoadCurrent"
                  type="number"
                  value={formData.inputLoadCurrent}
                  onChange={(event) => updateField('inputLoadCurrent', event.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="outputLoadCurrent">OUTPUT</label>
                <input
                  id="outputLoadCurrent"
                  type="number"
                  value={formData.outputLoadCurrent}
                  onChange={(event) => updateField('outputLoadCurrent', event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="neutralN">NEUTRAL (N)</label>
              <input
                id="neutralN"
                type="number"
                value={formData.neutralN}
                onChange={(event) => updateField('neutralN', event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="frequency">FREQUENCY (HZ)</label>
              <input
                id="frequency"
                type="number"
                value={formData.frequency}
                onChange={(event) => updateField('frequency', event.target.value)}
                required
              />
            </div>

            <h3>Kilowatt (KW)</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="inputKilowatt">INPUT</label>
                <input
                  id="inputKilowatt"
                  type="number"
                  value={formData.inputKilowatt}
                  onChange={(event) => updateField('inputKilowatt', event.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="outputKilowatt">OUTPUT</label>
                <input
                  id="outputKilowatt"
                  type="number"
                  value={formData.outputKilowatt}
                  onChange={(event) => updateField('outputKilowatt', event.target.value)}
                  required
                />
              </div>
            </div>

            <h3>Kilovolt Ampere (KVA)</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="inputKilovoltAmpere">INPUT</label>
                <input
                  id="inputKilovoltAmpere"
                  type="number"
                  value={formData.inputKilovoltAmpere}
                  onChange={(event) => updateField('inputKilovoltAmpere', event.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="outputKilovoltAmpere">OUTPUT</label>
                <input
                  id="outputKilovoltAmpere"
                  type="number"
                  value={formData.outputKilovoltAmpere}
                  onChange={(event) => updateField('outputKilovoltAmpere', event.target.value)}
                  required
                />
              </div>
            </div>

            <h3>Power Factor (PF)</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="inputPowerFactor">INPUT</label>
                <input
                  id="inputPowerFactor"
                  type="number"
                  value={formData.inputPowerFactor}
                  onChange={(event) => updateField('inputPowerFactor', event.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="outputPowerFactor">OUTPUT</label>
                <input
                  id="outputPowerFactor"
                  type="number"
                  value={formData.outputPowerFactor}
                  onChange={(event) => updateField('outputPowerFactor', event.target.value)}
                  required
                />
              </div>
            </div>

            <h3>KWh</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="inputKWh">INPUT</label>
                <input
                  id="inputKWh"
                  type="number"
                  value={formData.inputKWh}
                  onChange={(event) => updateField('inputKWh', event.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="outputKWh">OUTPUT</label>
                <input
                  id="outputKWh"
                  type="number"
                  value={formData.outputKWh}
                  onChange={(event) => updateField('outputKWh', event.target.value)}
                  required
                />
              </div>
            </div>

            <h3>KWh/24Hrs</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="inputkwh24Hrs">INPUT</label>
                <input
                  id="inputkwh24Hrs"
                  type="number"
                  value={formData.inputkwh24Hrs}
                  onChange={(event) => updateField('inputkwh24Hrs', event.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="outputkwh24Hrs">OUTPUT</label>
                <input
                  id="outputkwh24Hrs"
                  type="number"
                  value={formData.outputkwh24Hrs}
                  onChange={(event) => updateField('outputkwh24Hrs', event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="anyAlarm">ANY ALARM</label>
              <input
                id="anyAlarm"
                type="text"
                value={formData.anyAlarm}
                onChange={(event) => updateField('anyAlarm', event.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="comments">COMMENTS</label>
              <textarea
                id="comments"
                value={formData.comments}
                onChange={(event) => updateField('comments', event.target.value)}
              />
            </div>
            <div className="avr-form-actions">
              <button className="avr-save-button" type="submit" disabled={loading}>
                {editingId ? 'Update Recording' : 'Submit'}
              </button>
              <button className="avr-cancel-button" type="button" onClick={closeForm} disabled={loading}>Cancel</button>
            </div>
          </form>
        )}

        {report && (
          <section className="avr-report">
            <h2>Report Summary</h2>
            <div className="avr-report-summary">
              <div><strong>Total Entries</strong><span>{report.totalCount}</span></div>
              <div><strong>Entries With Alarm</strong><span>{report.alarmCount}</span></div>
            </div>
            {Object.keys(report.byUser || {}).length > 0 && (
              <div className="avr-report-users">
                <strong>Entries by User</strong>
                {Object.entries(report.byUser).map(([username, count]) => (
                  <span key={username}>{username}: {count}</span>
                ))}
              </div>
            )}
          </section>
        )}
        {!showForm && (
        <section className="avr-recordings-list">
          <div className="avr-list-heading">
            <h2>Submitted Recordings</h2>
            {isAdmin && (
              <label className="avr-import-label">
                <span>Import Data</span>
                <input type="file" accept=".xlsx,.xls" onChange={handleImportFileChange} />
              </label>
            )}
          </div>

          <div className="avr-filters">
            <input type="search" aria-label="Search AVR systems" placeholder="Search AVR systems..."
              value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
            {isAdmin && (
              <select aria-label="Filter by user" value={filterUser}
                onChange={(event) => setFilterUser(event.target.value)}>
                <option value="">All Users</option>
                {users.map((recordUser) => (
                  <option key={recordUser._id} value={recordUser._id}>{recordUser.username}</option>
                ))}
              </select>
            )}
            <select aria-label="Sort recordings by date" value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="default">Default</option>
            </select>
            <button type="button" className="avr-reset-filter-button" onClick={resetFilters}>
              <RotateCcw size={15} /> Reset Filters
            </button>
            <span className="avr-results-count">
              Showing {filteredRecordings.length} of {recordings.length} recordings
            </span>
          </div>

          {isAdmin && selectedIds.size > 0 && (
            <div className="avr-bulk-actions">
              <span>{selectedIds.size} recording(s) selected</span>
              <button type="button" onClick={() => setDeleteModal({
                isOpen: true,
                id: Array.from(selectedIds),
                name: `${selectedIds.size} selected AVR system entry/entries`
              })} disabled={loading}>
                Delete Selected
              </button>
              <button type="button" className="avr-reset-filter-button" onClick={() => setSelectedIds(new Set())}>
                Clear Selection
              </button>
            </div>
          )}

          {importMessage && <div className="avr-import-message" role="status">{importMessage}</div>}
          {importPreview.fileName && (
            <div className="avr-import-meta">
              Previewing <strong>{importPreview.fileName}</strong> ({importPreview.rows.length} rows)
            </div>
          )}
          {importError && <div className="avr-error" role="alert">{importError}</div>}

          {importPreview.rows.length > 0 && (
            <div className="avr-import-preview">
              <h3>Import Preview</h3>
              <p>Review the imported fields before adding these recordings.</p>
              <div className="avr-table-wrapper">
                <table className="avr-table">
                  <thead>
                    <tr>
                      <th>DATE</th><th>TIME</th>
                      {fields.map((field) => <th key={field.key}>{field.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.rows.slice(0, 10).map((row, index) => (
                      <tr key={`${row.date}-${row.time}-${index}`}>
                        <td>{row.date}</td><td>{row.time}</td>
                        {fields.map((field) => <td key={field.key}>{formatValue(row[field.key])}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importPreview.rows.length > 10 && <p>Showing first 10 rows of the preview.</p>}
              <div className="avr-import-actions">
                <label htmlFor="avr-import-user">Assign recordings to:</label>
                <select id="avr-import-user" value={selectedUserForImport}
                  onChange={(event) => setSelectedUserForImport(event.target.value)} required>
                  <option value="">Select a user</option>
                  {users.map((recordUser) => (
                    <option key={recordUser._id} value={recordUser._id}>{recordUser.username}</option>
                  ))}
                </select>
                <button type="button" className="avr-save-button" onClick={handleConfirmImport}
                  disabled={loading || !selectedUserForImport}>
                  {loading ? 'Importing...' : 'Confirm Import'}
                </button>
                <button type="button" className="avr-cancel-button" onClick={cancelImport} disabled={loading}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loading && recordings.length === 0 ? (
            <p className="avr-empty-state">Loading AVR systems...</p>
          ) : filteredRecordings.length === 0 ? (
            <p className="avr-empty-state">
              {recordings.length === 0 ? 'No AVR system entries have been added yet.' : 'No entries match your filters.'}
            </p>
          ) : (
            <div className="avr-table-wrapper">
              <table className="avr-table">
                <thead>
                  <tr>
                    {isAdmin && <th><input type="checkbox" aria-label="Select all visible recordings"
                      checked={hasSelectedVisible} onChange={selectAll} /></th>}
                    <th>#</th><th>DATE</th><th>TIME</th>
                    {fields.map((field) => <th key={field.key}>{field.label}</th>)}
                    {isAdmin && <th>Imported Date</th>}
                    {isAdmin && <th>User</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecordings.map((recording, index) => (
                    <tr key={recording._id}>
                      {isAdmin && <td><input type="checkbox" aria-label={`Select recording ${index + 1}`}
                        checked={selectedIds.has(recording._id)}
                        onChange={() => setSelectedIds((current) => {
                          const updated = new Set(current);
                          if (updated.has(recording._id)) updated.delete(recording._id);
                          else updated.add(recording._id);
                          return updated;
                        })} /></td>}
                      <td>{index + 1}</td>
                      <td>{formatDate(recording.date)}</td>
                      <td>{formatValue(recording.time)}</td>
                      {fields.map((field) => <td key={field.key}>{formatValue(recording[field.key])}</td>)}
                      {isAdmin && <td>{recording.importedDate ? formatDate(recording.importedDate) : '-'}</td>}
                      {isAdmin && <td>{recording.userId?.username || '-'}</td>}
                      <td className="avr-row-actions">
                        <button type="button" aria-label="Edit AVR system entry" title="Edit entry"
                          onClick={() => startEditing(recording)}><Pencil size={16} /></button>
                        <button type="button" aria-label="Delete AVR system entry" title="Delete entry"
                          onClick={() => setDeleteModal({
                            isOpen: true,
                            id: recording._id,
                            name: `${formatDate(recording.date)} ${recording.time || ''}`.trim()
                          })}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>)}
      </main>

      <SubmitConfirmationModal
        isOpen={submitModal}
        title={editingId ? 'Update AVR System Entry' : 'Save AVR System Entry'}
        message={editingId ? 'Save the changes to this AVR system entry?' : 'Save this AVR system entry?'}
        itemName="AVR System Entry"
        confirmLabel={editingId ? 'Confirm Update' : 'Confirm Save'}
        loadingLabel="Saving..."
        onConfirm={saveRecording}
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
        isOpen={deleteModal.isOpen}
        title="Delete AVR System Entry"
        message="Are you sure you want to delete this AVR system entry? This action cannot be undone."
        itemName={deleteModal.name}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        isLoading={loading}
      />
    </>
  );
};

export default AvrSystems;
