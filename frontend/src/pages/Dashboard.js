import React, { useEffect, useState } from 'react';
import { Activity, Building2, Shield, UserCheck, Users } from 'lucide-react';
import { dashboardService } from '../services/apiService';
import NavBar from '../components/NavBar';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await dashboardService.getSummary();
        setSummary(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load dashboard summary.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return (
    <>
      <NavBar heading="Admin Dashboard" />
      <main className="dashboard-container">
        <div className="dashboard-content">
          {loading ? (
            <div className="loading">Loading dashboard...</div>
          ) : (
            <>
              {error && <div className="alert alert-error" role="alert">{error}</div>}
              <section className="stats-grid" aria-label="Facility summary">
                <StatCard icon={<Users size={24} />} value={summary?.totalRecords || 0} label="Total Records" tone="total" />
                <StatCard icon={<Activity size={24} />} value={summary?.totalTestRuns || 0} label="Test Runs" tone="admin" />
                <StatCard icon={<Shield size={24} />} value={summary?.totalPumps || 0} label="Booster Pumps" tone="user" />
                <StatCard icon={<UserCheck size={24} />} value={summary?.totalInspections || 0} label="Inspections" tone="total" />
                <StatCard icon={<Building2 size={24} />} value={summary?.totalAvrRecordings || 0} label="AVR Systems" tone="admin" />
              </section>

              <section className="dashboard-panels" aria-label="Record status summaries">
                <StatusPanel title="Test Run Status" data={summary?.testRunStatusCounts || {}} />
                <StatusPanel title="Pump Status" data={summary?.pumpStatusCounts || {}} />
                <StatusPanel title="Inspection Status" data={summary?.inspectionStatusCounts || {}} />
                <StatusPanel title="AVR Alarm Status" data={summary?.avrStatusCounts || {}} />
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
};

const StatCard = ({ icon, value, label, tone }) => (
  <div className="stat-card">
    <div className={`stat-icon ${tone}`}>{icon}</div>
    <div className="stat-info">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  </div>
);

const StatusPanel = ({ title, data }) => (
  <section className="panel-card status-panel">
    <div className="panel-header">
      <h2>{title}</h2>
    </div>
    {Object.keys(data).length === 0 ? (
      <div className="empty-state">No status data available.</div>
    ) : (
      <ul className="status-list">
        {Object.entries(data).map(([label, value]) => (
          <li key={label}>
            <strong>{label}</strong>
            <span className="status-pill">{value}</span>
          </li>
        ))}
      </ul>
    )}
  </section>
);

export default Dashboard;
