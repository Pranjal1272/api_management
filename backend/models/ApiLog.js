import mongoose from 'mongoose';

const apiLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  apiKey: {
    type: String,
    required: true
  },
  method: {
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']
  },
  endpoint: {
    type: String,
    required: true
  },
  fullUrl: {
    type: String,
    required: true
  },
  requestHeaders: {
    type: Map,
    of: String
  },
  requestBody: mongoose.Schema.Types.Mixed,
  responseStatus: {
    type: Number,
    required: true
  },
  responseHeaders: {
    type: Map,
    of: String
  },
  responseBody: mongoose.Schema.Types.Mixed,
  responseTime: {
    type: Number, // in milliseconds
    required: true
  },
  success: {
    type: Boolean,
    required: true
  },
  errorMessage: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  location: {
    country: String,
    city: String,
    region: String
  },
  metadata: {
    requestSize: Number, // in bytes
    responseSize: Number, // in bytes
    cacheHit: {
      type: Boolean,
      default: false
    },
    rateLimited: {
      type: Boolean,
      default: false
    }
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

// Indexes for efficient queries
apiLogSchema.index({ userId: 1, timestamp: -1 });
apiLogSchema.index({ apiKey: 1, timestamp: -1 });
apiLogSchema.index({ timestamp: -1 });
apiLogSchema.index({ success: 1, timestamp: -1 });
apiLogSchema.index({ responseStatus: 1, timestamp: -1 });
apiLogSchema.index({ endpoint: 1, timestamp: -1 });

// Virtual for response time category
apiLogSchema.virtual('responseTimeCategory').get(function () {
  if (this.responseTime < 100) return 'fast';
  if (this.responseTime < 500) return 'medium';
  if (this.responseTime < 1000) return 'slow';
  return 'very_slow';
});

// Virtual for status category
apiLogSchema.virtual('statusCategory').get(function () {
  if (this.responseStatus >= 200 && this.responseStatus < 300) return 'success';
  if (this.responseStatus >= 300 && this.responseStatus < 400) return 'redirect';
  if (this.responseStatus >= 400 && this.responseStatus < 500) return 'client_error';
  if (this.responseStatus >= 500) return 'server_error';
  return 'unknown';
});

// Static method to get analytics data
apiLogSchema.statics.getAnalytics = async function (userId, timeRange = '7d') {
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

  const analytics = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        successfulRequests: {
          $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] }
        },
        failedRequests: {
          $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] }
        },
        averageResponseTime: { $avg: '$responseTime' },
        minResponseTime: { $min: '$responseTime' },
        maxResponseTime: { $max: '$responseTime' },
        totalDataTransferred: { $sum: '$metadata.responseSize' }
      }
    }
  ]);

  return analytics[0] || {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    minResponseTime: 0,
    maxResponseTime: 0,
    totalDataTransferred: 0
  };
};

// Static method to get hourly analytics
apiLogSchema.statics.getHourlyAnalytics = async function (userId, timeRange = '24h') {
  const now = new Date();
  let startDate;

  switch (timeRange) {
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  return await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          hour: { $hour: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          month: { $month: '$timestamp' },
          year: { $year: '$timestamp' }
        },
        requests: { $sum: 1 },
        successes: { $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] } },
        failures: { $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] } },
        averageResponseTime: { $avg: '$responseTime' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 }
    }
  ]);
};

const ApiLog = mongoose.model('ApiLog', apiLogSchema);

export default ApiLog;