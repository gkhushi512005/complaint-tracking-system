import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from 'recharts';

// API Client
const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [currentTab, setCurrentTab] = useState('tickets'); // 'tickets' | 'analytics' | 'create'
  
  // Auth Form State
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'user', department: 'General' });
  const [authError, setAuthError] = useState('');

  // Ticket State
  const [complaints, setComplaints] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // New Ticket Form State
  const [newTicket, setNewTicket] = useState({
    title: '',
    category: 'Software',
    priority: 'MEDIUM',
    description: ''
  });

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState(null);

  // Load profile on start
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data.data);
          localStorage.setItem('user', JSON.stringify(res.data.data));
        })
        .catch(() => handleLogout());
    }
  }, []);

  // Fetch tickets whenever tab or filter changes
  useEffect(() => {
    if (user && currentTab === 'tickets') {
      fetchComplaints();
    } else if (user && currentTab === 'analytics' && (user.role === 'admin' || user.role === 'agent')) {
      fetchAnalytics();
    }
  }, [user, currentTab, filterStatus]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      let url = '/complaints?';
      if (filterStatus) url += `status=${filterStatus}&`;
      if (searchTerm) url += `search=${searchTerm}&`;
      const res = await api.get(url);
      setComplaints(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics/dashboard');
      setAnalyticsData(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const res = await api.post(endpoint, authForm);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Authentication failed');
    }
  };

  const handleDemoLogin = async (role) => {
    const demoEmail = `${role}_demo@example.com`;
    const demoPassword = 'password123';
    try {
      // Attempt login, if not exists, auto-register
      let res;
      try {
        res = await api.post('/auth/login', { email: demoEmail, password: demoPassword });
      } catch {
        res = await api.post('/auth/register', {
          name: `Demo ${role.toUpperCase()}`,
          email: demoEmail,
          password: demoPassword,
          role: role,
          department: role === 'admin' ? 'IT Support' : 'General'
        });
      }
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
    } catch (err) {
      setAuthError('Demo login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setSelectedTicket(null);
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      await api.post('/complaints', newTicket);
      setNewTicket({ title: '', category: 'Software', priority: 'MEDIUM', description: '' });
      setCurrentTab('tickets');
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit ticket');
    }
  };

  const openTicketModal = async (ticket) => {
    setSelectedTicket(ticket);
    try {
      const res = await api.get(`/complaints/${ticket._id}/comments`);
      setComments(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await api.post(`/complaints/${selectedTicket._id}/comments`, {
        text: newComment,
        isInternal: isInternalNote
      });
      setComments([...comments, res.data.data]);
      setNewComment('');
      setIsInternalNote(false);
    } catch (err) {
      alert('Failed to post comment');
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      const res = await api.patch(`/complaints/${selectedTicket._id}/status`, {
        status: newStatus,
        note: `Status changed to ${newStatus}`
      });
      setSelectedTicket(res.data.data);
      fetchComplaints();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  // ==========================================
  // VIEW 1: AUTHENTICATION (LOGIN / REGISTER)
  // ==========================================
  if (!user) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Complaint & Issue Tracking System</h2>
            <p>MERN Stack with JWT & Role-Based Access Control</p>
          </div>

          <div className="demo-buttons">
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}> 1-Click Instant Demo Login:</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn-demo" onClick={() => handleDemoLogin('user')}>
                Demo User
              </button>
              <button type="button" className="btn-demo btn-demo-admin" onClick={() => handleDemoLogin('admin')}>
                Demo Admin
              </button>
            </div>
          </div>

          <div className="auth-tabs">
            <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Sign In</button>
            <button className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>Register</button>
          </div>

          {authError && <div className="alert-error">{authError}</div>}

          <form onSubmit={handleAuthSubmit} className="auth-form">
            {authMode === 'register' && (
              <>
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Rahul Sharma"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                />
                <label>Role</label>
                <select
                  value={authForm.role}
                  onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}
                >
                  <option value="user">User (Submitter)</option>
                  <option value="agent">Support Agent</option>
                  <option value="admin">Administrator</option>
                </select>
              </>
            )}

            <label>Email Address</label>
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={authForm.email}
              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
            />

            <label>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
            />

            <button type="submit" className="btn-primary">
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: MAIN DASHBOARD SHELL
  // ==========================================
  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="nav-brand">
          <span className="brand-logo"></span>
          <h2>IssueTracker</h2>
        </div>

        <nav className="nav-links">
          <button className={currentTab === 'tickets' ? 'active' : ''} onClick={() => setCurrentTab('tickets')}>
            Tickets
          </button>
          <button className={currentTab === 'create' ? 'active' : ''} onClick={() => setCurrentTab('create')}>
            + New Ticket
          </button>
          {(user.role === 'admin' || user.role === 'agent') && (
            <button className={currentTab === 'analytics' ? 'active' : ''} onClick={() => setCurrentTab('analytics')}>
              Analytics
            </button>
          )}
        </nav>

        <div className="nav-user">
          <span className="role-badge role-{user.role}">{user.role.toUpperCase()}</span>
          <span className="user-name">{user.name}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* TAB 1: TICKETS LIST */}
        {currentTab === 'tickets' && (
          <div className="tickets-view">
            <div className="toolbar">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search by ID or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchComplaints()}
                />
                <button onClick={fetchComplaints} className="btn-search">Search</button>
              </div>

              <div className="filter-group">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="OPEN">OPEN</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loader">Loading tickets...</div>
            ) : complaints.length === 0 ? (
              <div className="empty-state">
                <p>No complaints found.</p>
                <button onClick={() => setCurrentTab('create')} className="btn-primary" style={{ width: 'auto' }}>
                  Create First Ticket
                </button>
              </div>
            ) : (
              <div className="ticket-grid">
                {complaints.map((ticket) => (
                  <div key={ticket._id} className="ticket-card" onClick={() => openTicketModal(ticket)}>
                    <div className="card-top">
                      <span className="ticket-id">{ticket.ticketId}</span>
                      <span className={`status-pill status-${ticket.status}`}>{ticket.status}</span>
                    </div>
                    <h3 className="ticket-title">{ticket.title}</h3>
                    <p className="ticket-desc">{ticket.description.substring(0, 100)}...</p>
                    <div className="card-bottom">
                      <span className="badge-cat">{ticket.category}</span>
                      <span className={`badge-priority priority-${ticket.priority}`}>{ticket.priority}</span>
                      <span className="ticket-date">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CREATE NEW TICKET */}
        {currentTab === 'create' && (
          <div className="create-view">
            <div className="form-card">
              <h2>Submit a New Complaint / Issue</h2>
              <form onSubmit={handleCreateTicket}>
                <label>Issue Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VPN disconnected repeatedly"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                />

                <div className="form-row">
                  <div>
                    <label>Category</label>
                    <select
                      value={newTicket.category}
                      onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    >
                      <option value="Software">Software</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Network">Network</option>
                      <option value="Billing">Billing</option>
                      <option value="Facilities">Facilities</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label>Priority</label>
                    <select
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>
                </div>

                <label>Detailed Description</label>
                <textarea
                  rows="5"
                  required
                  placeholder="Describe the issue in detail..."
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                ></textarea>

                <div className="form-actions">
                  <button type="button" onClick={() => setCurrentTab('tickets')} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Submit Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: ANALYTICS DASHBOARD */}
        {currentTab === 'analytics' && analyticsData && (
          <div className="analytics-view">
            <h2>System Metrics & Resolution Analytics</h2>
            
            {/* KPI Cards */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <span>Total Complaints</span>
                <h3>{analyticsData.kpis.total}</h3>
              </div>
              <div className="kpi-card">
                <span>Active Issues</span>
                <h3 style={{ color: '#F59E0B' }}>{analyticsData.kpis.open}</h3>
              </div>
              <div className="kpi-card">
                <span>Resolved</span>
                <h3 style={{ color: '#10B981' }}>{analyticsData.kpis.resolved}</h3>
              </div>
              <div className="kpi-card">
                <span>Avg Resolution Time</span>
                <h3>{analyticsData.kpis.avgResolutionHours} hrs</h3>
              </div>
              <div className="kpi-card">
                <span>Resolution Rate</span>
                <h3 style={{ color: '#3B82F6' }}>{analyticsData.kpis.resolutionRate}%</h3>
              </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
              <div className="chart-card">
                <h4>Volume & Resolution Trends</h4>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={analyticsData.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="Submitted" stroke="#3B82F6" fill="#93C5FD" />
                    <Area type="monotone" dataKey="Resolved" stroke="#10B981" fill="#A7F3D0" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h4>Category Breakdown</h4>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={analyticsData.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      dataKey="value"
                    >
                      {analyticsData.categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
                <h4>Support Staff Workload Distribution</h4>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={analyticsData.agentWorkload}>
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
        )}

      </main>

      {/* MODAL: TICKET DETAILS, STATUS UPDATE & THREADED COMMENTS */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="ticket-id">{selectedTicket.ticketId}</span>
                <h2>{selectedTicket.title}</h2>
              </div>
              <button className="btn-close" onClick={() => setSelectedTicket(null)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Status Actions (Admin / Agent Only) */}
              {(user.role === 'admin' || user.role === 'agent') && (
                <div className="admin-status-bar">
                  <span>Change Status:</span>
                  <button onClick={() => handleStatusUpdate('UNDER_REVIEW')} className="btn-st btn-review">Under Review</button>
                  <button onClick={() => handleStatusUpdate('IN_PROGRESS')} className="btn-st btn-progress">In Progress</button>
                  <button onClick={() => handleStatusUpdate('RESOLVED')} className="btn-st btn-resolve">Resolve</button>
                  <button onClick={() => handleStatusUpdate('CLOSED')} className="btn-st btn-close-st">Close</button>
                </div>
              )}

              <div className="ticket-full-info">
                <p><strong>Description:</strong> {selectedTicket.description}</p>
                <div className="meta-tags">
                  <span>Category: <b>{selectedTicket.category}</b></span>
                  <span>Priority: <b>{selectedTicket.priority}</b></span>
                  <span>Current Status: <b>{selectedTicket.status}</b></span>
                </div>
              </div>

              {/* Timeline Audit History */}
              <div className="timeline-section">
                <h4>Audit History</h4>
                <div className="timeline-list">
                  {selectedTicket.timeline?.map((item, idx) => (
                    <div key={idx} className="timeline-item">
                      <span className="tl-bullet">●</span>
                      <div>
                        <strong>{item.status}</strong> - {item.note}
                        <span className="tl-time"> ({new Date(item.timestamp).toLocaleTimeString()})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Threaded Discussion */}
              <div className="comments-section">
                <h4>Discussion & Activity</h4>
                <div className="comments-list">
                  {comments.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: '13px' }}>No messages yet.</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c._id} className={`comment-bubble ${c.isInternal ? 'internal-note' : ''}`}>
                        <div className="comment-meta">
                          <strong>{c.author?.name || 'User'}</strong>
                          {c.isInternal && <span className="badge-internal">INTERNAL NOTE</span>}
                          <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p>{c.text}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment} className="comment-form">
                  <input
                    type="text"
                    required
                    placeholder="Write a reply..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  {(user.role === 'admin' || user.role === 'agent') && (
                    <label className="checkbox-internal">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                      />
                      Staff Note
                    </label>
                  )}
                  <button type="submit" className="btn-send">Send</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
