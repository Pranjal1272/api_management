import express from 'express';
import axios from 'axios';
import { body, validationResult } from 'express-validator';
import ApiLog from '../models/ApiLog.js';
import Activity from '../models/Activity.js';

const router = express.Router();

// @route   POST /api/testing/request
// @desc    Test an API request through the platform
// @access  Private
router.post('/request', [
  body('url')
    .isURL()
    .withMessage('Please provide a valid URL'),
  body('method')
    .isIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])
    .withMessage('Invalid HTTP method'),
  body('headers')
    .optional()
    .isObject()
    .withMessage('Headers must be an object'),
  body('body')
    .optional()
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

    const { url, method, headers = {}, body: requestBody, timeout = 30000 } = req.body;
    const user = req.user;
    const startTime = Date.now();

    // Check if user has exceeded their quota
    if (user.usage.monthlyRequests >= user.usage.monthlyLimit) {
      return res.status(429).json({
        success: false,
        message: 'Monthly API quota exceeded'
      });
    }

    let apiResponse = null;
    let success = false;
    let errorMessage = null;
    let responseStatus = 0;
    let responseHeaders = {};
    let responseBody = null;

    try {
      // Configure axios request
      const axiosConfig = {
        url,
        method: method.toLowerCase(),
        headers: {
          'User-Agent': 'API-Management-Platform/1.0',
          ...headers
        },
        timeout,
        validateStatus: () => true // Don't throw on any status code
      };

      // Add body for methods that support it
      if (['post', 'put', 'patch'].includes(method.toLowerCase()) && requestBody) {
        axiosConfig.data = requestBody;
      }

      // Make the request
      apiResponse = await axios(axiosConfig);

      responseStatus = apiResponse.status;
      responseHeaders = apiResponse.headers;
      responseBody = apiResponse.data;
      success = apiResponse.status >= 200 && apiResponse.status < 400;

    } catch (error) {
      console.error('API request error:', error);
      errorMessage = error.message;
      responseStatus = error.response?.status || 0;
      responseHeaders = error.response?.headers || {};
      responseBody = error.response?.data || null;
      success = false;
    }

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Get primary API key for logging
    const primaryApiKey = user.apiKeys.find(key => key.isActive);

    // Log the request
    const logData = {
      userId: user._id,
      apiKey: primaryApiKey?.key || 'testing',
      method: method.toUpperCase(),
      endpoint: new URL(url).pathname,
      fullUrl: url,
      requestHeaders: new Map(Object.entries(headers)),
      requestBody,
      responseStatus,
      responseHeaders: new Map(Object.entries(responseHeaders)),
      responseBody,
      responseTime,
      success,
      errorMessage,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      metadata: {
        requestSize: JSON.stringify(requestBody || {}).length,
        responseSize: JSON.stringify(responseBody || {}).length,
        cacheHit: false,
        rateLimited: false
      }
    };

    await ApiLog.create(logData);

    // Update user usage
    if (primaryApiKey) {
      user.updateApiKeyUsage(primaryApiKey.key, success);
      await user.save();
    }

    // Create activity
    await Activity.createActivity({
      userId: user._id,
      type: 'api_request',
      action: 'API Request Tested',
      description: `Tested ${method.toUpperCase()} request to ${url}`,
      status: success ? 'success' : 'error',
      metadata: {
        method: method.toUpperCase(),
        endpoint: new URL(url).pathname,
        statusCode: responseStatus,
        responseTime
      }
    });

    // Prepare response
    const result = {
      request: {
        url,
        method: method.toUpperCase(),
        headers,
        body: requestBody
      },
      response: {
        status: responseStatus,
        headers: responseHeaders,
        body: responseBody,
        responseTime,
        success
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: logData._id || null
      }
    };

    if (errorMessage) {
      result.error = errorMessage;
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('API testing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test API request'
    });
  }
});

