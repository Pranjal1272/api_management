import express from 'express';
import Activity from '../models/Activity.js';

const router = express.Router();

// @route   GET /api/activity
// @desc    Get user activities with pagination and filters
// @access  Private
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 20,
      type,
      status,
      severity,
      startDate,
      endDate,
      unreadOnly = false
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      status,
      severity,
      startDate,
      endDate
    };

    // If unreadOnly is true, filter for unread activities
    if (unreadOnly === 'true') {
      options.isRead = false;
    }

    const result = await Activity.getUserActivities(userId, options);

    res.json({
      success: true,
      data: {
        activities: result.activities.map(activity => ({
          id: activity._id,
          type: activity.type,
          action: activity.action,
          description: activity.description,
          status: activity.status,
          severity: activity.severity,
          isRead: activity.isRead,
          timestamp: activity.timestamp,
          timeAgo: activity.timeAgo,
          details: activity.details,
          metadata: activity.metadata
        })),
        pagination: result.pagination
      }
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activities'
    });
  }
});

// @route   GET /api/activity/stats
// @desc    Get activity statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeRange = '7d' } = req.query;

    const stats = await Activity.getActivityStats(userId, timeRange);

    res.json({
      success: true,
      data: {
        stats,
        timeRange
      }
    });
  } catch (error) {
    console.error('Get activity stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activity statistics'
    });
  }
});

// @route   PUT /api/activity/mark-read
// @desc    Mark activities as read
// @access  Private
router.put('/mark-read', async (req, res) => {
  try {
    const userId = req.user._id;
    const { activityIds } = req.body; // Array of activity IDs, or null for all

    const result = await Activity.markAsRead(userId, activityIds);

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} activities as read`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark activities as read'
    });
  }
});

// @route   GET /api/activity/types
// @desc    Get available activity types
// @access  Private
router.get('/types', async (req, res) => {
  try {
    const activityTypes = [
      { value: 'login', label: 'Login', icon: 'LogIn' },
      { value: 'logout', label: 'Logout', icon: 'LogOut' },
      { value: 'api_key_generated', label: 'API Key Generated', icon: 'Key' },
      { value: 'api_key_revoked', label: 'API Key Revoked', icon: 'KeyRound' },
      { value: 'profile_updated', label: 'Profile Updated', icon: 'User' },
      { value: 'password_changed', label: 'Password Changed', icon: 'Lock' },
      { value: 'settings_updated', label: 'Settings Updated', icon: 'Settings' },
      { value: 'api_request', label: 'API Request', icon: 'Activity' },
      { value: 'quota_exceeded', label: 'Quota Exceeded', icon: 'AlertTriangle' },
      { value: 'rate_limit_hit', label: 'Rate Limit Hit', icon: 'Clock' },
      { value: 'error_occurred', label: 'Error Occurred', icon: 'AlertCircle' },
      { value: 'admin_action', label: 'Admin Action', icon: 'Shield' }
    ];

    res.json({
      success: true,
      data: { types: activityTypes }
    });
  } catch (error) {
    console.error('Get activity types error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activity types'
    });
  }
});

// @route   GET /api/activity/summary
// @desc    Get activity summary for dashboard
// @access  Private
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeRange = '24h' } = req.query;

    // Get activity stats
    const stats = await Activity.getActivityStats(userId, timeRange);

    // Get recent activities (last 5)
    const recentActivities = await Activity.find({ userId })
      .sort({ timestamp: -1 })
      .limit(5)
      .select('type action description status timestamp');

    // Get activity distribution by type
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
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const typeDistribution = await Activity.aggregate([
      {
        $match: {
          userId,
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

    const summary = {
      stats,
      recentActivities: recentActivities.map(activity => ({
        id: activity._id,
        type: activity.type,
        action: activity.action,
        description: activity.description,
        status: activity.status,
        timestamp: activity.timestamp,
        timeAgo: activity.timeAgo
      })),
      typeDistribution: typeDistribution.map(item => ({
        type: item._id,
        count: item.count,
        latestTimestamp: item.latestTimestamp,
        percentage: stats.totalActivities > 0
          ? ((item.count / stats.totalActivities) * 100).toFixed(1)
          : 0
      })),
      timeRange
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get activity summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activity summary'
    });
  }
});

// @route   DELETE /api/activity/:id
// @desc    Delete a specific activity
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const activity = await Activity.findOneAndDelete({ _id: id, userId });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete activity'
    });
  }
});

// @route   DELETE /api/activity
// @desc    Clear activities older than specified date
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

    const result = await Activity.deleteMany({
      userId,
      timestamp: { $lt: cutoffDate }
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} activities`,
      data: {
        deletedCount: result.deletedCount,
        cutoffDate
      }
    });
  } catch (error) {
    console.error('Clear activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear activities'
    });
  }
});

export default router;