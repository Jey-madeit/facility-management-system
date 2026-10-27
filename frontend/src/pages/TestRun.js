import React, { useState, useEffect, useContext } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { testRunService, userService } from '../services/apiService';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import SubmitConfirmationModal from '../components/SubmitConfirmationModal';
import { parseExcelFileToRows } from '../utils/excelImport';
import NavBar from '../components/NavBar';
import '../styles/TestRun.css';

const TestRun = () => {
  const { user } = useContext(AuthContext);
  const [testRuns, setTestRuns] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
  const [submitModal, setSubmitModal] = useState(false);
  const [clearFormModal, setClearFormModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [importPreview, setImportPreview] = useState({ rows: [], fileName: '' });
  const [importError, setImportError] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [users, setUsers] = useState([]);
  const [selectedUserForImport, setSelectedUserForImport] = useState('');
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [formData, setFormData] = useState({
    testDate: new Date().toISOString().split('T')[0],
    testTime: '',
    stopTime:'',
    generatorSet: '',
    status: '',
    hourRun: '',
    engineTemperature: '',
    oilPressure: '',
    llVoltage: '',
    lnVoltage: '',
    loadCurrent: '',
    engineSpeed: '',
    engineFrequency: '',
    realPower: '',
    apparentPower: '',
    batteryVoltage: '',
    comments: ''
  });

  useEffect(() => {
    fetchTestRuns();
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user?.role]);

  useEffect(() => {
    if (showForm && !formData.testDate) {
      setFormData((prev) => ({
        ...prev,
        testDate: new Date().toISOString().split('T')[0]
      }));
    }
  }, [showForm, formData.testDate]);

  const fetchTestRuns = async () => {
    try {
      setLoading(true);
      const response = await testRunService.getAll();
      setTestRuns(response.data);
    } catch (error) {
      console.error('Error fetching test runs:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitModal(true);
  };

  const startEditing = (testRun) => {
    setEditingId(testRun._id);
    setFormError('');
    setFormData({
      testDate: testRun.testDate ? String(testRun.testDate).slice(0, 10) : '',
      testTime: testRun.testTime || '',
      stopTime: testRun.stopTime || '',
      generatorSet: testRun.generatorSet || '',
      status: testRun.status || '',
      hourRun: testRun.hourRun ?? '',
      engineTemperature: testRun.engineTemperature ?? '',
      oilPressure: testRun.oilPressure ?? '',
      llVoltage: testRun.llVoltage ?? '',
      lnVoltage: testRun.lnVoltage ?? '',
      loadCurrent: testRun.loadCurrent ?? '',
      engineSpeed: testRun.engineSpeed ?? '',
      engineFrequency: testRun.engineFrequency ?? '',
      realPower: testRun.realPower ?? '',
      apparentPower: testRun.apparentPower ?? '',
      batteryVoltage: testRun.batteryVoltage ?? '',
      comments: testRun.comments || ''
    });
    setShowForm(true);
  };

  const confirmSubmit = async () => {
    try {
      setLoading(true);
      if (editingId) {
        await testRunService.update(editingId, formData);
      } else {
        await testRunService.create(formData);
      }
      setFormData({
        testDate: new Date().toISOString().split('T')[0],
        testTime: '',
        stopTime:'',
        generatorSet: '',
        status: '',
        hourRun: '',
        engineTemperature: '',
        oilPressure: '',
        llVoltage: '',
        lnVoltage: '',
        loadCurrent: '',
        engineSpeed: '',
        engineFrequency: '',
        realPower: '',
        apparentPower: '',
        batteryVoltage: '',
        comments: ''
      });
      setShowForm(false);
      setEditingId(null);
      setFormError('');
      setSubmitModal(false);
      fetchTestRuns();
    } catch (error) {
      setFormError(error.response?.data?.message || `Failed to ${editingId ? 'update' : 'create'} test run.`);
      setSubmitModal(false);
    } finally {
      setLoading(false);
    }
  };

  const isFormComplete = () => {
    return (
      formData.testDate &&
      formData.testTime &&
      formData.stopTime &&
      formData.generatorSet &&
      formData.status !== '---' &&
      formData.hourRun &&
      formData.engineTemperature &&
      formData.oilPressure &&
      formData.llVoltage &&
      formData.lnVoltage &&
      formData.loadCurrent &&
      formData.engineSpeed &&
      formData.engineFrequency &&
      formData.realPower &&
      formData.apparentPower &&
      formData.batteryVoltage &&
      formData.comments
    );
  };

  const handleClearForm = () => {
    setClearFormModal(true);
  };

  const isAnyFieldFilled = () => {
    return Object.entries(formData).some(([key, value]) => {
      // Exclude auto-populated date field
      if (key === 'testDate') return false;
      return value && value !== '';
    });
  };

  const confirmClearForm = () => {
    resetForm();
    setClearFormModal(false);
  };

  const handleTestRunStatusChange = (value) => {
    if (value === 'faulty' || value === 'unavailable') {
      setFormData({
        ...formData,
        status: value,
        engineTemperature: '0',
        oilPressure: 'Faulty',
        llVoltage: 'Faulty',
        lnVoltage: 'Faulty',
        loadCurrent: '0',
        engineSpeed: '0',
        engineFrequency: '0',
        realPower: '0',
        apparentPower: '0',
        batteryVoltage: '0'
      });
    } else {
      setFormData({ ...formData, status: value });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormError('');
    setFormData({
      testDate: new Date().toISOString().split('T')[0],
      testTime: '',
      stopTime:'',
      generatorSet: '',
      status: '',
      hourRun: '',
      engineTemperature: '',
      oilPressure: '',
      llVoltage: '',
      lnVoltage: '',
      loadCurrent: '',
      engineSpeed: '',
      engineFrequency: '',
      realPower: '',
      apparentPower: '',
      batteryVoltage: '',
      comments: ''
    })
    setShowForm(true);
  }

  const toggleForm = () => {
    if (showForm && editingId) {
      resetForm();
      setShowForm(false);
      return;
    }
    setShowForm(!showForm);
  };

  const handleDelete = (id, itemName) => {
    setDeleteModal({ isOpen: true, id, name: itemName });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      setIsDeleting(true);
      await testRunService.delete(deleteModal.id);
      setDeleteModal({ isOpen: false, id: null, name: '' });
      fetchTestRuns();
    } catch (error) {
      console.error('Error deleting test run:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      const response = await testRunService.generateReport();
      setReport(response.data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportError('');
      setImportPreview({ rows: [], fileName: '' });

      const { rows, headers } = await parseExcelFileToRows(file);
      if (!rows.length) {
        setImportError('The Excel file appears to be empty or missing data rows.');
        return;
      }

      const toKey = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const normalizedHeaders = headers.map(toKey);
      const hasAnyRequiredHeader = [
        //'title',
        'testdate','testtime', 'stoptime', 'generatorset', 'hourrun', 'enginetemperature',
        'oilpressure', 'llvoltage', 'lnvoltage', 'loadcurrent', 'enginespeed',
        'enginefrequency', 'realpower', 'apparentpower', 'batteryvoltage', 'comments'
      ].some((h) => normalizedHeaders.includes(h));
      if (!hasAnyRequiredHeader) {
        setImportError('The Excel file columns do not match Generator Test Run format.');
        return;
      }

      const mapped = rows
        .map((row) => {
          const normalizedRow = {};
          Object.entries(row).forEach(([k, v]) => {
            normalizedRow[toKey(k)] = v;
          });
          const pick = (...aliases) => {
            for (const alias of aliases) {
              const value = normalizedRow[toKey(alias)];
              if (value !== undefined && value !== null && String(value).trim() !== '') return value;
            }
            return '';
          };
          return { 
            //title: pick(),
            testDate: pick('date', 'testdate', 'test date', 'TESTDATE', 'TEST DATE', 'DATE'),
            testTime: pick('testTime', 'test time', 'time', 'TESTTIME', 'TEST TIME', 'TIME'),
            stopTime: pick('stopTime', 'stop time', 'stoptime', 'STOP TIME', 'STOP TIME', 'STOPTIME'),
            generatorSet: pick('generatorSet', 'generator set', 'genset'),
            status: (pick('status') || 'operational').toLowerCase(),
            hourRun: pick('hourRun', 'hour run', 'hour', 'hourrun (hr)', 'hour run (hr)'),
            engineTemperature: pick('engineTemperature', 'engine temperature'),
            oilPressure: pick('oilPressure', 'oil pressure'),
            llVoltage: pick('llVoltage', 'l-l voltage', 'll voltage', 'llVoltage (l-l v)', 'l-l voltage (l-l v)', 'll voltage (l-l v)'),
            lnVoltage: pick('lnVoltage', 'lnVoltage (l-n v)', 'l-n voltage', 'l-n voltage (l-n v)', 'ln voltage', 'ln voltage (l-n v)'),
            loadCurrent: pick('loadCurrent (a)', 'load current (a)', 'loadCurrent', 'load current'),
            engineSpeed: pick('engineSpeed (rpm)', 'engine speed (rpm)', 'engineSpeed', 'engine speed'),
            engineFrequency: pick('engineFrequency (hz)', 'engine frequency (hz)', 'engineFrequency', 'engine frequency'),
            realPower: pick('realPower (kw)', 'real power (kw)', 'realPower', 'real power'),
            apparentPower: pick('apparentPower (kva)', 'apparent power (kva)', 'apparentPower', 'apparent power'),
            batteryVoltage: pick('batteryVoltage (vdc)', 'battery voltage (vdc)', 'batteryVoltage', 'battery voltage'),
            comments: pick('comments', 'comment', 'remarks', 'notes', 'observation', 'observations', 'COMMENTS', 'COMMENT', 'REMARKS', 'NOTES', 'OBSERVATION', 'OBSERVATIONS', 'Comments', 'Comment', 'Remarks', 'Notes', 'Observation', 'Observations')
          };
        })
        .filter((r) => r.generatorSet || r.testTime || r.hourRun || r.comments);

      if (!mapped.length) {
        setImportError('No valid rows were found in the Excel sheet.');
        return;
      }

      setImportPreview({ rows: mapped, fileName: file.name });
    } catch (err) {
      setImportError(err?.message || 'There was a problem reading the Excel file.');
    } finally {
      // Reset the input so the same file can be chosen again if needed
      e.target.value = null;
    }
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
        await testRunService.import(importPreview.rows, selectedUserForImport);
      } else {
        // Regular user imports data for themselves
        for (const row of importPreview.rows) {
          // Ensure comments and all fields are properly passed
          const dataToCreate = {
            testDate: row.testDate || new Date(),
            testTime: row.testTime || '',
            stopTime: row.stopTime || '',
            generatorSet: row.generatorSet || '',
            status: (row.status || 'operational').toLowerCase(),
            hourRun: row.hourRun || '',
            engineTemperature: row.engineTemperature || '',
            oilPressure: row.oilPressure || '',
            llVoltage: row.llVoltage || '',
            lnVoltage: row.lnVoltage || '',
            loadCurrent: row.loadCurrent || '',
            engineSpeed: row.engineSpeed || '',
            engineFrequency: row.engineFrequency || '',
            realPower: row.realPower || '',
            apparentPower: row.apparentPower || '',
            batteryVoltage: row.batteryVoltage || '',
            comments: row.comments || ''
          };
          await testRunService.create(dataToCreate);
        }
      }

      setImportPreview({ rows: [], fileName: '' });
      setImportError('');
      setSelectedUserForImport('');
      await fetchTestRuns();
    } catch (error) {
      console.error('Error importing test runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelImport = () => {
    setImportPreview({ rows: [], fileName: '' });
    setImportError('');
    setSelectedUserForImport('');
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

  const getFilteredTestRuns = () => {
    let filtered = testRuns.filter((testRun) => {
      // Filter by user (admin only)
      if (filterUser && testRun.userId?._id !== filterUser) {
        return false;
      }

      // Search query across multiple fields
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = JSON.stringify({
          user: testRun.userId?.username || '',
          testDate: new Date(testRun.testDate).toLocaleDateString('en-US', 
            {'day': '2-digit', 'month': 'short', 'year': 'numeric'}),
          status: testRun.status || '',
          generatorSet: testRun.generatorSet || '',
          hourRun: testRun.hourRun || '',
          engineTemperature: testRun.engineTemperature || '',
          oilPressure: testRun.oilPressure || '',
          llVoltage: testRun.llVoltage || '',
          lnVoltage: testRun.lnVoltage || '',
          loadCurrent: testRun.loadCurrent || '',
          engineSpeed: testRun.engineSpeed || '',
          engineFrequency: testRun.engineFrequency || '',
          realPower: testRun.realPower || '',
          apparentPower: testRun.apparentPower || '',
          batteryVoltage: testRun.batteryVoltage || '',
          comments: testRun.comments || ''
        }).toLowerCase();
        
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });

    const getTimestamp = (item) => {
      const value = item.createdAt || item.updatedAt || item.testDate || '';
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

  const selectAll = () => {
    const filteredTestRuns = getFilteredTestRuns();
    if (selectedIds.size === filteredTestRuns.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTestRuns.map(t => t._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      return;
    }

    try {
      setIsDeleting(true);
      await testRunService.deleteMultiple(Array.from(selectedIds));
      setSelectedIds(new Set());
      await fetchTestRuns();
    } catch (error) {
      console.error('Error deleting entries:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTo12Hour = (timeStr) => {
    if (!timeStr) return '-';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const formatTimeForDisplay = (value) => {
    if (!value) return '-';

    if (typeof value === 'string' && /^\d{1,2}:\d{2}$/.test(value)) {
      return formatTo12Hour(value); 
    }
    return value;
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
    <div className="testrun-container">
      <NavBar heading="Generator Test Run" />
      
      <button 
        onClick={toggleForm}
        className="add-btn"
      >
        {showForm ? 'Submitted Data' : 'Add New Data'}
      </button>


      {showForm && (
        <button 
        onClick={handleClearForm}
        className='reset-btn'
        disabled={!isAnyFieldFilled()}>
          Clear Form
        </button>
      )}

      {user?.role === 'admin' && !showForm && (
        <button onClick={generateReport} className="report-btn">
          Generate Report
        </button>
      )}

      {user?.role ==='admin' && testRuns.length > 0 && !showForm && (
        <button onClick={() => testRunService.exportToExcel()} className="export-btn">
          Export Data
        </button>
      )}
      

      {report && (
        <div className="report-section">
          <h2>Report Summary</h2>
          <p>Total Test Runs: {report.totalCount}</p>
          <div className="status-summary">
            {Object.entries(report.byStatus).map(([status, count]) => (
              <div key={status}>
                <strong>{status}:</strong> {count}
              </div>
            ))}
          </div>
        </div>
      )}

    
      {showForm && (
        <form onSubmit={handleSubmit} className="form">
          {formError && <div className="form-error" role="alert">{formError}</div>}
          <h3>{editingId ? 'Edit Submitted Test Run' : 'Generator Test Parameters'}</h3>
          <div className='form-grid'>
            <div className="form-group">
              <label htmlFor='date'>Test Date:</label>
              <input
                type="date"
                id='date'
                name='date'
                value={formData.testDate}
                onChange={(e) => setFormData({...formData, testDate: e.target.value})}
                autoComplete='off'
              />
            </div>

            <div className="form-group">
              <label htmlFor='time'>Start Time:</label>
              <input
                type="time"
                id='time'
                name='time'
                value={formData.testTime}
                onChange={(e) => setFormData({...formData, testTime: e.target.value})}
                required
                autoComplete='off'
              />
            </div>

            <div className="form-group">
              <label htmlFor='stopTime'>Stop Time:</label>
              <input
                type="time"
                id='stopTime'
                name='stopTime'
                value={formData.stopTime}
                onChange={(e) => setFormData({...formData, stopTime: e.target.value})}
                required
                autoComplete='off'
              />
            </div>

            <div className="form-group">
              <label htmlFor='genset'>Generator Set:</label>
              <select
                id='genset'
                name='genset'
                value={formData.generatorSet}
                onChange={(e) => setFormData({...formData, generatorSet: e.target.value})}
              >
                <option value="" disabled>--Select Generator Set--</option>
                <option value="Cummins Genset (400KVA)">Cummins Genset (400KVA)</option>
                <option value="Cat Genset (275KVA)">Cat Genset (275KVA)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor='status'>Status:</label>
              <select
                id='status'
                name='status'
                value={formData.status}
                onChange={(e) => handleTestRunStatusChange(e.target.value)}
              >
                <option value="" disabled>--Select Status--</option>
                <option value="operational">Operational</option>
                <option value="maintenance">Maintenance</option>
                <option value="faulty">Faulty</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor='hour'>Hour Run (HR):</label>
              <input
                type="number"
                id='hour'
                name='hour'
                value={formData.hourRun}
                onChange={(e) => setFormData({...formData, hourRun: e.target.value})}
                placeholder='Enter Hour Run'
                required
                autoComplete='off'
              />
            </div>

            <div className="form-group">
              <label htmlFor='temperature'>Engine Temperature (°C):</label>
              <input
                type="number"
                id='temperature'
                name='temperature'
                step="0.1"
                value={formData.engineTemperature}
                onChange={(e) => setFormData({...formData, engineTemperature: e.target.value})}
                placeholder='Enter Engine Temperature'
                required
                autoComplete='off'
              />
            </div>

            <div className="form-group">
              <label htmlFor='oil'>Oil Pressure: *Please specify unit for oil pressure 
              </label>
              <input
                type="text"
                id='oil'
                name='oil'
                step="0.1"
                value={formData.oilPressure}
                onChange={(e) => setFormData({...formData, oilPressure: e.target.value})}
                placeholder='Enter Oil Pressure'
                required
                autoComplete='off'
              />
            </div>

            <div className="form-group">
              <label htmlFor='llvoltage'>L-L Voltage (L-L V):</label>
              <input
                type="text"
                id='llvoltage'
                name='llvoltage'
                step="0.1"
                value={formData.llVoltage}
                onChange={(e) => setFormData({...formData, llVoltage: e.target.value})}
                placeholder='Enter L-L Voltage'
                required
                autoComplete='off'
              />
            </div>

            <div className="form-group">
              <label htmlFor='lnvoltage'>L-N Voltage (L-N V):</label>
              <input
                type="text"
                id='lnvoltage'
                name='lnvoltage'
                step="0.1"
                value={formData.lnVoltage}
                onChange={(e) => setFormData({...formData, lnVoltage: e.target.value})}
                placeholder='Enter L-N Voltage'
                required
                autoComplete='off'
              />
            </div>

            <div className="form-group">
              <label htmlFor='current'>Load Current (A):</label>
              <input
                type="text"
                id='current'
                name='current'
                step="0.1"
                value={formData.loadCurrent}
                onChange={(e) => setFormData({...formData, loadCurrent: e.target.value})}
                placeholder='Enter Load Current'
                required
                autoComplete='off'
              />
            </div>

            <div className="form-group">
              <label htmlFor='speed'>Engine Speed (RPM):</label>
              <input
                type="number"
                id='speed'
                name='speed'
                value={formData.engineSpeed}
                onChange={(e) => setFormData({...formData, engineSpeed: e.target.value})}
                placeholder='Enter Engine Speed'
                required
                autoComplete='off'
              />
            </div>

            <div className="form-group">
              <label htmlFor='frequency'>Engine Frequency (HZ):</label>
              <input
                type="number"
                id='frequency'
                name='frequency'
                step="0.1"
                value={formData.engineFrequency}
                onChange={(e) => setFormData({...formData, engineFrequency: e.target.value})}
                placeholder='Enter Engine Frequency'
                required
                autoComplete='off'
              />
            </div>

            <div className="form-group">
              <label htmlFor='power'>Real Power (KW):</label>
              <input
                type="number"
                id='power'
                name='power'
                step="0.1"
                value={formData.realPower}
                onChange={(e) => setFormData({...formData, realPower: e.target.value})}
                placeholder='Enter Real Power'
                required
                autoComplete='off'
              />
            </div>

            <div className="form-group">
              <label htmlFor='A-power'>Apparent Power (KVA):</label>
              <input
                type="number"
                id='A-power'
                name='A-power'
                step="0.1"
                value={formData.apparentPower}
                onChange={(e) => setFormData({...formData, apparentPower: e.target.value})}
                placeholder='Enter Apparent Power'
                required
                autoComplete='off'
              />
            </div>

            <div className="form-group">
              <label htmlFor='battery'>Battery Voltage (VDC):</label>
              <input
                type="number"
                id='battery'
                name='battery'
                step="0.1"
                value={formData.batteryVoltage}
                onChange={(e) => setFormData({...formData, batteryVoltage: e.target.value})}
                placeholder='Enter Battery Voltage'
                required
                autoComplete='off'
              />
            </div>
          </div>

            <div className="form-group">
              <label htmlFor='comments'>Comments:</label>
              <textarea
                id='comments'
                name='comments'
                value={formData.comments}
                onChange={(e) => setFormData({...formData, comments: e.target.value})}
                placeholder='Enter Comments'
                required
              />
            </div>

          <button type="submit" className="submit-btn" disabled={!isFormComplete()}>Submit</button>
        </form>
      )}

      {!showForm && (
      <div className="data-section">
        <div className="data-header">
          <h2>Submitted Test Runs</h2>
          {user?.role === 'admin' && (
          <div className="import-section">
            <label className="import-label">
              <span className="import-btn">Import Data </span>
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
                placeholder="Search test runs"
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
                </div>)}

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
              
              {user?.role === 'admin' && ( <div>
                <button
                  onClick={resetFilters}
                  className="reset-filters-btn"
                >
                  Reset Filters
                </button>
              </div>)}
            </div>

            <div className="filter-results-info">
              Showing {getFilteredTestRuns().length} of {testRuns.length} test runs
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
            <p>Review the data below before adding it to submitted test runs.</p>
            <div className="test-run-cards import-preview-cards">
              {importPreview.rows.map((row, index) => (
                <article className="test-run-card" key={index}>
                  <h4>Import Row {index + 1}</h4>
                  <dl className="test-run-details">
                    <div><dt>Test Date</dt><dd>{formatDateForDisplay(row.testDate)}</dd></div>
                    <div><dt>Start Time</dt><dd>{formatTimeForDisplay(row.testTime)}</dd></div>
                    <div><dt>Stop Time</dt><dd>{formatTimeForDisplay(row.stopTime)}</dd></div>
                    <div><dt>Generator Set</dt><dd>{row.generatorSet || '-'}</dd></div>
                    <div><dt>Status</dt><dd><span className={`status ${row.status}`}>{row.status || '-'}</span></dd></div>
                    <div><dt>Hour Run (HR)</dt><dd>{row.hourRun ?? '-'}</dd></div>
                    <div><dt>Engine Temperature (°C)</dt><dd>{row.engineTemperature ?? '-'}</dd></div>
                    <div><dt>Oil Pressure</dt><dd>{row.oilPressure ?? '-'}</dd></div>
                    <div><dt>L-L Voltage (L-L V)</dt><dd>{row.llVoltage ?? '-'}</dd></div>
                    <div><dt>L-N Voltage (L-N V)</dt><dd>{row.lnVoltage ?? '-'}</dd></div>
                    <div><dt>Load Current (A)</dt><dd>{row.loadCurrent ?? '-'}</dd></div>
                    <div><dt>Engine Speed (RPM)</dt><dd>{row.engineSpeed ?? '-'}</dd></div>
                    <div><dt>Engine Frequency (HZ)</dt><dd>{row.engineFrequency ?? '-'}</dd></div>
                    <div><dt>Real Power (KW)</dt><dd>{row.realPower ?? '-'}</dd></div>
                    <div><dt>Apparent Power (KVA)</dt><dd>{row.apparentPower ?? '-'}</dd></div>
                    <div><dt>Battery Voltage (VDC)</dt><dd>{row.batteryVoltage ?? '-'}</dd></div>
                    <div className="test-run-comment"><dt>Comments</dt><dd>{row.comments || '-'}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
            <div className="import-actions">
              {user?.role === 'admin' && (
                <div className="user-selection">
                  <label htmlFor="user-select">Select User for Import:</label>
                  {users.length === 0 ? (
                    <p style={{ color: 'red', margin: 0 }}>No users available. Please create users first.</p>
                  ) : (
                    <select
                      id="user-select"
                      value={selectedUserForImport}
                      onChange={(e) => setSelectedUserForImport(e.target.value)}
                      required
                    >
                      <option value="">-- Select a user --</option>
                      {users.map(u => (
                        <option key={u._id} value={u._id}>
                          {u.username}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              <button
                type="button"
                className="submit-btn"
                onClick={handleConfirmImport}
                disabled={loading || (user?.role === 'admin' && !selectedUserForImport)}
              >
                {loading ? 'Importing...' : 'Confirm Import'}
              </button>
              <button
                type="button"
                className="reset-btn"
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
        ) : getFilteredTestRuns().length === 0 ? (
          <p>{testRuns.length === 0 ? 'No test runs submitted yet' : 'No test runs match your filters'}</p>
        ) : (
          <>
            {user?.role === 'admin' && (
              <label className="test-run-select-all">
                <input
                  type="checkbox"
                  checked={selectedIds.size === getFilteredTestRuns().length && getFilteredTestRuns().length > 0}
                  onChange={selectAll}
                />
                Select all filtered test runs
              </label>
            )}
            <div className="test-run-cards">
              {getFilteredTestRuns().map((testRun, index) => (
              <article className="test-run-card" key={testRun._id}>
                <div className="test-run-card-header">
                  <div>
                    <h3>Test Run #{index + 1}</h3>
                    <p>{testRun.generatorSet || 'Generator Set not specified'}</p>
                  </div>
                  {user?.role === 'admin' && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(testRun._id)}
                      onChange={() => toggleSelectId(testRun._id)}
                      aria-label={`Select test run ${index + 1}`}
                    />
                  )}
                </div>
                <dl className="test-run-details">
                  <div><dt>Test Date</dt><dd>{testRun.testDate ? formatDateForDisplay(testRun.testDate) || formatDateForDisplay(new Date()) : formatDateForDisplay(new Date())}</dd></div>
                  <div><dt>Start Time</dt><dd>{formatTimeForDisplay(testRun.testTime)}</dd></div>
                  <div><dt>Stop Time</dt><dd>{formatTimeForDisplay(testRun.stopTime)}</dd></div>
                  <div><dt>Generator Set</dt><dd>{testRun.generatorSet || '-'}</dd></div>
                  <div><dt>Status</dt><dd><span className={`status ${testRun.status}`}>{testRun.status || '-'}</span></dd></div>
                  <div><dt>Hour Run (HR)</dt><dd>{testRun.hourRun ?? '-'}</dd></div>
                  <div><dt>Engine Temperature (°C)</dt><dd>{testRun.engineTemperature ?? '-'}</dd></div>
                  <div><dt>Oil Pressure</dt><dd>{testRun.oilPressure ?? '-'}</dd></div>
                  <div><dt>L-L Voltage (LLV)</dt><dd>{testRun.llVoltage ?? '-'}</dd></div>
                  <div><dt>L-N Voltage (LN V)</dt><dd>{testRun.lnVoltage ?? '-'}</dd></div>
                  <div><dt>Load Current (A)</dt><dd>{testRun.loadCurrent ?? '-'}</dd></div>
                  <div><dt>Engine Speed (RPM)</dt><dd>{testRun.engineSpeed ?? '-'}</dd></div>
                  <div><dt>Engine Frequency (HZ)</dt><dd>{testRun.engineFrequency ?? '-'}</dd></div>
                  <div><dt>Real Power (KW)</dt><dd>{testRun.realPower ?? '-'}</dd></div>
                  <div><dt>Apparent Power (KVA)</dt><dd>{testRun.apparentPower ?? '-'}</dd></div>
                  <div><dt>Battery Voltage (VDC)</dt><dd>{testRun.batteryVoltage ?? '-'}</dd></div>
                  <div className="test-run-comment"><dt>Comments</dt><dd>{testRun.comments || '-'}</dd></div>
                  {user?.role === 'admin' && (
                    <>
                      <div><dt>Imported Date</dt><dd>{testRun.importedDate ? new Date(testRun.importedDate).toLocaleDateString('en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) : '-'}</dd></div>
                      <div><dt>User</dt><dd className="test-run-user">{testRun.userId?.username || '-'}</dd></div>
                    </>
                  )}
                </dl>
                {user?.role === 'admin' && (
                  <div className="test-run-card-actions">
                    <button type="button" onClick={() => startEditing(testRun)} className="edit-btn" title="Edit this test run">
                      Edit <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(testRun._id, `${testRun.generatorSet} - ${new Date(testRun.createdAt).toLocaleDateString()}`)}
                      className="delete-btn"
                      title="Delete this test run"
                    >
                      Delete <Trash2 size={16} />
                    </button>
                  </div>
                )}
                {/*{user?.role !== 'admin' && (
                  <div className="test-run-card-actions">
                    <button type="button" onClick={() => startEditing(testRun)} className="edit-btn" title="Edit this test run">
                      Edit <Pencil size={16} />
                    </button>
                  </div>
                )}*/}
              </article>
              ))}
            </div>
          </>
        )}
      </div>)}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Test Run"
        message="Are you sure you want to delete this test run? This action cannot be undone."
        itemName={deleteModal.name}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        isLoading={isDeleting}
      />

      {/* Submit Confirmation Modal */}
      <SubmitConfirmationModal
        isOpen={submitModal}
        title={editingId ? 'Update Test Run' : 'Submit Test Run'}
        message={editingId ? 'Save the changes to this submitted test run?' : 'Are you sure you want to submit this test run? Once submitted, it will be added to the database.'}
        itemName="Generator Test Run"
        confirmLabel={editingId ? 'Confirm Update' : 'Confirm Submit'}
        loadingLabel={editingId ? 'Updating...' : 'Submitting...'}
        onConfirm={confirmSubmit}
        onCancel={() => setSubmitModal(false)}
        isLoading={loading}
      />

      {/* Clear Form Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={clearFormModal}
        title="Clear Form"
        message="Are you sure you want to clear all form data? This action cannot be undone."
        onConfirm={confirmClearForm}
        onCancel={() => setClearFormModal(false)}
        isLoading={false}
      />
    </div>
  );
};

export default TestRun;
