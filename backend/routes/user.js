import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Activity from '../models/Activity.js';

const router = express.Router();

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const user = req.user;

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile: user.profile,
      settings: user.settings,
      usage: {
        totalRequests: user.usage.totalRequests,
        totalSuccessfulRequests: user.usage.totalSuccessfulRequests,
        totalFailedRequests: user.usage.totalFailedRequests,
        monthlyRequests: user.usage.monthlyRequests,
        monthlyLimit: user.usage.monthlyLimit,
        successRate: user.successRate,
        lastResetDate: user.usage.lastResetDate
      },
      apiKeysCount: user.apiKeys.length,
      activeApiKeysCount: user.apiKeys.filter(key => key.isActive).length,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      data: { user: userData }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('profile.company')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),
  body('profile.website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL'),
  body('profile.bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, profile } = req.body;
    const user = await User.findById(req.user._id);

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
      user.email = email;
    }

    // Update fields
    if (name) user.name = name;
    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }

    await user.save();

    // Create activity
    await Activity.createActivity({
      userId: user._id,
      type: 'profile_updated',
      action: 'Profile Updated',
      description: 'User updated their profile information',
      status: 'success',
      details: {
        updatedFields: Object.keys(req.body),
        profileFields: profile ? Object.keys(profile) : []
      }
    });

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile: user.profile,
      settings: user.settings,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: userData }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// @route   PUT /api/user/settings
// @desc    Update user settings
// @access  Private
router.put('/settings', [
  body('notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notification setting must be boolean'),
  body('notifications.usage')
    .optional()
    .isBoolean()
    .withMessage('Usage notification setting must be boolean'),
  body('notifications.security')
    .optional()
    .isBoolean()
    .withMessage('Security notification setting must be boolean'),
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Theme must be light, dark, or auto')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { notifications, theme } = req.body;
    const user = await User.findById(req.user._id);

    // Update settings
    if (notifications) {
      user.settings.notifications = { ...user.settings.notifications, ...notifications };
    }

    if (theme) {
      user.settings.theme = theme;
    }

    await user.save();

    // Create activity
    await Activity.createActivity({
      userId: user._id,
      type: 'settings_updated',
      action: 'Settings Updated',
      description: 'User updated their account settings',
      status: 'success',
      details: {
        updatedSettings: Object.keys(req.body)
      }
    });

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: { settings: user.settings }
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
});

// @route   GET /api/user/usage
// @desc    Get user usage statistics
// @access  Private
router.get('/usage', async (req, res) => {
  try {
    const user = req.user;

    // Calculate usage percentages
    const usagePercentage = user.usage.monthlyLimit > 0
      ? Math.round((user.usage.monthlyRequests / user.usage.monthlyLimit) * 100)
      : 0;

    const usageData = {
      current: {
        requests: user.usage.monthlyRequests,
        limit: user.usage.monthlyLimit,
        percentage: usagePercentage,
        remaining: Math.max(0, user.usage.monthlyLimit - user.usage.monthlyRequests)
      },
      total: {
        requests: user.usage.totalRequests,
        successfulRequests: user.usage.totalSuccessfulRequests,
        failedRequests: user.usage.totalFailedRequests,
        successRate: user.successRate
      },
      resetDate: user.usage.lastResetDate,
      apiKeys: user.apiKeys.map(key => ({
        keyId: key.keyId,
        name: key.name,
        usage: key.usage,
        lastUsed: key.lastUsed,
        isActive: key.isActive
      }))
    };

    res.json({
      success: true,
      data: { usage: usageData }
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get usage statistics'
    });
  }
});

// @route   DELETE /api/user/account
// @desc    Deactivate user account
// @access  Private
router.delete('/account', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Deactivate account instead of deleting
    user.isActive = false;

    // Deactivate all API keys
    user.apiKeys.forEach(key => {
      key.isActive = false;
    });

    await user.save();

    // Create activity
    await Activity.createActivity({
      userId: user._id,
      type: 'admin_action',
      action: 'Account Deactivated',
      description: 'User deactivated their account',
      status: 'warning',
      severity: 'high'
    });

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate account'
    });
  }
});

export default router;