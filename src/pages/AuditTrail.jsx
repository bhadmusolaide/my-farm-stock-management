import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import Pagination from '../components/UI/Pagination';
import usePagination from '../hooks/usePagination';
import SortableTableHeader from '../components/UI/SortableTableHeader';
import SortControls from '../components/UI/SortControls';
import useTableSort from '../hooks/useTableSort';
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

  // Sorting hook
  const { sortedData, sortConfig, requestSort, resetSort, getSortIcon } = useTableSort(auditLogs);

  useEffect(() => {
    fetchUsers();
    fetchAuditLogs();
  }, [currentPage, filters]);

  // Check if audit_logs table exists and test database connection
  useEffect(() => {
    const checkTableExists = async () => {
      try {
        console.log('🔍 CHECKING AUDIT_LOGS TABLE EXISTENCE');
        const { data, error } = await supabase
          .from('audit_logs')
          .select('id')
          .limit(1);

        if (error) {
          if (error.message.includes('relation "audit_logs" does not exist')) {
            console.error('❌ AUDIT_LOGS TABLE DOES NOT EXIST');
            setError('Audit logs table does not exist. Please run the database schema setup.');
          } else {
            console.error('❌ DATABASE ERROR:', error);
            setError(`Database error: ${error.message}`);
          }
        } else {
          console.log('✅ AUDIT_LOGS TABLE EXISTS, CONNECTION OK');
          console.log('📊 SAMPLE DATA:', data);
        }
      } catch (err) {
        console.error('❌ CONNECTION ERROR:', err);
        setError(`Connection error: ${err.message}`);
      }
    };

    checkTableExists();
  }, []);

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
      setError(null);

      console.log('Fetching audit logs with filters:', filters);

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

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Audit logs fetched:', data?.length || 0, 'records');
      setAuditLogs(data || []);
      setTotalPages(Math.ceil((count || 0) / logsPerPage));
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(`Failed to fetch audit logs: ${err.message}`);
      setAuditLogs([]);
      setTotalPages(1);
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

  const handlePageSizeChange = (newPageSize) => {
    setCurrentPage(1);
    // Note: logsPerPage is a constant, but we can still show the selector
    // In a real implementation, you might want to make logsPerPage dynamic
  };

  const totalItems = totalPages * logsPerPage; // Approximate total items

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
        <div className="header-actions">
          <button
            className="refresh-btn"
            onClick={() => fetchAuditLogs()}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            className="test-btn"
            onClick={async () => {
              try {
                console.log('🧪 MANUAL AUDIT LOG TEST');
                // This should trigger an audit log
                await fetchAuditLogs();
              } catch (err) {
                console.error('Test failed:', err);
              }
            }}
          >
            Test Logging
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="error-content">
            <div className="error-message">
              {typeof error === 'string' ? error : error?.message || 'An error occurred'}
            </div>
            <button
              className="retry-btn"
              onClick={() => {
                setError(null);
                fetchAuditLogs();
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-container">
        <div className="filters-row">
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

      {/* Sort Controls */}
      <SortControls 
        sortConfig={sortConfig}
        onReset={resetSort}
      />

      {/* Audit Logs Table */}
      <div className="audit-table-container">
        <table className="audit-table">
          <thead>
            <tr>
              <SortableTableHeader sortKey="created_at" onSort={requestSort} getSortIcon={getSortIcon}>
                Timestamp
              </SortableTableHeader>
              <SortableTableHeader sortKey="users.full_name" onSort={requestSort} getSortIcon={getSortIcon}>
                User
              </SortableTableHeader>
              <SortableTableHeader sortKey="action" onSort={requestSort} getSortIcon={getSortIcon}>
                Action
              </SortableTableHeader>
              <SortableTableHeader sortKey="table_name" onSort={requestSort} getSortIcon={getSortIcon}>
                Table
              </SortableTableHeader>
              <SortableTableHeader sortKey="record_id" onSort={requestSort} getSortIcon={getSortIcon}>
                Record ID
              </SortableTableHeader>
              <SortableTableHeader sortKey="ip_address" onSort={requestSort} getSortIcon={getSortIcon}>
                IP Address
              </SortableTableHeader>
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  <div className="no-data-content">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p>No audit logs found</p>
                    <p className="no-data-help">
                      {filters.action || filters.table_name || filters.user_id || filters.date_from || filters.date_to
                        ? 'Try adjusting your filters or clearing them to see all audit logs.'
                        : 'Audit logs will appear here once users start interacting with the system.'
                      }
                    </p>
                    {(!filters.action && !filters.table_name && !filters.user_id && !filters.date_from && !filters.date_to) && (
                      <button className="check-connection-btn" onClick={() => fetchAuditLogs()}>
                        Check for Recent Activity
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((log) => (
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={logsPerPage}
        onPageSizeChange={handlePageSizeChange}
        totalItems={totalItems}
        pageSizeOptions={[10, 20, 50]}
      />
    </div>
  );
};

export default AuditTrail;