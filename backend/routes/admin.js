import express from 'express';
import User from '../models/User.js';
import ApiLog from '../models/ApiLog.js';
import Activity from '../models/Activity.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Apply admin role requirement to all routes
router.use(requireRole('admin'));

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/stats', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;

    // Calculate time range
    const now = new Date();
    let startDate;
    switch (timeRange) {
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
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
          adminUsers: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
          newUsers: {
            $sum: { $cond: [{ $gte: ['$createdAt', startDate] }, 1, 0] }
          },
          totalApiKeys: { $sum: { $size: '$apiKeys' } },
          activeApiKeys: {
            $sum: {
              $size: {
                $filter: {
                  input: '$apiKeys',
                  cond: { $eq: ['$$this.isActive', true] }
                }
              }
            }
          }
        }
      }
    ]);

    // Get API usage statistics
    const apiStats = await ApiLog.aggregate([
      {
        $match: {
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
          totalDataTransferred: { $sum: '$metadata.responseSize' },
          uniqueUsers: { $addToSet: '$userId' }
        }
      }
    ]);

    // Get top users by API usage
    const topUsers = await ApiLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$userId',
          requestCount: { $sum: 1 },
          successCount: { $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] } },
          averageResponseTime: { $avg: '$responseTime' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          userEmail: '$user.email',
          requestCount: 1,
          successCount: 1,
          successRate: {
            $cond: [
              { $gt: ['$requestCount', 0] },
              { $multiply: [{ $divide: ['$successCount', '$requestCount'] }, 100] },
              0
            ]
          },
          averageResponseTime: { $round: ['$averageResponseTime', 2] }
        }
      },
      {
        $sort: { requestCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get system activities
    const systemActivities = await Activity.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          latestTimestamp: { $max: '$timestamp' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const stats = {
      users: userStats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        adminUsers: 0,
        newUsers: 0,
        totalApiKeys: 0,
        activeApiKeys: 0
      },
      api: {
        ...(apiStats[0] || {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageResponseTime: 0,
          totalDataTransferred: 0,
          uniqueUsers: []
        }),
        uniqueUsersCount: apiStats[0]?.uniqueUsers?.length || 0,
        successRate: apiStats[0] && apiStats[0].totalRequests > 0
          ? ((apiStats[0].successfulRequests / apiStats[0].totalRequests) * 100).toFixed(1)
          : 0
      },
      topUsers,
      activities: systemActivities,
      timeRange
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin statistics'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filters
// @access  Private (Admin only)
router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    // Pagination and sorting
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-password'),
      User.countDocuments(query)
    ]);

    // Format users for response
    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      apiKeysCount: user.apiKeys.length,
      activeApiKeysCount: user.apiKeys.filter(key => key.isActive).length,
      usage: {
        totalRequests: user.usage.totalRequests,
        monthlyRequests: user.usage.monthlyRequests,
        monthlyLimit: user.usage.monthlyLimit,
        successRate: user.successRate
      },
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    res.json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        filters: { search, role, isActive, sortBy, sortOrder }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get detailed user information
// @access  Private (Admin only)
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's recent activities
    const recentActivities = await Activity.find({ userId: id })
      .sort({ timestamp: -1 })
      .limit(10)
      .select('type action description status timestamp');

    // Get user's API usage stats
    const usageStats = await ApiLog.getAnalytics(id, '30d');

    const detailedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      profile: user.profile,
      settings: user.settings,
      apiKeys: user.apiKeys.map(key => ({
        keyId: key.keyId,
        name: key.name,
        isActive: key.isActive,
        createdAt: key.createdAt,
        lastUsed: key.lastUsed,
        usage: key.usage
      })),
      usage: {
        ...user.usage,
        successRate: user.successRate
      },
      recentActivities: recentActivities.map(activity => ({
        id: activity._id,
        type: activity.type,
        action: activity.action,
        description: activity.description,
        status: activity.status,
        timestamp: activity.timestamp
      })),
      usageStats,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      data: { user: detailedUser }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user details'
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user (role, status, limits)
// @access  Private (Admin only)
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isActive, monthlyLimit } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (role && ['user', 'admin'].includes(role)) {
      user.role = role;
    }
    if (isActive !== undefined) {
      user.isActive = isActive;
      // If deactivating, also deactivate API keys
      if (!isActive) {
        user.apiKeys.forEach(key => {
          key.isActive = false;
        });
      }
    }
    if (monthlyLimit && monthlyLimit > 0) {
      user.usage.monthlyLimit = monthlyLimit;
    }

    await user.save();

    // Create activity
    await Activity.createActivity({
      userId: id,
      type: 'admin_action',
      action: 'User Updated by Admin',
      description: `User account updated by admin ${req.user.name}`,
      status: 'info',
      severity: 'medium',
      details: {
        adminId: req.user._id,
        adminName: req.user.name,
        updatedFields: Object.keys(req.body)
      }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          usage: user.usage
        }
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (soft delete)
// @access  Private (Admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete - deactivate user and API keys
    user.isActive = false;
    user.apiKeys.forEach(key => {
      key.isActive = false;
    });
    await user.save();

    // Create activity
    await Activity.createActivity({
      userId: id,
      type: 'admin_action',
      action: 'User Deleted by Admin',
      description: `User account deleted by admin ${req.user.name}`,
      status: 'warning',
      severity: 'high',
      details: {
        adminId: req.user._id,
        adminName: req.user.name,
        deletedUser: {
          name: user.name,
          email: user.email
        }
      }
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// @route   GET /api/admin/logs
// @desc    Get system-wide logs
// @access  Private (Admin only)
router.get('/logs', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      method,
      status,
      startDate,
      endDate
    } = req.query;

    // Build query (similar to user logs but without userId restriction)
    const query = {};
    if (userId) query.userId = userId;
    if (method) query.method = method.toUpperCase();
    if (status) query.responseStatus = parseInt(status);
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ApiLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'name email')
        .select('-requestBody -responseBody'),
      ApiLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        logs: logs.map(log => ({
          id: log._id,
          user: log.userId ? {
            id: log.userId._id,
            name: log.userId.name,
            email: log.userId.email
          } : null,
          method: log.method,
          endpoint: log.endpoint,
          status: log.responseStatus,
          success: log.success,
          responseTime: log.responseTime,
          timestamp: log.timestamp,
          ipAddress: log.ipAddress
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get admin logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system logs'
    });
  }
});

export default router;