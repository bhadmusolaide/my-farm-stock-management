import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import SortableTableHeader from '../components/UI/SortableTableHeader';
import SortControls from '../components/UI/SortControls';
import useTableSort from '../hooks/useTableSort';
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

  // Sorting hook
  const { sortedData, sortConfig, requestSort, resetSort, getSortIcon } = useTableSort(users);

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

      {/* Sort Controls */}
      <SortControls 
        sortConfig={sortConfig}
        onReset={resetSort}
      />

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <SortableTableHeader sortKey="full_name" onSort={requestSort} getSortIcon={getSortIcon}>
                User
              </SortableTableHeader>
              <SortableTableHeader sortKey="role" onSort={requestSort} getSortIcon={getSortIcon}>
                Role
              </SortableTableHeader>
              <SortableTableHeader sortKey="is_active" onSort={requestSort} getSortIcon={getSortIcon}>
                Status
              </SortableTableHeader>
              <SortableTableHeader sortKey="created_at" onSort={requestSort} getSortIcon={getSortIcon}>
                Created
              </SortableTableHeader>
              <SortableTableHeader sortable={false}>
                Actions
              </SortableTableHeader>
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data">
                  <div className="no-data-content">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p>No users found</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((userData) => (
                <tr key={userData.id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {userData.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-details">
                        <div className="user-name">{userData.full_name}</div>
                        <div className="user-email">{userData.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={getRoleBadgeClass(userData.role)}>
                      {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${userData.is_active ? 'status-active' : 'status-inactive'}`}>
                      {userData.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="date-cell">
                    {formatDate(userData.created_at)}
                  </td>
                  <td>
                    <button
                      className={`action-btn ${userData.is_active ? 'btn-deactivate' : 'btn-activate'}`}
                      onClick={() => toggleUserStatus(userData.id, userData.is_active)}
                      disabled={userData.id === user?.id} // Prevent self-deactivation
                    >
                      {userData.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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