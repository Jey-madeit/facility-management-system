import React, { useEffect, useState } from 'react';
import { Users, Shield, UserCheck, Activity } from 'lucide-react';
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
        setLoading(true);
        const response = await dashboardService.getSummary();
        setSummary(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard summary');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <>
        <NavBar heading="Operational Dashboard" />
        <div className="dashboard-container">
          <div className="loading">Loading dashboard...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar heading="Operational Dashboard" />
      <div className="dashboard-container">
        <div className="dashboard-content">
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div className="stats-grid">
            <StatCard icon={<Users size={24} />} value={summary?.totalRecords || 0} label="Total Records" tone="total" />
            <StatCard icon={<Activity size={24} />} value={summary?.totalTestRuns || 0} label="Test Runs" tone="admin" />
            <StatCard icon={<Shield size={24} />} value={summary?.totalPumps || 0} label="Booster Pumps" tone="user" />
            <StatCard icon={<UserCheck size={24} />} value={summary?.totalInspections || 0} label="Inspections" tone="total" />
          </div>

          <div className="dashboard-panels">
            <StatusPanel title="Test Run Status" data={summary?.testRunStatusCounts || {}} />
            <StatusPanel title="Pump Status" data={summary?.pumpStatusCounts || {}} />
            <StatusPanel title="Inspection Status" data={summary?.inspectionStatusCounts || {}} />
            <UserPanel users={summary?.recentUsers || []} />
          </div>
        </div>
      </div>
    </>
  );
};

const StatCard = ({ icon, value, label, tone }) => (
  <div className="stat-card">
    <div className={`stat-icon ${tone}`}>
      {icon}
    </div>
    <div className="stat-info">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  </div>
);

const StatusPanel = ({ title, data }) => (
  <div className="panel-card status-panel">
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
  </div>
);

const UserPanel = ({ users }) => (
  <div className="panel-card users-panel">
    <div className="panel-header">
      <h2>Recent Users</h2>
    </div>
    {users.length === 0 ? (
      <div className="empty-state">No recent users found.</div>
    ) : (
      <ul className="user-list">
        {users.map((user) => (
          <li key={user._id || user.username}>
            <div className="user-meta">
              <span className="user-name">{user.username}</span>
              <span className="user-role">{user.role}</span>
            </div>
            <span className="user-tag">active</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default Dashboard;
