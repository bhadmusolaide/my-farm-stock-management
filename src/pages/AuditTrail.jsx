import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import './AuditTrail.css';

const AuditTrail = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    action: '',
    table_name: '',
    user_id: '',
    date_from: '',
    date_to: ''
  });
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const logsPerPage = 20;

  useEffect(() => {
    fetchUsers();
    fetchAuditLogs();
  }, [currentPage, filters]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('audit_logs')
        .select('*, users(full_name, email)', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.table_name) {
        query = query.eq('table_name', filters.table_name);
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from + 'T00:00:00');
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to + 'T23:59:59');
      }

      // Apply pagination
      const from = (currentPage - 1) * logsPerPage;
      const to = from + logsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      
      setAuditLogs(data || []);
      setTotalPages(Math.ceil((count || 0) / logsPerPage));
    } catch (err) {
      setError('Failed to fetch audit logs');
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      table_name: '',
      user_id: '',
      date_from: '',
      date_to: ''
    });
    setCurrentPage(1);
  };



  const getActionIcon = (action) => {
    switch (action) {
      case 'LOGIN':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4m-5-4l4-4-4-4m4 4H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'LOGOUT':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14l4-4-4-4m4 4H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'CREATE':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'UPDATE':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'DELETE':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
    }
  };

  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'LOGIN':
      case 'CREATE':
        return 'action-badge action-success';
      case 'UPDATE':
        return 'action-badge action-warning';
      case 'DELETE':
      case 'LOGOUT':
        return 'action-badge action-danger';
      case 'ACTIVATE_USER':
        return 'action-badge action-success';
      case 'DEACTIVATE_USER':
        return 'action-badge action-danger';
      default:
        return 'action-badge action-info';
    }
  };

  const formatActionText = (action) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getUserName = (log) => {
    if (log.users && log.users.full_name) {
      return log.users.full_name;
    }
    return log.user_id === 'anonymous' ? 'Anonymous' : 'Unknown User';
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`page-btn ${i === currentPage ? 'active' : ''}`}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="pagination">
        <button
          className="page-btn"
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
        >
          First
        </button>
        <button
          className="page-btn"
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        {pages}
        <button
          className="page-btn"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
        <button
          className="page-btn"
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
        >
          Last
        </button>
      </div>
    );
  };

  if (loading && auditLogs.length === 0) {
    return (
      <div className="audit-trail">
        <div className="loading-container">
          <LoadingSpinner size="large" text="Loading audit logs..." />
        </div>
      </div>
    );
  }

  return (
    <div className="audit-trail">
      <div className="page-header">
        <div className="header-content">
          <h1>Audit Trail</h1>
          <p>Track all user actions and system events</p>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="filters-container">
        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="action">Action</label>
            <select
              id="action"
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
            >
              <option value="">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="ACTIVATE_USER">Activate User</option>
              <option value="DEACTIVATE_USER">Deactivate User</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="table_name">Table</label>
            <select
              id="table_name"
              name="table_name"
              value={filters.table_name}
              onChange={handleFilterChange}
            >
              <option value="">All Tables</option>
              <option value="users">Users</option>
              <option value="chickens">Chickens</option>
              <option value="stock">Stock</option>
              <option value="transactions">Transactions</option>
              <option value="balance">Balance</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="user_id">User</label>
            <select
              id="user_id"
              name="user_id"
              value={filters.user_id}
              onChange={handleFilterChange}
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.full_name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="date_from">From Date</label>
            <input
              type="date"
              id="date_from"
              name="date_from"
              value={filters.date_from}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="date_to">To Date</label>
            <input
              type="date"
              id="date_to"
              name="date_to"
              value={filters.date_to}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-actions">
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="audit-table-container">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Table</th>
              <th>Record ID</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  <div className="no-data-content">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p>No audit logs found</p>
                  </div>
                </td>
              </tr>
            ) : (
              auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="timestamp-cell">
                    {formatDate(log.created_at)}
                  </td>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {getUserName(log).charAt(0).toUpperCase()}
                      </div>
                      <div className="user-details">
                        <div className="user-name">{getUserName(log)}</div>
                        {log.users?.email && (
                          <div className="user-email">{log.users.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={getActionBadgeClass(log.action)}>
                      {getActionIcon(log.action)}
                      {formatActionText(log.action)}
                    </span>
                  </td>
                  <td className="table-cell">
                    <code>{log.table_name}</code>
                  </td>
                  <td className="record-id-cell">
                    <code>{log.record_id || 'N/A'}</code>
                  </td>
                  <td className="ip-cell">
                    {log.ip_address || 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
};

export default AuditTrail;