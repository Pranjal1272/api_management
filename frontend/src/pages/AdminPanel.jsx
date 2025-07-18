import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { adminAPI } from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import {
  Users,
  Key,
  TrendingUp,
  AlertTriangle,
  Ban,
  CheckCircle,
  Search,
  Edit3,
  Trash2,
  Crown,
  Shield,
  RefreshCw,
  Eye,
  Filter,
  Download,
  Calendar,
  Clock,
  Database,
  Server,
  Activity as ActivityIcon,
  UserPlus,
  Settings,
  BarChart3
} from 'lucide-react';

const AdminPanel = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  // State management
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  // View modes
  const [viewMode, setViewMode] = useState('overview'); // overview, users, user-detail, system

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminStats();
      fetchUsers();
    }
  }, [user, timeRange, currentPage, searchTerm, statusFilter, roleFilter, sortBy, sortOrder]);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStats(timeRange);
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
      error('Failed to load admin statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await adminAPI.getUsers({
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        isActive: statusFilter !== 'all' ? statusFilter === 'active' : undefined,
        sortBy,
        sortOrder
      });
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      setActionLoading(userId);
      const response = await adminAPI.getUser(userId);
      setSelectedUser(response.data.user);
      setViewMode('user-detail');
    } catch (err) {
      console.error('Failed to fetch user details:', err);
      error('Failed to load user details');
    } finally {
      setActionLoading(null);
    }
  };

  const updateUserStatus = async (userId, isActive) => {
    try {
      setActionLoading(userId);
      await adminAPI.updateUser(userId, { isActive });
      success(`User ${isActive ? 'activated' : 'suspended'} successfully`);
      fetchUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, isActive });
      }
    } catch (err) {
      console.error('Failed to update user status:', err);
      error('Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  const updateUserRole = async (userId, role) => {
    try {
      setActionLoading(userId);
      await adminAPI.updateUser(userId, { role });
      success(`User role updated to ${role}`);
      fetchUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, role });
      }
    } catch (err) {
      console.error('Failed to update user role:', err);
      error('Failed to update user role');
    } finally {
      setActionLoading(null);
    }
  };

  const updateUserLimit = async (userId, monthlyLimit) => {
    try {
      setActionLoading(userId);
      await adminAPI.updateUser(userId, { monthlyLimit: parseInt(monthlyLimit) });
      success('Monthly limit updated successfully');
      fetchUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser({
          ...selectedUser,
          usage: { ...selectedUser.usage, monthlyLimit: parseInt(monthlyLimit) }
        });
      }
    } catch (err) {
      console.error('Failed to update user limit:', err);
      error('Failed to update user limit');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(userId);
      await adminAPI.deleteUser(userId);
      success('User deleted successfully');
      fetchUsers();
      if (selectedUser?.id === userId) {
        setViewMode('users');
        setSelectedUser(null);
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
      error('Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const exportData = async (type) => {
    try {
      setActionLoading('export');
      // Implementation for data export would go here
      success(`${type} data export initiated`);
    } catch (err) {
      error(`Failed to export ${type} data`);
    } finally {
      setActionLoading(null);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You need administrator privileges to access this panel.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Button
            onClick={() => fetchAdminStats()}
            className="flex items-center space-x-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.users?.totalUsers?.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-green-600">
                +{stats?.users?.newUsers || 0} new
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active API Keys</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.users?.activeApiKeys?.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-gray-600">
                of {stats?.users?.totalApiKeys?.toLocaleString() || '0'} total
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <Key className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">API Requests</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.api?.totalRequests?.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-green-600">
                {stats?.api?.successRate || '0'}% success rate
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-500">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(stats?.api?.averageResponseTime || 0)}ms
              </p>
              <p className="text-sm text-gray-600">
                {stats?.api?.uniqueUsersCount || 0} active users
              </p>
            </div>
            <div className="p-3 rounded-full bg-orange-500">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Top Users */}
      {stats?.topUsers?.length > 0 && (
        <Card title="Top Users by API Usage" subtitle="Most active users in the selected time period">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">User</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Requests</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Success Rate</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Avg Response</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.topUsers.map((user) => (
                  <tr key={user.userId} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{user.userName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.userEmail}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900 dark:text-white">
                      {user.requestCount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        user.successRate >= 95
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : user.successRate >= 85
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {user.successRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900 dark:text-white">
                      {user.averageResponseTime}ms
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchUserDetails(user.userId)}
                        className="flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* System Activities */}
      {stats?.activities?.length > 0 && (
        <Card title="System Activities" subtitle="Recent activity breakdown">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.activities.map((activity) => (
              <div key={activity._id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {activity._id.replace(/_/g, ' ')}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {activity.count}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Last: {new Date(activity.latestTimestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <ActivityIcon className="w-8 h-8 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => exportData('users')}
            variant="outline"
            className="flex items-center space-x-2"
            disabled={actionLoading === 'export'}
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
          <div>
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="usage.totalRequests-desc">Most Active</option>
            <option value="usage.totalRequests-asc">Least Active</option>
          </select>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        {usersLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">User</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">API Keys</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Usage</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Last Login</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {user.role}
                        </span>
                        {user.role === 'admin' && <Crown className="w-4 h-4 text-purple-600" />}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        user.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {user.activeApiKeysCount}/{user.apiKeysCount}
                        </span>
                        <p className="text-xs text-gray-500">active/total</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {user.usage.monthlyRequests?.toLocaleString()}/{user.usage.monthlyLimit?.toLocaleString()}
                        </span>
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{
                              width: `${Math.min((user.usage.monthlyRequests / user.usage.monthlyLimit) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {user.usage.successRate}% success rate
                      </p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchUserDetails(user.id)}
                          disabled={actionLoading === user.id}
                          className="flex items-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateUserStatus(user.id, !user.isActive)}
                          disabled={actionLoading === user.id}
                          className="flex items-center space-x-1"
                        >
                          {user.isActive ? (
                            <Ban className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteUser(user.id)}
                          disabled={actionLoading === user.id}
                          className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(pagination.page - 1)}
                disabled={!pagination.hasPrev}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(pagination.page + 1)}
                disabled={!pagination.hasNext}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  const renderUserDetail = () => {
    if (!selectedUser) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setViewMode('users')}
              className="flex items-center space-x-2"
            >
              <span>← Back to Users</span>
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {selectedUser.name}
            </h1>
            <span className={`px-2 py-1 text-xs font-medium rounded ${
              selectedUser.role === 'admin'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}>
              {selectedUser.role}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={selectedUser.isActive ? 'outline' : 'primary'}
              onClick={() => updateUserStatus(selectedUser.id, !selectedUser.isActive)}
              disabled={actionLoading === selectedUser.id}
              className="flex items-center space-x-2"
            >
              {selectedUser.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              <span>{selectedUser.isActive ? 'Suspend' : 'Activate'}</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => deleteUser(selectedUser.id)}
              disabled={actionLoading === selectedUser.id}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </Button>
          </div>
        </div>

        {/* User Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card title="User Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                  <p className="text-gray-900 dark:text-white">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <p className="text-gray-900 dark:text-white">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                  <select
                    value={selectedUser.role}
                    onChange={(e) => updateUserRole(selectedUser.id, e.target.value)}
                    disabled={actionLoading === selectedUser.id}
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <p className={`text-sm ${selectedUser.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedUser.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Limit</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      defaultValue={selectedUser.usage.monthlyLimit}
                      onBlur={(e) => {
                        if (e.target.value !== selectedUser.usage.monthlyLimit.toString()) {
                          updateUserLimit(selectedUser.id, e.target.value);
                        }
                      }}
                      className="w-32"
                    />
                    <span className="text-sm text-gray-600">requests/month</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Login</label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>
            </Card>

            {/* API Keys */}
            <Card title="API Keys" subtitle={`${selectedUser.apiKeys.length} total keys`}>
              <div className="space-y-3 p-4">
                {selectedUser.apiKeys.map((key) => (
                  <div key={key.keyId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900 dark:text-white">{key.name}</p>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          key.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {key.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {key.usage.requests} requests • Last used: {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(key.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {((key.usage.successfulRequests / Math.max(key.usage.requests, 1)) * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">success rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Activities */}
            {selectedUser.recentActivities?.length > 0 && (
              <Card title="Recent Activities" subtitle="Last 10 activities">
                <div className="space-y-2 p-4">
                  {selectedUser.recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{activity.description}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          activity.status === 'success'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : activity.status === 'error'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {activity.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Usage Statistics */}
          <div className="space-y-6">
            <Card title="Usage Statistics">
              <div className="space-y-4 p-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Usage</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedUser.usage.monthlyRequests?.toLocaleString()}/{selectedUser.usage.monthlyLimit?.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 dark:bg-gray-600 rounded-full">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${Math.min((selectedUser.usage.monthlyRequests / selectedUser.usage.monthlyLimit) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedUser.usage.totalRequests?.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Total Requests</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedUser.usage.successRate}%
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Success Rate</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* System Health for Admin View */}
            <Card title="System Health" subtitle="Overall system status">
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Database</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Connected</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">API Server</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Healthy</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Response Time</span>
                  <span className="text-sm text-gray-600">
                    {Math.round(stats?.api?.averageResponseTime || 0)}ms
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderNavigation = () => (
    <div className="flex space-x-4 mb-6">
      <Button
        variant={viewMode === 'overview' ? 'primary' : 'outline'}
        onClick={() => setViewMode('overview')}
        className="flex items-center space-x-2"
      >
        <BarChart3 className="w-4 h-4" />
        <span>Overview</span>
      </Button>
      <Button
        variant={viewMode === 'users' || viewMode === 'user-detail' ? 'primary' : 'outline'}
        onClick={() => setViewMode('users')}
        className="flex items-center space-x-2"
      >
        <Users className="w-4 h-4" />
        <span>Users</span>
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {renderNavigation()}

      {viewMode === 'overview' && renderOverview()}
      {viewMode === 'users' && renderUsers()}
      {viewMode === 'user-detail' && renderUserDetail()}
    </div>
  );
};

export default AdminPanel;