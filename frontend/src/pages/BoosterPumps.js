import React, { useState, useEffect, useContext } from 'react';
import { Trash2 } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { boosterPumpService, userService } from '../services/apiService';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import SubmitConfirmationModal from '../components/SubmitConfirmationModal';
import { parseExcelFileToRows } from '../utils/excelImport';
import NavBar from '../components/NavBar';
import * as XLSX from 'xlsx';
import '../styles/BoosterPumps.css';

const BoosterPumps = () => {
  const { user } = useContext(AuthContext);
  const [pumps, setPumps] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [importPreview, setImportPreview] = useState({ rows: [], fileName: '' });
  const [importError, setImportError] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedUserForImport, setSelectedUserForImport] = useState('');
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    pumpNo: '',
    horsepower: '',
    startTime: '',
    status: '',
    stopDate: '',
    stopTime: '',
    failureAlarm: '',
    totalHours: '',
    comments: ''
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
  const [submitModal, setSubmitModal] = useState(false);
  const [clearFormModal, setClearFormModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPumps();
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user?.role]);

  useEffect(() => {
    if (showForm && !formData.startDate) {
      setFormData((prev) => ({
        ...prev,
        startDate: new Date().toISOString().split('T')[0]
      }));
    }
  }, [showForm, formData.startDate]);

  const fetchPumps = async () => {
    try {
      setLoading(true);
      const response = await boosterPumpService.getAll();
      setPumps(response.data);
    } catch (error) {
      console.error('Error fetching pumps:', error);
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
    setSubmitModal(true);
  };

  const handleBoosterPumpStatusChange = (value) => {
    if (value === 'faulty' || value === 'offline') {
      setFormData({
        ...formData,
        status: value,
        failureAlarm: '-',
        totalHours: '0Hrs 0Mins',
      });
    } else {
      setFormData({ ...formData, status: value });
    }
  };

  const confirmSubmit = async () => {
    try {
      setLoading(true);
      const entry = {
        ...formData,
        totalHours: calculateTotalHours()
      }
      await boosterPumpService.create(entry);
      setFormData({
        startDate: new Date().toISOString().split('T')[0],
        pumpNo: '',
        startTime: '',
        status: '',
        stopTime: new Date().toLocaleDateString('en-us', {year: '2-digit'}) ,
        stopDate: '',
        failureAlarm: '',
        totalHours: calculateTotalHours(),
        comments: ''
      });
      setShowForm(false);
      setSubmitModal(false);
      fetchPumps();
    } catch (error) {
      console.error('Error creating pump:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFormComplete = () => {
    return (
      formData.startDate &&
      formData.pumpNo &&
      formData.startTime &&
      formData.status &&
      formData.stopDate &&
      formData.stopTime &&
      formData.failureAlarm &&
      formData.comments
    );
  };

  const handleDelete = (id, itemName) => {
    setDeleteModal({ isOpen: true, id, name: itemName });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      setIsDeleting(true);
      await boosterPumpService.delete(deleteModal.id);
      setDeleteModal({ isOpen: false, id: null, name: '' });
      fetchPumps();
    } catch (error) {
      console.error('Error deleting pump:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      const response = await boosterPumpService.generateReport();
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
        'startdate', 'pumpno/(hp)', 'starttime', 'status',
        'stopdate', 'stoptime', 'failurealarm', 'totalhours' , 'comments'
      ].some((h) => normalizedHeaders.includes(h));
      if (!hasAnyRequiredHeader) {
        setImportError('The Excel file columns do not match Booster Pump format.');
        return;
      }

      const mapped = rows
        .map((row) => {
          const normalizeDateValue = (value) => {
            if (value === null || value === undefined || value === '') return '';

            // Handle Excel serial date values
            if (typeof value === 'number' && Number.isFinite(value)) {
              const dateObj = XLSX.SSF.parse_date_code(value);
              if (dateObj?.y && dateObj?.m && dateObj?.d) {
                const yyyy = String(dateObj.y).padStart(4, '0');
                const mm = String(dateObj.m).padStart(2, '0');
                const dd = String(dateObj.d).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
              }
            }

            const str = String(value).trim();
            if (!str) return '';
            if (str.toLowerCase() === 'n/a') return '';

            if (/^\d+$/.test(str)) {
              const excelSerial = Number(str);
              const dateObj = XLSX.SSF.parse_date_code(excelSerial);
              if (dateObj?.y && dateObj?.m && dateObj?.d) {
                const yyyy = String(dateObj.y).padStart(4, '0');
                const mm = String(dateObj.m).padStart(2, '0');
                const dd = String(dateObj.d).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
              }
            }

            // Already ISO-like
            if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

            // Common slash/dash formats
            const parts = str.split(/[/-]/).map((p) => p.trim());
            if (parts.length === 3) {
              let day;
              let month;
              let year;

              // dd/mm/yyyy
              if (parts[0].length <= 2 && parts[1].length <= 2 && parts[2].length === 4) {
                day = Number(parts[0]);
                month = Number(parts[1]);
                year = Number(parts[2]);
              }
              // yyyy/mm/dd
              if (parts[0].length === 4 && parts[1].length <= 2 && parts[2].length <= 2) {
                year = Number(parts[0]);
                month = Number(parts[1]);
                day = Number(parts[2]);
              }

              if (
                Number.isInteger(day) &&
                Number.isInteger(month) &&
                Number.isInteger(year) &&
                month >= 1 && month <= 12 &&
                day >= 1 && day <= 31
              ) {
                return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              }
            }

            // Last-resort parse
            const parsed = new Date(str);
            if (!Number.isNaN(parsed.getTime())) {
              return parsed.toISOString().split('T')[0];
            }

            return str;
          };

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
          const entry = {
            startDate: normalizeDateValue(pick('startDate', 'start date')),
            pumpNo: pick('pumpno', 'pump no', 'pump no hp', 'pump nohp', 'pump', 'pumpno./ (hp)',
             'pump no. / (hp)', 'pumpno/(hp)'),
            startTime: pick('startTime', 'start time'),
            status: pick('status') || 'operational',
            stopDate: normalizeDateValue(pick('stopDate', 'stop date')),
            stopTime: pick('stopTime', 'stop time'),
            totalHours: pick('totalHours', 'total hours', 'Total Hours'),
            failureAlarm: pick('failureAlarm', 'failure alarm'),
            comments: pick('comments')
          };
          return {
            ...entry,
            totalHours: entry.totalHours || calculateTotalHours(entry)
          };
        })
        .filter((r) => r.startDate || r.pumpNo || r.startTime || r.comments);

      if (!mapped.length) {
        setImportError('No valid rows were found in the Excel sheet.');
        return;
      }

      setImportPreview({ rows: mapped, fileName: file.name });
    } catch (err) {
      setImportError(err?.message || 'There was a problem reading the Excel file.');
    } finally {
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
        await boosterPumpService.import(importPreview.rows, selectedUserForImport);
      } else {
        // Regular user imports data for themselves
        for (const row of importPreview.rows) {
          await boosterPumpService.create(row);
        }
      }
      
      setImportPreview({ rows: [], fileName: '' });
      setImportError('');
      setSelectedUserForImport('');
      await fetchPumps();
    } catch (error) {
      console.error('Error importing booster pumps:', error);
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

  const getFilteredPumps = () => {
    let filtered = pumps.filter((pump) => {
      // Filter by user (admin only)
      if (filterUser && pump.userId?._id !== filterUser) {
        return false;
      }

      // Search query across multiple fields
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = JSON.stringify({
          user: pump.userId?.username || '',
          date: new Date(pump.startDate).toLocaleDateString('en-US', 
            { day: '2-digit', month: 'short', year: 'numeric' }),
          pumpNo: pump.pumpNo || '',
          horsepower: pump.horsepower || '',
          startTime: pump.startTime || '',
          stopTime: pump.stopTime || '',
          status: pump.status || '',
          failureAlarm: pump.failureAlarm || '',
          totalHours: pump.totalHours || '',
          comments: pump.comments || ''
        }).toLowerCase();
        
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });

    const getTimestamp = (item) => {
      const value = item.createdAt || item.updatedAt || item.startDate || '';
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
    const filteredPumps = getFilteredPumps();
    if (selectedIds.size === filteredPumps.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPumps.map(p => p._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      return;
    }

    try {
      setIsDeleting(true);
      await boosterPumpService.deleteMultiple(Array.from(selectedIds));
      setSelectedIds(new Set());
      await fetchPumps();
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

  const isAnyFieldFilled = () => {
    return Object.entries(formData).some(([key, value]) => {
      // Exclude auto-populated date field
      if (key === 'startDate') return false;
      return value && value !== '';
    });
  };

  const handleClearForm = () => {
    setClearFormModal(true);
  };

  const confirmClearForm = () => {
    resetForm();
    setClearFormModal(false);
  };

  const resetForm = () => {
    setFormData({
      startDate: new Date().toISOString().split('T')[0],
      pumpNo: '',
      startTime: '',
      status: '',
      stopDate: '',
      stopTime: '',
      failureAlarm: '',
      totalHours: '',
      comments: ''
    })
    setShowForm(true);
  }

  const calculateTotalHours = (data = formData) => {
    const { startDate, startTime, stopDate, stopTime } = data;
    if (startDate && startTime && stopDate && stopTime) {
      const start = new Date(`${startDate}T${startTime}`)
      const stop = new Date(`${stopDate}T${stopTime}`)
      const diffInMs = stop - start

      if (isNaN(diffInMs) || diffInMs < 0) return '0Hrs 0Mins'

      const hours = Math.floor(diffInMs / 3600000)
      const mins = Math.floor((diffInMs % 3600000) / 60000)
      return `${hours}Hrs ${mins}Mins`;
    }
    return '0Hrs 0Mins'
  }

  return (
    <>      
      <NavBar heading="Booster Pump Alternations " />
      <div className="booster-container">
        
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="add-btn"
        >
          {showForm ? 'Submitted Data' : 'Add New Data'}
        </button>
        {showForm && (
        <button 
          onClick={handleClearForm}
          className='reset-btn1'
          disabled={!isAnyFieldFilled()}>
            Clear Form
        </button>)}

        {user?.role === 'admin' && !showForm && (
          <button onClick={generateReport} className="report-btn">
            Generate Report
          </button>
        )}

        {user?.role === 'admin' && pumps.length > 0 && !showForm && (
          <button onClick={() => boosterPumpService.exportToExcel()} className="export-btn">
            Export Data
          </button>
        )}


        {report && (
          <div className="report-section">
            <h2>Report Summary</h2>
            <p>Total Booster Pumps: {report.totalCount}</p>
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
            <div className="form-row">
              <div className="form-group">
                <label htmlFor='date'>Start Date:</label>
                <input
                  type="date"
                  id='date'
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor='pump'>Pump No./(HP):</label>
                <input
                  type="text"
                  id='pump'
                  value={formData.pumpNo}
                  onChange={(e) => setFormData({...formData, pumpNo: e.target.value})}
                  required
                  autoComplete='off'
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor='start time'>Start Time:</label>
                <input
                  type="time"
                  id='start time'
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor='status'>Status:</label>
                <select
                  id='status'
                  value={formData.status}
                  onChange={(e) => handleBoosterPumpStatusChange(e.target.value)}
                >
                  <option value="" disabled>--Select an option--</option>
                  <option value="operational">Operational</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="offline">Offline</option>
                  <option value="faulty">Faulty</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor='stop date'>Stop Date:</label>
                <input
                  type="date"
                  id='stop date'
                  value={formData.stopDate}
                  onChange={(e) => setFormData({...formData, stopDate: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor='stop time'>Stop Time:</label>
                <input
                  type="time"
                  id='stop time'
                  value={formData.stopTime}
                  onChange={(e) => setFormData({...formData, stopTime: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor='alarm'>Failure Alarm:</label>
              <input
                type="text"
                id='alarm'
                value={formData.failureAlarm}
                onChange={(e) => setFormData({...formData, failureAlarm: e.target.value})}
                placeholder="Enter any failure alarms"
                required
                autoComplete='off'
              />
            </div>

            <div className="form-group">
              <label htmlFor='total'>Total Hours:</label>
              <input
                type="text"
                id='total'
                value={calculateTotalHours()}
                readOnly={true}
                placeholder="Auto-calculated from dates/times"
              />
            </div>

            <div className="form-group">
              <label htmlFor='comments'>Comments:</label>
              <textarea
                id='comments'
                value={formData.comments}
                onChange={(e) => setFormData({...formData, comments: e.target.value})}
              />
            </div>

            <button type="submit" className="submit-btn" disabled={!isFormComplete()}>Submit</button>
          </form>
        )}

        {!showForm && (
        <div className="data-section">
          <div className="data-header">
            <h2>Submitted Data</h2>
            {user?.role === 'admin' && (
            <div className="import-section"> 
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
                  placeholder="Search booster pumps data..."
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
                Showing {getFilteredPumps().length} of {pumps.length} booster pump entries
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
              <p>Review the data below before adding it to submitted booster pumps.</p>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Start Date</th>
                      <th>Pump No. / (HP)</th>
                      <th>Start Time</th>
                      <th>Status</th>
                      <th>Stop Date</th>
                      <th>Stop Time</th>
                      <th>Failure Alarm</th>
                      <th>Total Hours</th>
                      <th>Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.rows.map((row, index) => (
                      <tr key={index}>
                        <td>{formatDateForDisplay(row.startDate)}</td>
                        <td>{row.pumpNo}</td>
                        <td>{formatTo12Hour(row.startTime)}</td>
                        <td><span className={`status ${row.status}`}>{row.status}</span></td>
                        <td>{formatDateForDisplay(row.stopDate)}</td>
                        <td>{formatTo12Hour(row.stopTime)}</td>
                        <td>{row.failureAlarm || '-'}</td>
                        <td>{row.totalHours || '-'}</td>
                        <td>{row.comments || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
          ) : getFilteredPumps().length === 0 ? (
            <p>{pumps.length === 0 ? 'No pump data submitted yet' : 'No pumps match your filters'}</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    {user?.role === 'admin' && (
                      <th>
                        <input
                          type="checkbox"
                          checked={selectedIds.size === getFilteredPumps().length && getFilteredPumps().length > 0}
                          onChange={selectAll}
                          title="Select all"
                        />
                      </th>
                    )}
                    <th>#</th>
                    <th>Start Date</th>
                    <th>Pump No. / (HP)</th>
                    <th>Start Time</th>
                    <th>Status</th>
                    <th>Stop Date</th>
                    <th>Stop Time</th>
                    <th>Failure Alarm</th>
                    <th>Total Hours</th>
                    <th>Comments</th>
                    {user?.role === 'admin' && <th>Imported Date</th>}
                    {user?.role === 'admin' && <th>User</th>}
                    {user?.role === 'admin' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {getFilteredPumps().map((pump, index) => (
                    <tr key={pump._id}>
                      {user?.role === 'admin' && (
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(pump._id)}
                            onChange={() => toggleSelectId(pump._id)}
                          />
                        </td>
                      )}
                      <td>{index +1}</td>
                      <td>{formatDateForDisplay(pump.startDate)}</td>
                      <td>{pump.pumpNo}</td>
                      <td>{formatTimeForDisplay(pump.startTime)}</td>
                      <td><span className={`status ${pump.status}`}>{pump.status}</span></td>
                      <td>{formatDateForDisplay(pump.stopDate)}</td>
                      <td>{formatTimeForDisplay(pump.stopTime)}</td>
                      <td>{pump.failureAlarm || '-'}</td>
                      <td>{pump.totalHours || calculateTotalHours(pump)}</td>
                      <td>{pump.comments || '-'}</td>
                      {user?.role === 'admin' && 
                      <td>{pump.importedDate ? formatDateForDisplay(pump.importedDate) : '-'}</td>}
                      {user?.role === 'admin' && 
                      <td style={{textTransform: 'capitalize'}}>
                        {pump.userId?.username}
                      </td>}
                      {user?.role === 'admin' && (
                        <td>
                          <button 
                            onClick={() => handleDelete(pump._id, `Pump ${pump.pumpNo} - ${new Date(pump.createdAt).toLocaleDateString()}`)}
                            className="delete-btn"
                            title="Delete this pump entry"
                          >
                            Delete <Trash2 size={16} style={{verticalAlign: 'middle'}} />
                          </button>
                        </td>)
                      }
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>)}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          title="Delete Pump Entry"
          message="Are you sure you want to delete this pump entry? This action cannot be undone."
          itemName={deleteModal.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
          isLoading={isDeleting}
        />

        {/* Submit Confirmation Modal */}
        <SubmitConfirmationModal
          isOpen={submitModal}
          title="Submit Pump Entry"
          message="Are you sure you want to submit this pump entry? Once submitted, it will be added to the database."
          itemName="Booster Pump Alternation"
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
    </>
  );
};

export default BoosterPumps;
