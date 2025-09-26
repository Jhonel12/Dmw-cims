import React, { useState, useEffect } from 'react';
import userService from '../../services/UserService';
import { useToast } from '../../contexts/ToastContext';
import AddUserModal from '../modals/AddUserModal';
import EditUserModal from '../modals/EditUserModal';

// Define the interfaces locally to avoid import issues
interface ExtendedUser {
  id: number;
  name: string;
  email: string;
  role: 'Administrator' | 'Manager' | 'User';
  status: 'Active' | 'Inactive' | 'Suspended';
  phone?: string;
  address?: string;
  timezone?: string;
  language?: string;
  password_changed_at?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  suspended_users: number;
  administrators: number;
  managers: number;
  regular_users: number;
  recent_users: number;
}

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: 'Administrator' | 'Manager' | 'User';
  status: 'Active' | 'Inactive' | 'Suspended';
  phone?: string;
  address?: string;
  timezone?: string;
  language?: string;
}

interface UpdateUserData {
  name: string;
  email: string;
  role: 'Administrator' | 'Manager' | 'User';
  status: 'Active' | 'Inactive' | 'Suspended';
  phone?: string;
  address?: string;
  timezone?: string;
  language?: string;
}

interface UpdateProfileData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  timezone?: string;
  language?: string;
}

interface ChangePasswordData {
  current_password: string;
  password: string;
  password_confirmation: string;
}

interface UserSettings {
  name: string;
  email: string;
  role: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    dateFormat: string;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    passwordLastChanged: string;
  };
}

// Remove the local User interface since we're using ExtendedUser from UserService

interface ProfileTabProps {
  userSettings: UserSettings;
  onSettingsChange: (field: keyof UserSettings, value: any) => void;
  onSave: () => void;
  isSaving: boolean;
}

