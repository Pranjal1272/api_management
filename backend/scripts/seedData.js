import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import ApiLog from '../models/ApiLog.js';
import Activity from '../models/Activity.js';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await ApiLog.deleteMany({});
    await Activity.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Create admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });

    // Generate initial API key for admin
    const adminApiKey = adminUser.generateApiKey('Admin API Key');
    await adminUser.save();
    console.log('👤 Created admin user');
    console.log(`   Email: admin@example.com`);
    console.log(`   Password: admin123`);
    console.log(`   API Key: ${adminApiKey.key}`);

    // Create sample regular users
    const users = [];
    for (let i = 1; i <= 5; i++) {
      const user = new User({
        name: `Test User ${i}`,
        email: `user${i}@example.com`,
        password: 'password123',
        role: 'user',
        profile: {
          company: `Company ${i}`,
          website: `https://company${i}.com`,
          bio: `I am test user number ${i} working with APIs.`
        }
      });

      // Generate initial API key
      const apiKey = user.generateApiKey(`User ${i} Default Key`);

      // Add some usage data
      user.usage.totalRequests = Math.floor(Math.random() * 1000) + 100;
      user.usage.totalSuccessfulRequests = Math.floor(user.usage.totalRequests * 0.85);
      user.usage.totalFailedRequests = user.usage.totalRequests - user.usage.totalSuccessfulRequests;
      user.usage.monthlyRequests = Math.floor(Math.random() * 500) + 50;

      await user.save();
      users.push(user);

      console.log(`👤 Created user: ${user.email} (API Key: ${apiKey.key})`);
    }

    // Create sample API logs for users
    console.log('📊 Creating sample API logs...');
    const endpoints = [
      '/api/users',
      '/api/products',
      '/api/orders',
      '/api/analytics',
      '/api/payments',
      '/api/notifications'
    ];

    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    const statusCodes = [200, 201, 400, 401, 404, 500];

    for (const user of users) {
      const numLogs = Math.floor(Math.random() * 50) + 20;
      const apiKey = user.apiKeys[0];

      for (let i = 0; i < numLogs; i++) {
        const method = methods[Math.floor(Math.random() * methods.length)];
        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        const status = statusCodes[Math.floor(Math.random() * statusCodes.length)];
        const success = status >= 200 && status < 400;
        const responseTime = Math.floor(Math.random() * 2000) + 50;

        // Create log entry with random timestamp within last 30 days
        const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

        await ApiLog.create({
          userId: user._id,
          apiKey: apiKey.key,
          method,
          endpoint,
          fullUrl: `https://api.example.com${endpoint}`,
          requestHeaders: new Map([
            ['Authorization', `Bearer ${apiKey.key}`],
            ['Content-Type', 'application/json'],
            ['User-Agent', 'API-Management-Platform/1.0']
          ]),
          requestBody: method === 'POST' ? { test: 'data' } : null,
          responseStatus: status,
          responseHeaders: new Map([
            ['Content-Type', 'application/json'],
            ['X-RateLimit-Remaining', '999']
          ]),
          responseBody: success ? { result: 'success', data: [] } : { error: 'Something went wrong' },
          responseTime,
          success,
          errorMessage: success ? null : 'Request failed',
          userAgent: 'API-Management-Platform/1.0',
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          metadata: {
            requestSize: 150,
            responseSize: success ? 500 : 100,
            cacheHit: Math.random() > 0.8,
            rateLimited: false
          },
          timestamp
        });
      }
    }

    // Create sample activities
    console.log('🎯 Creating sample activities...');
    for (const user of [...users, adminUser]) {
      const activities = [
        {
          type: 'login',
          action: 'User Login',
          description: 'User logged in successfully',
          status: 'success'
        },
        {
          type: 'api_key_generated',
          action: 'API Key Generated',
          description: 'New API key generated',
          status: 'success'
        },
        {
          type: 'profile_updated',
          action: 'Profile Updated',
          description: 'User updated their profile information',
          status: 'success'
        },
        {
          type: 'settings_updated',
          action: 'Settings Updated',
          description: 'User updated their account settings',
          status: 'success'
        }
      ];

      for (const activityData of activities) {
        const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
        await Activity.create({
          userId: user._id,
          ...activityData,
          timestamp,
          metadata: {
            ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
      }
    }

    console.log('✅ Sample data created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Users: user1@example.com to user5@example.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();