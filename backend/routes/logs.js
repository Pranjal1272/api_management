import express from 'express';
import ApiLog from '../models/ApiLog.js';

const router = express.Router();

// @route   GET /api/logs
// @desc    Get API logs with filtering and pagination
// @access  Private
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 20,
      method,
      status,
      endpoint,
      success,
      startDate,
      endDate,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { userId };

    // Filters
    if (method) query.method = method.toUpperCase();
    if (status) query.responseStatus = parseInt(status);
    if (endpoint) query.endpoint = new RegExp(endpoint, 'i');
    if (success !== undefined) query.success = success === 'true';

    // Date range
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get logs and total count
    const [logs, total] = await Promise.all([
      ApiLog.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-requestBody -responseBody -requestHeaders -responseHeaders'), // Exclude large fields
      ApiLog.countDocuments(query)
    ]);

    // Format logs for response
    const formattedLogs = logs.map(log => ({
      id: log._id,
      method: log.method,
      endpoint: log.endpoint,
      fullUrl: log.fullUrl,
      status: log.responseStatus,
      success: log.success,
      responseTime: log.responseTime,
      timestamp: log.timestamp,
      userAgent: log.userAgent,
      ipAddress: log.ipAddress,
      errorMessage: log.errorMessage,
      metadata: {
        requestSize: log.metadata?.requestSize,
        responseSize: log.metadata?.responseSize,
        cacheHit: log.metadata?.cacheHit,
        rateLimited: log.metadata?.rateLimited
      }
    }));

    res.json({
      success: true,
      data: {
        logs: formattedLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        filters: {
          method,
          status,
          endpoint,
          success,
          startDate,
          endDate,
          sortBy,
          sortOrder
        }
      }
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get logs'
    });
  }
});

// @route   GET /api/logs/:id
// @desc    Get detailed log entry by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const log = await ApiLog.findOne({ _id: id, userId });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log entry not found'
      });
    }

    // Format detailed log response
    const detailedLog = {
      id: log._id,
      method: log.method,
      endpoint: log.endpoint,
      fullUrl: log.fullUrl,
      status: log.responseStatus,
      success: log.success,
      responseTime: log.responseTime,
      timestamp: log.timestamp,
      userAgent: log.userAgent,
      ipAddress: log.ipAddress,
      location: log.location,
      errorMessage: log.errorMessage,
      requestHeaders: log.requestHeaders ? Object.fromEntries(log.requestHeaders) : {},
      requestBody: log.requestBody,
      responseHeaders: log.responseHeaders ? Object.fromEntries(log.responseHeaders) : {},
      responseBody: log.responseBody,
      metadata: log.metadata
    };

    res.json({
      success: true,
      data: { log: detailedLog }
    });
  } catch (error) {
    console.error('Get log details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get log details'
    });
  }
});

// @route   GET /api/logs/stats/summary
// @desc    Get logs summary statistics
// @access  Private
router.get('/stats/summary', async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeRange = '24h' } = req.query;

    // Calculate time range
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
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get statistics
    const stats = await ApiLog.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          successfulRequests: { $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] } },
          failedRequests: { $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] } },
          averageResponseTime: { $avg: '$responseTime' },
          minResponseTime: { $min: '$responseTime' },
          maxResponseTime: { $max: '$responseTime' },
          totalDataTransferred: { $sum: '$metadata.responseSize' }
        }
      }
    ]);

    // Get method distribution
    const methodStats = await ApiLog.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 },
          successCount: { $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] } },
          averageResponseTime: { $avg: '$responseTime' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get status code distribution
    const statusStats = await ApiLog.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: startDate }
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

    // Get error distribution (for failed requests)
    const errorStats = await ApiLog.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: startDate },
          success: false,
          errorMessage: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$errorMessage',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const summary = stats[0] || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      totalDataTransferred: 0
    };

    const successRate = summary.totalRequests > 0
      ? ((summary.successfulRequests / summary.totalRequests) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        summary: {
          ...summary,
          successRate: parseFloat(successRate),
          averageResponseTime: Math.round(summary.averageResponseTime || 0)
        },
        distributions: {
          methods: methodStats.map(item => ({
            method: item._id,
            count: item.count,
            successCount: item.successCount,
            successRate: item.count > 0 ? ((item.successCount / item.count) * 100).toFixed(1) : 0,
            averageResponseTime: Math.round(item.averageResponseTime || 0)
          })),
          statusCodes: statusStats.map(item => ({
            status: item._id,
            count: item.count,
            percentage: summary.totalRequests > 0
              ? ((item.count / summary.totalRequests) * 100).toFixed(1)
              : 0
          })),
          errors: errorStats.map(item => ({
            error: item._id,
            count: item.count
          }))
        },
        timeRange
      }
    });
  } catch (error) {
    console.error('Get logs summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get logs summary'
    });
  }
});

// @route   DELETE /api/logs
// @desc    Clear logs older than specified date
// @access  Private
router.delete('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const { olderThan } = req.body; // Date string

    if (!olderThan) {
      return res.status(400).json({
        success: false,
        message: 'olderThan date is required'
      });
    }

    const cutoffDate = new Date(olderThan);
    if (isNaN(cutoffDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    const result = await ApiLog.deleteMany({
      userId,
      timestamp: { $lt: cutoffDate }
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} log entries`,
      data: {
        deletedCount: result.deletedCount,
        cutoffDate
      }
    });
  } catch (error) {
    console.error('Clear logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear logs'
    });
  }
});

export default router;