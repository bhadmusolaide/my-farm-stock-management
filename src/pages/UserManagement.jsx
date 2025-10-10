import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { formatDate } from '../utils/formatters';
import { DataTable, StatusBadge } from '../components/UI';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'user'
  });
  const [formLoading, setFormLoading] = useState(false);
  const { user, logAuditAction, createUser } = useAuth();

  // Table columns configuration
  const userColumns = [
    { key: 'full_name', label: 'User' },
    { key: 'role', label: 'Role' },
    { key: 'is_active', label: 'Status' },
    { key: 'created_at', label: 'Created' },
    { key: 'actions', label: 'Actions' }
  ];

  // Custom cell renderer for users table
  const renderUserCell = (value, row, column) => {
    switch (column.key) {
      case 'full_name':
        return (
          <div className="user-info">
            <div className="user-name">{row.full_name}</div>
            <div className="user-email">{row.email}</div>
          </div>
        );
      case 'role':
        return (
          <StatusBadge
            status={row.role}
            type={row.role === 'admin' ? 'primary' : 'default'}
          >
            {row.role}
          </StatusBadge>
        );
      case 'is_active':
        return (
          <StatusBadge
            status={row.is_active ? 'active' : 'inactive'}
            type={row.is_active ? 'success' : 'danger'}
          >
            {row.is_active ? 'Active' : 'Inactive'}
          </StatusBadge>
        );
      case 'created_at':
        return formatDate(row.created_at);
      case 'actions':
        return (
          <div className="action-buttons">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleToggleStatus(row)}
            >
              {row.is_active ? 'Deactivate' : 'Activate'}
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => handleDeleteUser(row.id)}
            >
              Delete
            </button>
          </div>
        );
      default:
        return value;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.full_name) {
      setError('Please fill in all required fields');
      return;
    }

    setFormLoading(true);
    setError(null);

    const result = await createUser(formData);
    
    if (result.success) {
      setShowModal(false);
      setFormData({ email: '', full_name: '', role: 'user' });
      fetchUsers(); // Refresh the users list
    } else {
      setError(result.error);
    }
    
    setFormLoading(false);
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      
      const { error } = await supabase
        .from('users')
        .update({ is_active: newStatus })
        .eq('id', userId);

      if (error) throw error;

      // Log the action
      await logAuditAction(
        newStatus ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
        'users',
        userId,
        { is_active: currentStatus },
        { is_active: newStatus }
      );

      fetchUsers(); // Refresh the users list
    } catch (err) {
      setError('Failed to update user status');
      console.error('Error updating user status:', err);
    }
  };

  const openModal = () => {
    setShowModal(true);
    setError(null);
    setFormData({ email: '', full_name: '', role: 'user' });
  };

  const closeModal = () => {
    setShowModal(false);
    setError(null);
    setFormData({ email: '', full_name: '', role: 'user' });
  };

  // Handler functions for DataTable actions
  const handleToggleStatus = (userData) => {
    toggleUserStatus(userData.id, userData.is_active);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);

        if (error) throw error;

        await logAuditAction('DELETE_USER', 'users', userId);
        fetchUsers(); // Refresh the users list
      } catch (err) {
        setError('Failed to delete user');
        console.error('Error deleting user:', err);
      }
    }
  };



  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'role-badge role-admin';
      case 'manager':
        return 'role-badge role-manager';
      default:
        return 'role-badge role-user';
    }
  };

  if (loading) {
    return (
      <div className="user-management">
        <div className="loading-container">
          <LoadingSpinner size="large" text="Loading users..." />
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="page-header">
        <div className="header-content">
          <h1>User Management</h1>
          <p>Manage system users and their permissions</p>
        </div>
        <button className="add-user-btn" onClick={openModal}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Add User
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {typeof error === 'string' ? error : error?.message || 'An error occurred'}
        </div>
      )}

      {/* Users Table */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">
            <span className="section-title-icon">👥</span>
            System Users
          </h3>
          <div className="section-actions">
            <button className="btn btn-primary" onClick={openModal}>
              Add User
            </button>
          </div>
        </div>

        <DataTable
          data={users}
          columns={userColumns}
          renderCell={renderUserCell}
          enableSorting
          enablePagination
          pageSize={10}
          emptyMessage="No users found"
          loading={loading}
          rowKey="id"
        />
      </section>

      {/* Add User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New User</h2>
              <button className="close-btn" onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="full_name">Full Name *</label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={formLoading}>
                  {formLoading ? (
                    <>
                      <LoadingSpinner size="small" color="white" />
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;