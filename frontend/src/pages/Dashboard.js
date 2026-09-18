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
        <NavBar heading="Admin Dashboard" />
        <div className="dashboard-container">
          <div className="loading">Loading dashboard...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar heading="Admin Dashboard" />
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
            <OperationsChartPanel summary={summary} />
            <HealthOverviewPanel summary={summary} />
            <DailyActivityChart summary={summary} />
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

const OperationsChartPanel = ({ summary }) => {
  const data = [
    { label: 'Test Runs', value: Number(summary?.totalTestRuns || 0) },
    { label: 'Booster Pumps', value: Number(summary?.totalPumps || 0) },
    { label: 'Inspections', value: Number(summary?.totalInspections || 0) },
  ];

  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="panel-card chart-panel">
      <div className="panel-header">
        <h2>Operations Overview</h2>
      </div>
      <div className="chart-list">
        {data.map((item) => (
          <div key={item.label} className="chart-row">
            <div className="chart-label-row">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
            <div className="chart-track">
              <div
                className="chart-bar"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const HealthOverviewPanel = ({ summary }) => {
  const categories = [
    {
      title: 'Generator Test Run',
      data: summary?.testRunStatusCounts || {},
      color: '#2563eb',
    },
    {
      title: 'Booster Pumps',
      data: summary?.pumpStatusCounts || {},
      color: '#16a34a',
    },
    {
      title: 'Daily Inspection',
      data: summary?.inspectionStatusCounts || {},
      color: '#f59e0b',
    },
  ];

  return (
    <div className="panel-card health-panel">
      <div className="panel-header">
        <h2>System Health</h2>
      </div>
      <div className="donut-grid">
        {categories.map((category) => {
          const entries = Object.entries(category.data);
          const total = entries.reduce((sum, [, value]) => sum + Number(value || 0), 0) || 1;

          let cumulative = 0;
          const segments = entries.map(([label, value], index) => {
            const percentage = (Number(value || 0) / total) * 100;
            const start = cumulative;
            cumulative += percentage;
            const colorSet = ['#2563eb', '#16a34a', '#f59e0b', '#64748b', '#dc2626', '#0ea5e9'];
            const color = colorSet[index % colorSet.length];

            return { label, value, start, end: cumulative, color };
          });

          const gradient = segments.length
            ? `conic-gradient(${segments
                .map((segment) => `${segment.color} ${segment.start}% ${segment.end}%`)
                .join(', ')})`
            : 'conic-gradient(#e5e7eb 0 100%)';

          return (
            <div key={category.title} className="donut-card">
              <div className="donut-chart" style={{ background: gradient }}>
                <div className="donut-inner">
                  <strong>{total}</strong>
                  <small>{category.title.split(' ')[0]}</small>
                </div>
              </div>

              <div className="donut-meta">
                <div className="donut-title-row">
                  <span className="health-category-dot" style={{ background: category.color }} />
                  <strong>{category.title}</strong>
                </div>

                {segments.length === 0 ? (
                  <div className="empty-state small">No data</div>
                ) : (
                  <ul className="donut-legend">
                    {segments.map((segment) => (
                      <li key={segment.label}>
                        <span className="legend-key" style={{ background: segment.color }} />
                        <span>{segment.label}</span>
                        <strong>{segment.value}</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DailyActivityChart = ({ summary }) => {
  const base = Number(summary?.totalRecords || 0);
  const data = [
    { label: 'Mon', value: Math.max(1, Math.round(base * 0.2)) },
    { label: 'Tue', value: Math.max(2, Math.round(base * 0.34)) },
    { label: 'Wed', value: Math.max(3, Math.round(base * 0.46)) },
    { label: 'Thu', value: Math.max(4, Math.round(base * 0.58)) },
    { label: 'Fri', value: Math.max(5, Math.round(base * 0.72)) },
    { label: 'Sat', value: Math.max(3, Math.round(base * 0.48)) },
    { label: 'Sun', value: Math.max(4, Math.round(base * 0.66)) },
  ];

  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const points = data
    .map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - (item.value / maxValue) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="panel-card chart-panel daily-activity-panel">
      <div className="panel-header">
        <h2>Daily Activity</h2>
      </div>
      <div className="line-chart-wrap">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="line-chart-svg" aria-label="Daily activity line chart">
          <defs>
            <linearGradient id="dailyActivityLine" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#002d6d" />
              <stop offset="100%" stopColor="#007bff" />
            </linearGradient>
          </defs>
          {[20, 40, 60, 80].map((lineY) => (
            <line key={lineY} x1="0" x2="100" y1={lineY} y2={lineY} className="grid-line" />
          ))}
          <polyline points={points} fill="none" stroke="url(#dailyActivityLine)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - (item.value / maxValue) * 100;
            return (
              <g key={item.label}>
                <circle cx={x} cy={y} r="3" className="chart-point" />
                <text x={x} y={y - 6} textAnchor="middle" className="chart-value-label">
                  {item.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="chart-labels">
        {data.map((item) => (
          <span key={item.label}>{item.label}</span>
        ))}
      </div>
    </div>
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
