import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { userService } from '../services/apiService';
import { Users, Edit2, Trash2, Lock, 
  Unlock, X, Check, User, Mail, Shield, Plus } from 'lucide-react';
import '../styles/UserManagement.css';
import NavBar from '../components/NavBar';

const UserManagement = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [editForm, setEditForm] = useState({ username: '', email: '', role: 'user' });
  const [addForm, setAddForm] = useState({ username: '', password: '', email: '', role: 'user' });

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAll();
      setUsers(response.data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await userService.getStats();
      setStats(response.data.stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Edit user handlers
  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username,
      email: user.email || '',
      role: user.role
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    setEditForm({ username: '', email: '', role: 'user' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...editForm };
      if (!payload.email || payload.email.trim() === '') {
        delete payload.email;
      }
      await userService.update(selectedUser._id, payload);
      showSuccess('User updated successfully');
      closeEditModal();
      fetchUsers();
      fetchStats();
    } catch (err) {
      const msg = err.response?.data?.message;
      const errs = err.response?.data?.errors;
      if (errs && Array.isArray(errs)) {
        setError(errs.map(e => e.msg).join(', '));
      } else {
        setError(msg || 'Failed to update user');
      }
    }
  };

  // Delete user handlers
  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const handleDeleteConfirm = async () => {
    try {
      await userService.delete(selectedUser._id);
      showSuccess('User deleted successfully');
      closeDeleteModal();
      fetchUsers();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // Lock/unlock handler
  const handleToggleLock = async (user) => {
    try {
      await userService.toggleLock(user._id);
      showSuccess(user.isLocked ? 'User unlocked successfully' : 'User locked successfully');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle lock');
    }
  };

  // Add user handlers
  const openAddModal = () => {
    setAddForm({ username: '', password: '', email: '', role: 'user' });
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddForm({ username: '', password: '', email: '', role: 'user' });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...addForm };
      if (!payload.email || payload.email.trim() === '') {
        delete payload.email;
      }
      await userService.create(payload);
      showSuccess('User created successfully');
      closeAddModal();
      fetchUsers();
      fetchStats();
    } catch (err) {
      const msg = err.response?.data?.message;
      const errs = err.response?.data?.errors;
      if (errs && Array.isArray(errs)) {
        setError(errs.map(e => e.msg).join(', '));
      } else {
        setError(msg || 'Failed to create user');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="user-management-container">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  return (
    <>
      {/* Navbar */}
      <NavBar heading="User Management" />
      <div className="user-management-container">

        {/* Main Content */}
        <div className="user-management-content">
          {error && (
            <div className="alert alert-error">
              {error}
              <button onClick={() => setError('')} className="alert-close">
                <X size={16} />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success">
              <Check size={16} />
              {successMessage}
            </div>
          )}

          {/* Stats Cards */}
          {stats && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon total">
                  <Users size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stats.totalUsers}</span>
                  <span className="stat-label">Total Users</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon admin">
                  <Shield size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stats.adminCount}</span>
                  <span className="stat-label">Admins</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon user">
                  <User size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stats.regularUserCount}</span>
                  <span className="stat-label">Regular Users</span>
                </div>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="users-table-container">
            <div className="users-table-header">
              <h2>All Users</h2>
              <button onClick={openAddModal} className="add-user-btn">
                <Plus size={18} />
                Add User
              </button>
            </div>
            <table className="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className={user._id === currentUser?.id ? 'current-user' : ''}>
                    <td>
                      <div className="user-cell">
                        <User size={16} />
                        {user.username}
                        {user._id === currentUser?.id && (
                          <span className="you-badge">You</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="email-cell">
                        <Mail size={16} />
                        {user.email || '-'}
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.isLocked ? 'locked' : 'active'}`}>
                        {user.isLocked ? 'Locked' : 'Active'}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => openEditModal(user)}
                          className="action-btn edit"
                          title="Edit User"
                        >
                          <Edit2 size={16} />
                        </button>
                        {user._id !== currentUser?.id && (
                          <>
                            <button
                              onClick={() => handleToggleLock(user)}
                              className={`action-btn ${user.isLocked ? 'unlock' : 'lock'}`}
                              title={user.isLocked ? 'Unlock Account' : 'Lock Account'}
                            >
                              {user.isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                            </button>
                            <button
                              onClick={() => openDeleteModal(user)}
                              className="action-btn delete"
                              title="Delete User"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="modal-overlay" onClick={closeEditModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edit User</h3>
                <button onClick={closeEditModal} className="modal-close">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="modal-form">
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={closeEditModal} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="modal-overlay" onClick={closeDeleteModal}>
            <div className="modal modal-confirm" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Delete User</h3>
                <button onClick={closeDeleteModal} className="modal-close">
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete user <strong>{selectedUser?.username}</strong>?</p>
                <p className="warning-text">This action cannot be undone.</p>
              </div>
              <div className="modal-actions">
                <button onClick={closeDeleteModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button onClick={handleDeleteConfirm} className="btn btn-danger">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={closeAddModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add New User</h3>
                <button onClick={closeAddModal} className="modal-close">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddSubmit} className="modal-form">
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={addForm.username}
                    onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                    required
                    minLength={3}
                    maxLength={30}
                    placeholder="Enter username"
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    required
                    minLength={6}
                    maxLength={128}
                    placeholder="Enter password (min 6 characters)"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={closeAddModal} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserManagement;
