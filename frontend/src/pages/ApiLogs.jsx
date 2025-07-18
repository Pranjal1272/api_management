import React, { useState, useEffect } from 'react';
import { logsAPI } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Search, Filter, Download, ExternalLink, Calendar } from 'lucide-react';

const ApiLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    method: '',
    status: '',
    endpoint: '',
    success: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20,
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const { error, success } = useToast();

  useEffect(() => {
    fetchLogs();
  }, [filters.page, filters.limit, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    // Reset page when filters change (except page itself)
    const { page, ...otherFilters } = filters;
    fetchLogs();
  }, [filters.method, filters.status, filters.endpoint, filters.success, filters.startDate, filters.endDate]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await logsAPI.getAll(filters);
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      error('Failed to load API logs');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      method: '',
      status: '',
      endpoint: '',
      success: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 20,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleSortChange = (sortBy) => {
    const newSortOrder = filters.sortBy === sortBy && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    setFilters(prev => ({ ...prev, sortBy, sortOrder: newSortOrder }));
  };

  const viewLogDetails = async (logId) => {
    try {
      const response = await logsAPI.getById(logId);
      setSelectedLog(response.data.log);
    } catch (err) {
      console.error('Failed to fetch log details:', err);
      error('Failed to load log details');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (status >= 300 && status < 400) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'POST': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PUT': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'DELETE': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'PATCH': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Logs</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and analyze your API request logs and responses.
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
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card title="Filters" subtitle="Filter logs by various criteria">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Method
              </label>
              <select
                value={filters.method}
                onChange={(e) => handleFilterChange('method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Methods</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status Code
              </label>
              <input
                type="text"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                placeholder="e.g., 200, 404"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Endpoint
              </label>
              <input
                type="text"
                value={filters.endpoint}
                onChange={(e) => handleFilterChange('endpoint', e.target.value)}
                placeholder="e.g., /api/users"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Success
              </label>
              <select
                value={filters.success}
                onChange={(e) => handleFilterChange('success', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All</option>
                <option value="true">Success</option>
                <option value="false">Failed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="datetime-local"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="datetime-local"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <Button onClick={applyFilters}>Apply Filters</Button>
            <Button variant="outline" onClick={clearFilters}>Clear All</Button>
          </div>
        </Card>
      )}

      {/* Logs Table */}
      <Card title="Request Logs" subtitle={`Showing ${logs.length} of ${pagination.total || 0} logs`}>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No logs found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Adjust your filters or make some API requests to see logs here
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSortChange('timestamp')}
                    >
                      Timestamp
                      {filters.sortBy === 'timestamp' && (
                        <span className="ml-1">{filters.sortOrder === 'desc' ? '↓' : '↑'}</span>
                      )}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSortChange('method')}
                    >
                      Method
                      {filters.sortBy === 'method' && (
                        <span className="ml-1">{filters.sortOrder === 'desc' ? '↓' : '↑'}</span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Endpoint
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSortChange('responseStatus')}
                    >
                      Status
                      {filters.sortBy === 'responseStatus' && (
                        <span className="ml-1">{filters.sortOrder === 'desc' ? '↓' : '↑'}</span>
                      )}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSortChange('responseTime')}
                    >
                      Response Time
                      {filters.sortBy === 'responseTime' && (
                        <span className="ml-1">{filters.sortOrder === 'desc' ? '↓' : '↑'}</span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getMethodColor(log.method)}`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white font-mono">
                          {log.endpoint}
                        </div>
                        {log.fullUrl && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {log.fullUrl}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {log.responseTime}ms
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => viewLogDetails(log.id)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Log Details
                </h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Request Info */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Request Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Method:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${getMethodColor(selectedLog.method)}`}>
                      {selectedLog.method}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${getStatusColor(selectedLog.status)}`}>
                      {selectedLog.status}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Response Time:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{selectedLog.responseTime}ms</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Timestamp:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{formatDate(selectedLog.timestamp)}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="font-medium text-gray-600 dark:text-gray-400">URL:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-mono break-all">{selectedLog.fullUrl}</span>
                </div>
              </div>

              {/* Request Headers */}
              {selectedLog.requestHeaders && Object.keys(selectedLog.requestHeaders).length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Request Headers</h4>
                  <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.requestHeaders, null, 2)}
                  </pre>
                </div>
              )}

              {/* Request Body */}
              {selectedLog.requestBody && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Request Body</h4>
                  <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.requestBody, null, 2)}
                  </pre>
                </div>
              )}

              {/* Response Headers */}
              {selectedLog.responseHeaders && Object.keys(selectedLog.responseHeaders).length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Response Headers</h4>
                  <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.responseHeaders, null, 2)}
                  </pre>
                </div>
              )}

              {/* Response Body */}
              {selectedLog.responseBody && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Response Body</h4>
                  <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-x-auto max-h-64">
                    {JSON.stringify(selectedLog.responseBody, null, 2)}
                  </pre>
                </div>
              )}

              {/* Error Message */}
              {selectedLog.errorMessage && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Error Message</h4>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                    <p className="text-red-800 dark:text-red-200">{selectedLog.errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {selectedLog.metadata && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Metadata</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedLog.metadata.requestSize && (
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">Request Size:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">{selectedLog.metadata.requestSize} bytes</span>
                      </div>
                    )}
                    {selectedLog.metadata.responseSize && (
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">Response Size:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">{selectedLog.metadata.responseSize} bytes</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiLogs;