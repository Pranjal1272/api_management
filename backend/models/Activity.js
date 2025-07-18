import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'api_key_generated',
      'api_key_revoked',
      'profile_updated',
      'password_changed',
      'settings_updated',
      'api_request',
      'quota_exceeded',
      'rate_limit_hit',
      'error_occurred',
      'admin_action'
    ]
  },
  action: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    location: {
      country: String,
      city: String,
      region: String
    },
    apiKey: String,
    endpoint: String,
    method: String,
    statusCode: Number,
    responseTime: Number
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  status: {
    type: String,
    enum: ['success', 'warning', 'error', 'info'],
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
activitySchema.index({ userId: 1, timestamp: -1 });
activitySchema.index({ type: 1, timestamp: -1 });
activitySchema.index({ status: 1, timestamp: -1 });
activitySchema.index({ severity: 1, timestamp: -1 });
activitySchema.index({ isRead: 1, timestamp: -1 });

// Virtual for time ago
activitySchema.virtual('timeAgo').get(function () {
  const now = new Date();
  const diff = now - this.timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
});

// Static method to create activity
activitySchema.statics.createActivity = async function (activityData) {
  try {
    const activity = new this(activityData);
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Error creating activity:', error);
    return null;
  }
};

// Static method to get user activities with pagination
activitySchema.statics.getUserActivities = async function (userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    type = null,
    status = null,
    severity = null,
    startDate = null,
    endDate = null
  } = options;

  const query = { userId: new mongoose.Types.ObjectId(userId) };

  if (type) query.type = type;
  if (status) query.status = status;
  if (severity) query.severity = severity;

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    this.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email'),
    this.countDocuments(query)
  ]);

  return {
    activities,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
};

// Static method to get activity statistics
activitySchema.statics.getActivityStats = async function (userId, timeRange = '7d') {
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
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const stats = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalActivities: { $sum: 1 },
        successCount: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        },
        errorCount: {
          $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] }
        },
        warningCount: {
          $sum: { $cond: [{ $eq: ['$status', 'warning'] }, 1, 0] }
        },
        criticalCount: {
          $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
        },
        unreadCount: {
          $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalActivities: 0,
    successCount: 0,
    errorCount: 0,
    warningCount: 0,
    criticalCount: 0,
    unreadCount: 0
  };
};

// Static method to mark activities as read
activitySchema.statics.markAsRead = async function (userId, activityIds = null) {
  const query = { userId: new mongoose.Types.ObjectId(userId) };

  if (activityIds && Array.isArray(activityIds)) {
    query._id = { $in: activityIds.map(id => new mongoose.Types.ObjectId(id)) };
  }

  return await this.updateMany(query, { isRead: true });
};

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;