import React, { useCallback, useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import NavBar from '../components/NavBar';
import { auditService } from '../services/apiService';
import '../styles/Logs.css';

const targetLabels = {
  TestRun: 'Generator Test Run',
  BoosterPump: 'Booster Pump',
  DailyInspection: 'Daily Inspection',
  AvrRecording: 'AVR System'
};

const formatDateTime = (value) => {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [deletedRecords, setDeletedRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditError, setAuditError] = useState('');
  const [deletedRecordsError, setDeletedRecordsError] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [restoreMessage, setRestoreMessage] = useState('');
  const [restoringId, setRestoringId] = useState('');

  const loadLogData = useCallback(async () => {
    const [auditResult, deletedResult] = await Promise.allSettled([
      auditService.getAll({ limit: 200 }),
      auditService.getDeleted(200)
    ]);

    if (auditResult.status === 'fulfilled') {
      setLogs(auditResult.value.data.logs || []);
      setAuditError('');
    } else {
      setAuditError(getErrorMessage(auditResult.reason, 'Unable to load audit activity.'));
    }

    if (deletedResult.status === 'fulfilled') {
      setDeletedRecords(deletedResult.value.data.records || []);
      setDeletedRecordsError('');
    } else {
      setDeletedRecordsError(getErrorMessage(deletedResult.reason, 'Unable to load deleted records.'));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadLogData();
  }, [loadLogData]);

  const handleRestore = async (id) => {
    try {
      setRestoringId(id);
      setRestoreError('');
      setRestoreMessage('');
      const response = await auditService.restoreDeleted(id);
      setRestoreMessage(response.data.message);
      await loadLogData();
    } catch (error) {
      setRestoreError(getErrorMessage(error, 'Unable to restore this record.'));
    } finally {
      setRestoringId('');
    }
  };

  return (
    <>
      <NavBar heading="Audit Logs" />
      <main className="logs-container">
        <div className="logs-content">
          <section className="logs-panel">
            <div className="logs-panel-header">
              <div>
                <h2>System Activity</h2>
                <p>Latest recorded actions across facility records.</p>
              </div>
              <span className="logs-count">{logs.length} records</span>
            </div>
            {auditError && <div className="logs-alert logs-alert-error" role="alert">{auditError}</div>}
            {loading ? (
              <div className="logs-empty">Loading audit activity...</div>
            ) : !auditError && logs.length === 0 ? (
              <div className="logs-empty">No audit activity recorded yet.</div>
            ) : (
              <ul className="audit-list">
                {logs.map((log) => (
                  <li className="audit-item" key={log._id}>
                    <div className="audit-item-heading">
                      <strong>{log.actorName || 'Unknown user'}</strong>
                      <time dateTime={log.createdAt}>{formatDateTime(log.createdAt)}</time>
                    </div>
                    <p>
                      <span className={`audit-action action-${String(log.action).toLowerCase()}`}>{log.action}</span>
                      {' '}{targetLabels[log.targetType] || log.targetType}
                      {log.details?.bulk ? ' (bulk action)' : ''}
                    </p>
                    {log.targetId && <small>Record ID: {log.targetId}</small>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="logs-panel">
            <div className="logs-panel-header">
              <div>
                <h2>Recoverable Deleted Records</h2>
                <p>Records are permanently removed after three months unless restored.</p>
              </div>
              <span className="logs-count">{deletedRecords.length} records</span>
            </div>
            {deletedRecordsError && <div className="logs-alert logs-alert-error" role="alert">{deletedRecordsError}</div>}
            {restoreError && <div className="logs-alert logs-alert-error" role="alert">{restoreError}</div>}
            {restoreMessage && <div className="logs-alert logs-alert-success" role="status">{restoreMessage}</div>}
            {loading ? (
              <div className="logs-empty">Loading deleted records...</div>
            ) : !deletedRecordsError && deletedRecords.length === 0 ? (
              <div className="logs-empty">No recoverable deleted records.</div>
            ) : (
              <ul className="deleted-record-list">
                {deletedRecords.map((record) => (
                  <li className="deleted-record-item" key={record._id}>
                    <div className="deleted-record-info">
                      <strong>{record.targetLabel}</strong>
                      <span>{Object.values(record.summary || {}).filter(Boolean).join(' · ') || 'Record details unavailable'}</span>
                      <small>
                        Deleted by {record.deletedByName || 'Unknown user'} on {formatDateTime(record.deletedAt)}
                      </small>
                      <small>Recover by {formatDateTime(record.expiresAt)}</small>
                    </div>
                    <button
                      type="button"
                      className="restore-record-button"
                      onClick={() => handleRestore(record._id)}
                      disabled={Boolean(restoringId)}
                    >
                      <RotateCcw size={15} />
                      {restoringId === record._id ? 'Restoring...' : 'Restore'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </>
  );
};

export default Logs;