// @route   POST /api/testing/batch
// @desc    Test multiple API requests in batch
// @access  Private
router.post('/batch', [
  body('requests')
    .isArray({ min: 1, max: 10 })
    .withMessage('Requests must be an array with 1-10 items'),
  body('requests.*.url')
    .isURL()
    .withMessage('Each request must have a valid URL'),
  body('requests.*.method')
    .isIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])
    .withMessage('Each request must have a valid HTTP method')
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

    const { requests, parallel = false } = req.body;
    const user = req.user;

    // Check quota
    if (user.usage.monthlyRequests + requests.length > user.usage.monthlyLimit) {
      return res.status(429).json({
        success: false,
        message: 'Batch request would exceed monthly API quota'
      });
    }

    const results = [];
    const primaryApiKey = user.apiKeys.find(key => key.isActive);

    if (parallel) {
      // Execute requests in parallel
      const promises = requests.map(async (requestConfig, index) => {
        const startTime = Date.now();

        try {
          const axiosConfig = {
            url: requestConfig.url,
            method: requestConfig.method.toLowerCase(),
            headers: {
              'User-Agent': 'API-Management-Platform/1.0',
              ...(requestConfig.headers || {})
            },
            timeout: requestConfig.timeout || 30000,
            validateStatus: () => true
          };

          if (['post', 'put', 'patch'].includes(requestConfig.method.toLowerCase()) && requestConfig.body) {
            axiosConfig.data = requestConfig.body;
          }

          const response = await axios(axiosConfig);
          const responseTime = Date.now() - startTime;
          const success = response.status >= 200 && response.status < 400;

          // Log the request
          await ApiLog.create({
            userId: user._id,
            apiKey: primaryApiKey?.key || 'testing',
            method: requestConfig.method.toUpperCase(),
            endpoint: new URL(requestConfig.url).pathname,
            fullUrl: requestConfig.url,
            requestHeaders: new Map(Object.entries(requestConfig.headers || {})),
            requestBody: requestConfig.body,
            responseStatus: response.status,
            responseHeaders: new Map(Object.entries(response.headers)),
            responseBody: response.data,
            responseTime,
            success,
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            metadata: {
              requestSize: JSON.stringify(requestConfig.body || {}).length,
              responseSize: JSON.stringify(response.data || {}).length,
              batchIndex: index
            }
          });

          return {
            index,
            request: {
              url: requestConfig.url,
              method: requestConfig.method.toUpperCase()
            },
            response: {
              status: response.status,
              headers: response.headers,
              body: response.data,
              responseTime,
              success
            }
          };

        } catch (error) {
          const responseTime = Date.now() - startTime;

          // Log the failed request
          await ApiLog.create({
            userId: user._id,
            apiKey: primaryApiKey?.key || 'testing',
            method: requestConfig.method.toUpperCase(),
            endpoint: new URL(requestConfig.url).pathname,
            fullUrl: requestConfig.url,
            requestHeaders: new Map(Object.entries(requestConfig.headers || {})),
            requestBody: requestConfig.body,
            responseStatus: error.response?.status || 0,
            responseHeaders: new Map(Object.entries(error.response?.headers || {})),
            responseBody: error.response?.data,
            responseTime,
            success: false,
            errorMessage: error.message,
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            metadata: {
              requestSize: JSON.stringify(requestConfig.body || {}).length,
              responseSize: JSON.stringify(error.response?.data || {}).length,
              batchIndex: index
            }
          });

          return {
            index,
            request: {
              url: requestConfig.url,
              method: requestConfig.method.toUpperCase()
            },
            response: {
              status: error.response?.status || 0,
              responseTime,
              success: false
            },
            error: error.message
          };
        }
      });

      const parallelResults = await Promise.all(promises);
      results.push(...parallelResults.sort((a, b) => a.index - b.index));

    } else {
      // Execute requests sequentially
      for (let i = 0; i < requests.length; i++) {
        const requestConfig = requests[i];
        const startTime = Date.now();

        try {
          const axiosConfig = {
            url: requestConfig.url,
            method: requestConfig.method.toLowerCase(),
            headers: {
              'User-Agent': 'API-Management-Platform/1.0',
              ...(requestConfig.headers || {})
            },
            timeout: requestConfig.timeout || 30000,
            validateStatus: () => true
          };

          if (['post', 'put', 'patch'].includes(requestConfig.method.toLowerCase()) && requestConfig.body) {
            axiosConfig.data = requestConfig.body;
          }

          const response = await axios(axiosConfig);
          const responseTime = Date.now() - startTime;
          const success = response.status >= 200 && response.status < 400;

          // Log the request
          await ApiLog.create({
            userId: user._id,
            apiKey: primaryApiKey?.key || 'testing',
            method: requestConfig.method.toUpperCase(),
            endpoint: new URL(requestConfig.url).pathname,
            fullUrl: requestConfig.url,
            requestHeaders: new Map(Object.entries(requestConfig.headers || {})),
            requestBody: requestConfig.body,
            responseStatus: response.status,
            responseHeaders: new Map(Object.entries(response.headers)),
            responseBody: response.data,
            responseTime,
            success,
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            metadata: {
              requestSize: JSON.stringify(requestConfig.body || {}).length,
              responseSize: JSON.stringify(response.data || {}).length,
              batchIndex: i
            }
          });

          results.push({
            index: i,
            request: {
              url: requestConfig.url,
              method: requestConfig.method.toUpperCase()
            },
            response: {
              status: response.status,
              headers: response.headers,
              body: response.data,
              responseTime,
              success
            }
          });

        } catch (error) {
          const responseTime = Date.now() - startTime;

          results.push({
            index: i,
            request: {
              url: requestConfig.url,
              method: requestConfig.method.toUpperCase()
            },
            response: {
              status: error.response?.status || 0,
              responseTime,
              success: false
            },
            error: error.message
          });
        }
      }
    }

    // Update user usage
    if (primaryApiKey) {
      const successCount = results.filter(r => r.response.success).length;
      const failCount = results.length - successCount;

      for (let i = 0; i < successCount; i++) {
        user.updateApiKeyUsage(primaryApiKey.key, true);
      }
      for (let i = 0; i < failCount; i++) {
        user.updateApiKeyUsage(primaryApiKey.key, false);
      }

      await user.save();
    }

    // Create activity
    await Activity.createActivity({
      userId: user._id,
      type: 'api_request',
      action: 'Batch API Requests Tested',
      description: `Tested ${requests.length} API requests in ${parallel ? 'parallel' : 'sequence'}`,
      status: 'success',
      details: {
        requestCount: requests.length,
        successCount: results.filter(r => r.response.success).length,
        parallel
      }
    });

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          successful: results.filter(r => r.response.success).length,
          failed: results.filter(r => !r.response.success).length,
          averageResponseTime: results.reduce((sum, r) => sum + r.response.responseTime, 0) / results.length,
          parallel
        }
      }
    });

  } catch (error) {
    console.error('Batch API testing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test batch API requests'
    });
  }
});

// @route   GET /api/testing/history
// @desc    Get testing history for the user
// @access  Private
router.get('/history', async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, endpoint, method, status } = req.query;

    const query = {
      userId,
      apiKey: { $in: ['testing', ...req.user.apiKeys.map(k => k.key)] }
    };

    if (endpoint) query.endpoint = new RegExp(endpoint, 'i');
    if (method) query.method = method.toUpperCase();
    if (status) query.responseStatus = parseInt(status);

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ApiLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('method endpoint fullUrl responseStatus responseTime success timestamp errorMessage'),
      ApiLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        history: logs.map(log => ({
          id: log._id,
          method: log.method,
          endpoint: log.endpoint,
          url: log.fullUrl,
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
        }
      }
    });
  } catch (error) {
    console.error('Get testing history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get testing history'
    });
  }
});

export default router;