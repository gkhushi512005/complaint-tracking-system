// frontend/src/pages/admin/AnalyticsDashboard.jsx
import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axiosClient.get('/analytics/dashboard');
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="p-8">Loading Analytics...</div>;
  if (!data) return <div className="p-8">Error loading analytics data</div>;

  const { kpis, categoryDistribution, monthlyTrends, agentWorkload } = data;

  return (
    <div className="analytics-container" style={{ padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
        Operational Performance & Analytics
      </h1>

      {/* KPI METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={kpiCardStyle}>
          <span style={kpiLabelStyle}>Total Complaints</span>
          <h2 style={kpiValStyle}>{kpis.total}</h2>
        </div>
        <div style={kpiCardStyle}>
          <span style={kpiLabelStyle}>Active Issues</span>
          <h2 style={{ ...kpiValStyle, color: '#F59E0B' }}>{kpis.open}</h2>
        </div>
        <div style={kpiCardStyle}>
          <span style={kpiLabelStyle}>Resolved Issues</span>
          <h2 style={{ ...kpiValStyle, color: '#10B981' }}>{kpis.resolved}</h2>
        </div>
        <div style={kpiCardStyle}>
          <span style={kpiLabelStyle}>Avg Resolution Time</span>
          <h2 style={kpiValStyle}>{kpis.avgResolutionHours} hrs</h2>
        </div>
        <div style={kpiCardStyle}>
          <span style={kpiLabelStyle}>Resolution Rate</span>
          <h2 style={{ ...kpiValStyle, color: '#3B82F6' }}>{kpis.resolutionRate}%</h2>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        
        {/* 1. Monthly Trends (Area Chart) */}
        <div style={chartCardStyle}>
          <h3 style={chartTitleStyle}>Complaint Volume & Resolution Trends</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="Submitted" stroke="#3B82F6" fill="#93C5FD" fillOpacity={0.4} />
              <Area type="monotone" dataKey="Resolved" stroke="#10B981" fill="#A7F3D0" fillOpacity={0.4} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 2. Category Distribution (Pie / Donut Chart) */}
        <div style={chartCardStyle}>
          <h3 style={chartTitleStyle}>Issues by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
              >
                {categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Agent Workload Distribution (Stacked Bar Chart) */}
        <div style={chartCardStyle}>
          <h3 style={chartTitleStyle}>Agent Workload Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={agentWorkload}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="agentName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="active" name="Active Tickets" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" name="Resolved Tickets" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
};

const kpiCardStyle = {
  background: '#ffffff',
  padding: '16px 20px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
};

const kpiLabelStyle = { fontSize: '13px', color: '#6b7280', fontWeight: '500' };
const kpiValStyle = { fontSize: '24px', fontWeight: 'bold', margin: '6px 0 0 0', color: '#111827' };
const chartCardStyle = {
  background: '#ffffff',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
};
const chartTitleStyle = { fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' };

export default AnalyticsDashboard;