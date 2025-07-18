import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analyticsAPI } from '../lib/api';
import Card from '../components/ui/Card';
import SimpleChart from '../components/charts/SimpleChart';
import { Key, TrendingUp, Activity, AlertCircle, Copy, Users, Clock } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const Dashboard = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getDashboard(timeRange);
      setDashboardData(response.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    success('API key copied to clipboard!');
  };

  const maskApiKey = (key) => {
    if (!key) return '';
    return key.substring(0, 8) + '••••••••••••••••' + key.substring(key.length - 4);
  };

  const stats = [
    {
      title: 'API Requests',
      value: loading ? '-' : (dashboardData?.summary?.totalRequests || 0).toLocaleString(),
      change: '+12%',
      changeType: 'increase',
      icon: Activity,
      color: 'bg-blue-500'
    },
    {
      title: 'Success Rate',
      value: loading ? '-' : `${dashboardData?.summary?.successRate || 0}%`,
      change: '+2.1%',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      title: 'Quota Used',
      value: loading ? '-' : `${dashboardData?.usage?.current || 0}/${dashboardData?.usage?.limit || 5000}`,
      change: loading ? '-' : `${dashboardData?.usage?.percentage || 0}%`,
      changeType: 'neutral',
      icon: AlertCircle,
      color: 'bg-yellow-500'
    },
    {
      title: 'Avg Response Time',
      value: loading ? '-' : `${dashboardData?.summary?.averageResponseTime || 0}ms`,
      change: '-5ms',
      changeType: 'increase',
      icon: Clock,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {user?.name}! Here's your API usage overview.
          </p>
        </div>

        <div className="flex space-x-2">
          {['24h', '7d', '30d'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className={`text-sm flex items-center ${
                  stat.changeType === 'increase'
                    ? 'text-green-600'
                    : stat.changeType === 'decrease'
                      ? 'text-red-600'
                      : 'text-gray-600'
                }`}>
                  {stat.change}
                </p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests Over Time */}
        <Card title="Requests Over Time" subtitle={`API requests in the last ${timeRange}`}>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <SimpleChart
              data={dashboardData?.charts?.hourlyData || []}
              type="line"
              xKey="time"
              yKey="requests"
              color="#3b82f6"
            />
          )}
        </Card>

        {/* Top Endpoints */}
        <Card title="Top Endpoints" subtitle="Most requested API endpoints">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {(dashboardData?.charts?.topEndpoints || []).slice(0, 5).map((endpoint, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {endpoint.endpoint}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {endpoint.successRate}% success rate
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {endpoint.requests.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* API Key Section */}
      <Card title="API Key" subtitle="Your current API key for making requests">
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <Key className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <code className="text-sm font-mono text-gray-800 dark:text-gray-200">
              {maskApiKey(user?.apiKey)}
            </code>
          </div>
          <button
            onClick={() => copyToClipboard(user?.apiKey)}
            className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            disabled={!user?.apiKey}
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </Card>

      {/* Status Distribution */}
      {dashboardData?.charts?.statusCodes && (
        <Card title="Response Status Distribution" subtitle="HTTP status code breakdown">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dashboardData.charts.statusCodes.map((status, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {status.count}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {status.status}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {status.percentage}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;