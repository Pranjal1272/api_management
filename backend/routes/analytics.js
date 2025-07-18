import express from 'express';
import ApiLog from '../models/ApiLog.js';
import User from '../models/User.js';

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics data
// @access  Private
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeRange = '7d' } = req.query;

    // Get basic analytics from ApiLog
    const analytics = await ApiLog.getAnalytics(userId, timeRange);

    // Get user data for current usage
    const user = req.user;

    // Calculate success rate
    const successRate = analytics.totalRequests > 0
      ? ((analytics.successfulRequests / analytics.totalRequests) * 100).toFixed(1)
      : 0;

    // Get hourly data for charts
    const hourlyData = await ApiLog.getHourlyAnalytics(userId, timeRange);

    // Format hourly data for frontend charts
    const chartData = hourlyData.map(item => ({
      time: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')} ${String(item._id.hour).padStart(2, '0')}:00`,
      requests: item.requests,
      successes: item.successes,
      failures: item.failures,
      successRate: item.requests > 0 ? ((item.successes / item.requests) * 100).toFixed(1) : 0,
      averageResponseTime: Math.round(item.averageResponseTime || 0)
    }));

    // Get top endpoints
    const topEndpoints = await ApiLog.aggregate([
      {
        $match: {
          userId: user._id,
          timestamp: {
            $gte: new Date(Date.now() - (timeRange === '24h' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000))
          }
        }
      },
      {
        $group: {
          _id: '$endpoint',
          requests: { $sum: 1 },
          successes: { $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] } },
          averageResponseTime: { $avg: '$responseTime' }
        }
      },
      {
        $sort: { requests: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get status code distribution
    const statusCodes = await ApiLog.aggregate([
      {
        $match: {
          userId: user._id,
          timestamp: {
            $gte: new Date(Date.now() - (timeRange === '24h' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000))
          }
        }
      },
      {
        $group: {
          _id: '$responseStatus',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const dashboardData = {
      summary: {
        totalRequests: analytics.totalRequests,
        successfulRequests: analytics.successfulRequests,
        failedRequests: analytics.failedRequests,
        successRate: parseFloat(successRate),
        averageResponseTime: Math.round(analytics.averageResponseTime || 0),
        totalDataTransferred: analytics.totalDataTransferred || 0
      },
      usage: {
        current: user.usage.monthlyRequests,
        limit: user.usage.monthlyLimit,
        percentage: user.usage.monthlyLimit > 0
          ? Math.round((user.usage.monthlyRequests / user.usage.monthlyLimit) * 100)
          : 0
      },
      charts: {
        hourlyData: chartData,
        topEndpoints: topEndpoints.map(item => ({
          endpoint: item._id,
          requests: item.requests,
          successes: item.successes,
          successRate: item.requests > 0 ? ((item.successes / item.requests) * 100).toFixed(1) : 0,
          averageResponseTime: Math.round(item.averageResponseTime || 0)
        })),
        statusCodes: statusCodes.map(item => ({
          status: item._id,
          count: item.count,
          percentage: analytics.totalRequests > 0
            ? ((item.count / analytics.totalRequests) * 100).toFixed(1)
            : 0
        }))
      },
      timeRange
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard analytics'
    });
  }
});

// @route   GET /api/analytics/detailed
// @desc    Get detailed analytics with filters
// @access  Private
router.get('/detailed', async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      timeRange = '7d',
      endpoint,
      status,
      method,
      page = 1,
      limit = 50
    } = req.query;

    // Build query
    const query = { userId };

    // Time range filter
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    query.timestamp = { $gte: startDate };

    // Additional filters
    if (endpoint) query.endpoint = new RegExp(endpoint, 'i');
    if (status) query.responseStatus = parseInt(status);
    if (method) query.method = method.toUpperCase();

    // Get detailed logs with pagination
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      ApiLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('method endpoint responseStatus responseTime success timestamp errorMessage'),
      ApiLog.countDocuments(query)
    ]);

    // Get aggregated stats for the filtered data
    const stats = await ApiLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          successfulRequests: { $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] } },
          averageResponseTime: { $avg: '$responseTime' },
          minResponseTime: { $min: '$responseTime' },
          maxResponseTime: { $max: '$responseTime' }
        }
      }
    ]);

    const detailedAnalytics = {
      logs: logs.map(log => ({
        id: log._id,
        method: log.method,
        endpoint: log.endpoint,
        status: log.responseStatus,
        responseTime: log.responseTime,
        success: log.success,
        timestamp: log.timestamp,
        error: log.errorMessage
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      stats: stats[0] || {
        totalRequests: 0,
        successfulRequests: 0,
        averageResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0
      },
      filters: {
        timeRange,
        endpoint,
        status,
        method
      }
    };

    res.json({
      success: true,
      data: detailedAnalytics
    });
  } catch (error) {
    console.error('Get detailed analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get detailed analytics'
    });
  }
});

// @route   GET /api/analytics/export
// @desc    Export analytics data as CSV
// @access  Private
router.get('/export', async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeRange = '7d', format = 'json' } = req.query;

    // Get analytics data
    const analytics = await ApiLog.getAnalytics(userId, timeRange);
    const hourlyData = await ApiLog.getHourlyAnalytics(userId, timeRange);

    if (format === 'csv') {
      // Convert to CSV format
      let csv = 'Time,Requests,Successes,Failures,Success Rate,Average Response Time\n';
      hourlyData.forEach(item => {
        const time = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')} ${String(item._id.hour).padStart(2, '0')}:00`;
        const successRate = item.requests > 0 ? ((item.successes / item.requests) * 100).toFixed(1) : 0;
        csv += `${time},${item.requests},${item.successes},${item.failures},${successRate},${Math.round(item.averageResponseTime || 0)}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${timeRange}-${Date.now()}.csv`);
      res.send(csv);
    } else {
      // Return JSON format
      res.json({
        success: true,
        data: {
          summary: analytics,
          hourlyData,
          exportedAt: new Date().toISOString(),
          timeRange
        }
      });
    }
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics'
    });
  }
});

export default router;