const ProfileTab: React.FC<ProfileTabProps> = ({
  userSettings,
  onSettingsChange,
  onSave,
  isSaving
}) => {
  const { showSuccess, showError } = useToast();
  const [activeSection, setActiveSection] = useState<'profile' | 'users'>('profile');
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<ExtendedUser | null>(null);
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load users data
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers({
        page: currentPage,
        per_page: 10,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      });
      
      if (response.success) {
        setUsers(response.data.data);
        setTotalPages(response.data.last_page);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      showError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Load user statistics
  const loadUserStats = async () => {
    try {
      const response = await userService.getUserStats();
      if (response.success) {
        setUserStats(response.data);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    if (activeSection === 'users') {
      loadUsers();
      loadUserStats();
    }
  }, [activeSection, currentPage, searchTerm, roleFilter, statusFilter]);

  // Handle profile update
  const handleProfileUpdate = async (profileData: UpdateProfileData) => {
    try {
      const response = await userService.updateProfile(profileData);
      if (response.success) {
        showSuccess('Profile updated successfully');
        onSave();
      } else {
        showError('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Failed to update profile');
    }
  };

  // Handle user creation
  const handleCreateUser = async (userData: CreateUserData) => {
    try {
      setIsSubmitting(true);
      const response = await userService.createUser(userData);
      if (response.success) {
        showSuccess('User created successfully');
        setShowAddUser(false);
        loadUsers();
        loadUserStats();
      } else {
        showError('Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showError('Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle user update
  const handleUpdateUser = async (id: number, userData: UpdateUserData) => {
    try {
      setIsSubmitting(true);
      const response = await userService.updateUser(id, userData);
      if (response.success) {
        showSuccess('User updated successfully');
        setEditingUser(null);
        loadUsers();
      } else {
        showError('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showError('Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await userService.deleteUser(id);
        if (response.success) {
          showSuccess('User deleted successfully');
          loadUsers();
          loadUserStats();
        } else {
          showError('Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        showError('Failed to delete user');
      }
    }
  };

  // Handle user export
  const handleExportUsers = async () => {
    try {
      const blob = await userService.exportUsers({
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showSuccess('Users exported successfully');
    } catch (error) {
      console.error('Error exporting users:', error);
      showError('Failed to export users');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800';
      case 'Suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrator':
        return 'bg-purple-100 text-purple-800';
      case 'Manager':
        return 'bg-blue-100 text-blue-800';
      case 'User':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="card-elevated p-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveSection('profile')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeSection === 'profile'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            👤 My Profile
          </button>
          <button
            onClick={() => setActiveSection('users')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeSection === 'users'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            👥 User Management
          </button>
        </div>
      </div>

      {/* Profile Section */}
      {activeSection === 'profile' && (
        <div className="card-elevated p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                value={userSettings.name}
                onChange={(e) => onSettingsChange('name', e.target.value)}
                className="form-input"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                value={userSettings.email}
                onChange={(e) => onSettingsChange('email', e.target.value)}
                className="form-input"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="form-label">Role</label>
              <input
                type="text"
                value={userSettings.role}
                disabled
                className="form-input bg-gray-50"
              />
            </div>
            <div>
              <label className="form-label">Account Status</label>
              <div className="flex items-center space-x-2 mt-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Active</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={onSave}
              disabled={isSaving}
              className="btn btn-primary"
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      )}

      {/* User Management Section */}
      {activeSection === 'users' && (
        <div className="space-y-6">
          {/* User Management Header */}
          <div className="card-elevated p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">User Management</h3>
                <p className="text-sm text-gray-600 mt-1">Manage system users and their permissions</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddUser(true)}
                  className="btn btn-primary"
                >
                  + Add New User
                </button>
                <button 
                  onClick={handleExportUsers}
                  className="btn btn-secondary"
                >
                  Export Users
                </button>
              </div>
            </div>

                     {/* Search and Filters */}
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                       <div className="md:col-span-2">
                         <input
                           type="text"
                           placeholder="Search users by name or email..."
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                         />
                       </div>
                       <div>
                         <select
                           value={roleFilter}
                           onChange={(e) => setRoleFilter(e.target.value)}
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                         >
                           <option value="">All Roles</option>
                           <option value="Administrator">Administrator</option>
                           <option value="Manager">Manager</option>
                           <option value="User">User</option>
                         </select>
                       </div>
                       <div>
                         <select
                           value={statusFilter}
                           onChange={(e) => setStatusFilter(e.target.value)}
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                         >
                           <option value="">All Status</option>
                           <option value="Active">Active</option>
                           <option value="Inactive">Inactive</option>
                           <option value="Suspended">Suspended</option>
                         </select>
                       </div>
                     </div>

                     {/* User Statistics */}
                     <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                       <div className="text-center p-4 bg-gray-50 rounded-lg">
                         <div className="text-2xl font-bold text-gray-900">
                           {userStats?.total_users || 0}
                         </div>
                         <div className="text-sm text-gray-600">Total Users</div>
                       </div>
                       <div className="text-center p-4 bg-gray-50 rounded-lg">
                         <div className="text-2xl font-bold text-green-600">
                           {userStats?.active_users || 0}
                         </div>
                         <div className="text-sm text-gray-600">Active</div>
                       </div>
                       <div className="text-center p-4 bg-gray-50 rounded-lg">
                         <div className="text-2xl font-bold text-gray-600">
                           {userStats?.inactive_users || 0}
                         </div>
                         <div className="text-sm text-gray-600">Inactive</div>
                       </div>
                       <div className="text-center p-4 bg-gray-50 rounded-lg">
                         <div className="text-2xl font-bold text-red-600">
                           {userStats?.suspended_users || 0}
                         </div>
                         <div className="text-sm text-gray-600">Suspended</div>
                       </div>
                     </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading users...</p>
                </div>
              ) : (
                <>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Login
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                  {user.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                                {user.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setEditingUser(user)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Page <span className="font-medium">{currentPage}</span> of{' '}
                            <span className="font-medium">{totalPages}</span>
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <button
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Previous
                            </button>
                            <button
                              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Add User Modal */}
          <AddUserModal
            isOpen={showAddUser}
            onClose={() => setShowAddUser(false)}
            onSubmit={handleCreateUser}
            isSubmitting={isSubmitting}
          />

          {/* Edit User Modal */}
          <EditUserModal
            isOpen={!!editingUser}
            onClose={() => setEditingUser(null)}
            onSubmit={handleUpdateUser}
            user={editingUser}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
    </div>
  );
};

export default ProfileTab;
