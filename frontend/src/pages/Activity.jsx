import React, { useState, useEffect } from 'react';
import { activityAPI } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import {
  Activity as ActivityIcon,
  Clock,
  User,
  Key,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  LogIn,
  LogOut,
  Settings,
  Lock,
  Shield,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Activity = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    type: '',
    status: '',
    severity: '',
    unreadOnly: false
  });
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [activityTypes, setActivityTypes] = useState([]);
  const { error, success } = useToast();

  useEffect(() => {
    fetchActivities();
    fetchStats();
    fetchActivityTypes();
  }, [filters.page, filters.limit]);

  useEffect(() => {
    // Reset page when filters change
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchActivities();
  }, [filters.type, filters.status, filters.severity, filters.unreadOnly]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await activityAPI.getAll(filters);
      setActivities(response.data.activities);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
      error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await activityAPI.getStats('7d');
      setStats(response.data.stats);
    } catch (err) {
      console.error('Failed to fetch activity stats:', err);
    }
  };

  const fetchActivityTypes = async () => {
    try {
      const response = await activityAPI.getTypes();
      setActivityTypes(response.data.types);
    } catch (err) {
      console.error('Failed to fetch activity types:', err);
    }
  };

  const markAsRead = async (activityIds = null) => {
    try {
      await activityAPI.markAsRead(activityIds);
      success(activityIds ? 'Activities marked as read' : 'All activities marked as read');
      fetchActivities();
      fetchStats();
    } catch (err) {
      console.error('Failed to mark as read:', err);
      error('Failed to mark activities as read');
    }
  };

  const deleteActivity = async (activityId) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) {
      return;
    }

    try {
      await activityAPI.delete(activityId);
      success('Activity deleted');
      fetchActivities();
      fetchStats();
    } catch (err) {
      console.error('Failed to delete activity:', err);
      error('Failed to delete activity');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      type: '',
      status: '',
      severity: '',
      unreadOnly: false
    });
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const getActivityIcon = (type) => {
    const iconMap = {
      login: LogIn,
      logout: LogOut,
      api_key_generated: Key,
      api_key_revoked: Key,
      profile_updated: User,
      password_changed: Lock,
      settings_updated: Settings,
      api_request: ActivityIcon,
      quota_exceeded: AlertCircle,
      rate_limit_hit: Clock,
      error_occurred: XCircle,
      admin_action: Shield
    };

    const IconComponent = iconMap[type] || ActivityIcon;
    return <IconComponent className="w-4 h-4" />;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <ActivityIcon className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-700 dark:text-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getActivityTypeColor = (type) => {
    const colorMap = {
      login: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      logout: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      api_key_generated: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      api_key_revoked: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      profile_updated: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      password_changed: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      settings_updated: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      api_request: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      quota_exceeded: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      rate_limit_hit: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      error_occurred: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      admin_action: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
    };

    return colorMap[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type) => {
    const typeObj = activityTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Feed</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your account activity and system events.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </Button>

          {stats.unreadCount > 0 && (
            <Button
              size="sm"
              onClick={() => markAsRead()}
              className="flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Mark All Read</span>
            </Button>
          )}
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Activities
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalActivities || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <ActivityIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Unread
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.unreadCount || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-yellow-500">
              <EyeOff className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Errors
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.errorCount || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-red-500">
              <XCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Critical
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.criticalCount || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-orange-500">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card title="Filters" subtitle="Filter activities by type, status, and severity">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Types</option>
                {activityTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Statuses</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="info">Info</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Severity
              </label>
              <select
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.unreadOnly}
                  onChange={(e) => handleFilterChange('unreadOnly', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Unread only
                </span>
              </label>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button onClick={fetchActivities}>Apply Filters</Button>
            <Button variant="outline" onClick={clearFilters}>Clear All</Button>
          </div>
        </Card>
      )}

      {/* Activity List */}
      <Card title="Recent Activities" subtitle={`Showing ${activities.length} of ${pagination.total || 0} activities`}>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <ActivityIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No activities found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Activities will appear here as you use the platform
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className={`p-4 rounded-lg border ${
                    activity.isRead
                      ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${getActivityTypeColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.action}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityColor(activity.severity)}`}>
                            {activity.severity}
                          </span>
                          {getStatusIcon(activity.status)}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {activity.description}
                        </p>

                        {activity.details && Object.keys(activity.details).length > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {Object.entries(activity.details).map(([key, value]) => (
                              <span key={key} className="mr-3">
                                {key}: {typeof value === 'object' ? JSON.stringify(value) : value}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(activity.timestamp)}</span>
                          </span>

                          {activity.metadata?.ipAddress && (
                            <span>IP: {activity.metadata.ipAddress}</span>
                          )}

                          {activity.metadata?.endpoint && (
                            <span>Endpoint: {activity.metadata.endpoint}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {!activity.isRead && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsRead([activity.id])}
                        >
                          Mark Read
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteActivity(activity.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default Activity;