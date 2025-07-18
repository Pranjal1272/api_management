import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Activity from '../models/Activity.js';

const router = express.Router();

// @route   GET /api/api-keys
// @desc    Get all user API keys
// @access  Private
router.get('/', async (req, res) => {
  try {
    const user = req.user;

    const apiKeys = user.apiKeys.map(key => ({
      keyId: key.keyId,
      key: key.key,
      name: key.name,
      isActive: key.isActive,
      createdAt: key.createdAt,
      lastUsed: key.lastUsed,
      usage: {
        requests: key.usage.requests,
        successfulRequests: key.usage.successfulRequests,
        failedRequests: key.usage.failedRequests,
        successRate: key.usage.requests > 0
          ? ((key.usage.successfulRequests / key.usage.requests) * 100).toFixed(1)
          : 0
      }
    }));

    res.json({
      success: true,
      data: {
        apiKeys,
        count: apiKeys.length,
        activeCount: apiKeys.filter(key => key.isActive).length
      }
    });
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get API keys'
    });
  }
});

// @route   POST /api/api-keys
// @desc    Generate a new API key
// @access  Private
router.post('/', [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('API key name must be between 1 and 100 characters')
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

    const { name = 'API Key' } = req.body;
    const user = await User.findById(req.user._id);

    // Check if user has reached API key limit (e.g., 10 keys max)
    const activeKeys = user.apiKeys.filter(key => key.isActive);
    if (activeKeys.length >= 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum number of API keys reached (10)'
      });
    }

    // Generate new API key
    const apiKeyData = user.generateApiKey(name);
    await user.save();

    // Create activity
    await Activity.createActivity({
      userId: user._id,
      type: 'api_key_generated',
      action: 'API Key Generated',
      description: `New API key "${name}" generated`,
      status: 'success',
      details: {
        keyName: name,
        keyId: apiKeyData.keyId
      }
    });

    res.status(201).json({
      success: true,
      message: 'API key generated successfully',
      data: {
        apiKey: {
          keyId: apiKeyData.keyId,
          key: apiKeyData.key,
          name: apiKeyData.name,
          isActive: true,
          createdAt: new Date(),
          usage: {
            requests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            successRate: 0
          }
        }
      }
    });
  } catch (error) {
    console.error('Generate API key error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate API key'
    });
  }
});

// @route   DELETE /api/api-keys/:keyId
// @desc    Revoke/Delete an API key
// @access  Private
router.delete('/:keyId', async (req, res) => {
  try {
    const { keyId } = req.params;
    const user = await User.findById(req.user._id);

    const apiKey = user.apiKeys.find(key => key.keyId === keyId);
    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    // Check if this is the last active API key
    const activeKeys = user.apiKeys.filter(key => key.isActive && key.keyId !== keyId);
    if (activeKeys.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot revoke the last active API key'
      });
    }

    const keyName = apiKey.name;
    const success = user.revokeApiKey(keyId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    await user.save();

    // Create activity
    await Activity.createActivity({
      userId: user._id,
      type: 'api_key_revoked',
      action: 'API Key Revoked',
      description: `API key "${keyName}" was revoked`,
      status: 'warning',
      severity: 'medium',
      details: {
        keyId,
        keyName
      }
    });

    res.json({
      success: true,
      message: 'API key revoked successfully'
    });
  } catch (error) {
    console.error('Revoke API key error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke API key'
    });
  }
});

export default router;
