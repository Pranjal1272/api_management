import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxLength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  apiKeys: [{
    keyId: {
      type: String,
      required: true,
      unique: true
    },
    key: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      default: 'Default API Key'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastUsed: {
      type: Date,
      default: null
    },
    usage: {
      requests: {
        type: Number,
        default: 0
      },
      successfulRequests: {
        type: Number,
        default: 0
      },
      failedRequests: {
        type: Number,
        default: 0
      }
    }
  }],
  usage: {
    totalRequests: {
      type: Number,
      default: 0
    },
    totalSuccessfulRequests: {
      type: Number,
      default: 0
    },
    totalFailedRequests: {
      type: Number,
      default: 0
    },
    monthlyRequests: {
      type: Number,
      default: 0
    },
    monthlyLimit: {
      type: Number,
      default: 5000
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  },
  profile: {
    avatar: String,
    company: String,
    website: String,
    bio: String
  },
  settings: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      usage: {
        type: Boolean,
        default: true
      },
      security: {
        type: Boolean,
        default: true
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ 'apiKeys.key': 1 });
userSchema.index({ createdAt: -1 });

// Virtual for success rate
userSchema.virtual('successRate').get(function () {
  if (this.usage.totalRequests === 0) return 0;
  return ((this.usage.totalSuccessfulRequests / this.usage.totalRequests) * 100).toFixed(1);
});

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Pre-save middleware to update updatedAt
userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate API key
userSchema.methods.generateApiKey = function (name = 'Default API Key') {
  const keyId = crypto.randomUUID();
  const key = `ak_${crypto.randomBytes(32).toString('hex')}`;

  this.apiKeys.push({
    keyId,
    key,
    name,
    isActive: true,
    createdAt: new Date(),
    usage: {
      requests: 0,
      successfulRequests: 0,
      failedRequests: 0
    }
  });

  return { keyId, key, name };
};

// Method to revoke API key
userSchema.methods.revokeApiKey = function (keyId) {
  const keyIndex = this.apiKeys.findIndex(k => k.keyId === keyId);
  if (keyIndex > -1) {
    this.apiKeys.splice(keyIndex, 1);
    return true;
  }
  return false;
};

// Method to update API key usage
userSchema.methods.updateApiKeyUsage = function (key, success = true) {
  const apiKey = this.apiKeys.find(k => k.key === key && k.isActive);
  if (apiKey) {
    apiKey.usage.requests += 1;
    apiKey.lastUsed = new Date();

    if (success) {
      apiKey.usage.successfulRequests += 1;
      this.usage.totalSuccessfulRequests += 1;
    } else {
      apiKey.usage.failedRequests += 1;
      this.usage.totalFailedRequests += 1;
    }

    this.usage.totalRequests += 1;
    this.usage.monthlyRequests += 1;

    return true;
  }
  return false;
};

// Method to reset monthly usage
userSchema.methods.resetMonthlyUsage = function () {
  this.usage.monthlyRequests = 0;
  this.usage.lastResetDate = new Date();
};

const User = mongoose.model('User', userSchema);

export default User;