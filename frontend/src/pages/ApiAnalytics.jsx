import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SimpleChart from '../components/charts/SimpleChart';
import { Calendar, TrendingUp, AlertTriangle, CheckCircle, Download, Clock, Activity } from 'lucide-react';

const ApiAnalytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [detailedData, setDetailedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const { error, success } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, detailedResponse] = await Promise.all([
        analyticsAPI.getDashboard(timeRange),
        analyticsAPI.getDetailed({ timeRange, limit: 100 })
      ]);

      setAnalyticsData(dashboardResponse.data);
      setDetailedData(detailedResponse.data);
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
      error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (format = 'json') => {
    try {
      setExportLoading(true);
      const response = await analyticsAPI.export(timeRange, format);

      if (format === 'csv') {
        // Handle CSV download
        const blob = new Blob([response], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${timeRange}-${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        // Handle JSON download
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${timeRange}-${Date.now()}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      success(`Analytics data exported as ${format.toUpperCase()}`);
    } catch (err) {
      console.error('Failed to export data:', err);
      error('Failed to export analytics data');
    } finally {
      setExportLoading(false);
    }
  };

  const timeRanges = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' }
  ];

  const summaryStats = analyticsData?.summary || {};
  const charts = analyticsData?.charts || {};

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor your API usage and performance metrics.
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor your API usage and performance metrics.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex space-x-2">
            {timeRanges.map(range => (
              <Button
                key={range.value}
                variant={timeRange === range.value ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range.value)}
              >
                {range.label}
              </Button>
            ))}
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportData('json')}
              disabled={exportLoading}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>JSON</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportData('csv')}
              disabled={exportLoading}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Requests
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summaryStats.totalRequests?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-green-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +23%
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Success Rate
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summaryStats.successRate || 0}%
              </p>
              <p className="text-sm text-green-600 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                {summaryStats.successfulRequests?.toLocaleString() || 0} successful
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Failed Requests
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summaryStats.failedRequests?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-red-600 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                {((summaryStats.failedRequests || 0) / Math.max(summaryStats.totalRequests || 1, 1) * 100).toFixed(1)}% failure rate
              </p>
            </div>
            <div className="p-3 rounded-full bg-red-500">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Response Time
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summaryStats.averageResponseTime || 0}ms
              </p>
              <p className="text-sm text-blue-600 flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Performance
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-500">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests Over Time */}
        <Card title="Requests Over Time" subtitle={`API requests in the last ${timeRange}`}>
          <SimpleChart
            data={charts.hourlyData || []}
            type="line"
            xKey="time"
            yKey="requests"
            color="#3b82f6"
          />
        </Card>

        {/* Response Time Chart */}
        <Card title="Response Time Trends" subtitle="Average response time over time">
          <SimpleChart
            data={charts.hourlyData || []}
            type="line"
            xKey="time"
            yKey="averageResponseTime"
            color="#8b5cf6"
          />
        </Card>
      </div>

      {/* Status Code Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Status Code Distribution" subtitle="HTTP response status breakdown">
          {charts.statusCodes && charts.statusCodes.length > 0 ? (
            <div className="space-y-4">
              {charts.statusCodes.map((status, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded ${
                      status.status >= 200 && status.status < 300 ? 'bg-green-500' :
                      status.status >= 300 && status.status < 400 ? 'bg-blue-500' :
                      status.status >= 400 && status.status < 500 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {status.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${status.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-16 text-right">
                      {status.count} ({status.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No status code data available
            </div>
          )}
        </Card>

        {/* Top Endpoints */}
        <Card title="Top Endpoints" subtitle="Most frequently requested endpoints">
          {charts.topEndpoints && charts.topEndpoints.length > 0 ? (
            <div className="space-y-4">
              {charts.topEndpoints.slice(0, 8).map((endpoint, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {endpoint.endpoint}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {endpoint.successRate}% success • {endpoint.averageResponseTime}ms avg
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 ml-4">
                    <div className="w-24 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            (endpoint.requests / Math.max(...(charts.topEndpoints.map(e => e.requests)))) * 100,
                            100
                          )}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                      {endpoint.requests}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No endpoint data available
            </div>
          )}
        </Card>
      </div>

      {/* Data Transfer Stats */}
      {summaryStats.totalDataTransferred && (
        <Card title="Data Transfer" subtitle="Total data transferred in the selected period">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(summaryStats.totalDataTransferred / (1024 * 1024)).toFixed(2)} MB
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Transfer</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summaryStats.totalRequests ?
                  ((summaryStats.totalDataTransferred / summaryStats.totalRequests) / 1024).toFixed(2) + ' KB' :
                  '0 KB'
                }
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg per Request</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {timeRange === '24h' ?
                  ((summaryStats.totalDataTransferred / (24 * 60 * 60)) / 1024).toFixed(2) + ' KB/s' :
                  timeRange === '7d' ?
                  ((summaryStats.totalDataTransferred / (7 * 24 * 60 * 60)) / 1024).toFixed(2) + ' KB/s' :
                  ((summaryStats.totalDataTransferred / (30 * 24 * 60 * 60)) / 1024).toFixed(2) + ' KB/s'
                }
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Transfer Rate</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ApiAnalytics;