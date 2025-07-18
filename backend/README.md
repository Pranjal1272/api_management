# API Management Backend

A complete Express.js backend for the API Management Dashboard with MongoDB database integration.

## Features

- 🔐 **JWT Authentication** - Secure user authentication and authorization
- 👥 **User Management** - User registration, login, profile management
- 🔑 **API Key Management** - Generate, revoke, and manage API keys
- 📊 **Analytics & Monitoring** - Real-time API usage analytics
- 📋 **Request Logging** - Comprehensive API request and response logging
- 🎯 **Activity Tracking** - User activity feeds and notifications
- 👨‍💼 **Admin Panel** - Administrative functions for user and system management
- 🧪 **API Testing** - Built-in API testing functionality
- ⚡ **Rate Limiting** - Configurable rate limiting and quota management

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` file with your configuration:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/api_management
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173
   ```

4. **Start MongoDB:**

   ```bash
   # Using MongoDB service
   sudo systemctl start mongod

   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Seed the database (optional):**

   ```bash
   npm run seed
   ```

6. **Start the server:**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/change-password` - Change password

### User Management

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `PUT /api/user/settings` - Update user settings
- `GET /api/user/usage` - Get usage statistics
- `DELETE /api/user/account` - Deactivate account

### API Keys

- `GET /api/api-keys` - Get all user API keys
- `POST /api/api-keys` - Generate new API key
- `PUT /api/api-keys/:keyId` - Update API key
- `DELETE /api/api-keys/:keyId` - Revoke API key
- `GET /api/api-keys/:keyId/usage` - Get API key usage
- `POST /api/api-keys/:keyId/regenerate` - Regenerate API key

### Analytics

- `GET /api/analytics/dashboard` - Get dashboard analytics
- `GET /api/analytics/detailed` - Get detailed analytics with filters
- `GET /api/analytics/export` - Export analytics data

### API Logs

- `GET /api/logs` - Get API logs with filtering
- `GET /api/logs/:id` - Get detailed log entry
- `GET /api/logs/stats/summary` - Get logs summary statistics
- `DELETE /api/logs` - Clear old logs

### Activity

- `GET /api/activity` - Get user activities
- `GET /api/activity/stats` - Get activity statistics
- `PUT /api/activity/mark-read` - Mark activities as read
- `GET /api/activity/types` - Get activity types
- `GET /api/activity/summary` - Get activity summary
- `DELETE /api/activity/:id` - Delete activity
- `DELETE /api/activity` - Clear old activities

### API Testing

- `POST /api/testing/request` - Test single API request
- `POST /api/testing/batch` - Test multiple API requests
- `GET /api/testing/history` - Get testing history

### Admin (Admin role required)

- `GET /api/admin/stats` - Get admin dashboard statistics
- `GET /api/admin/users` - Get all users with pagination
- `GET /api/admin/users/:id` - Get detailed user information
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/logs` - Get system-wide logs

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

## API Key Authentication

For API testing endpoints, you can also authenticate using API keys:

```bash
# Header method
X-API-Key: <your-api-key>

# Query parameter method
GET /api/testing/request?api_key=<your-api-key>
```

## Sample Requests

### Register a new user

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Generate API Key

```bash
curl -X POST http://localhost:5000/api/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "name": "My API Key"
  }'
```

### Test an API

```bash
curl -X POST http://localhost:5000/api/testing/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "url": "https://jsonplaceholder.typicode.com/posts/1",
    "method": "GET",
    "headers": {
      "User-Agent": "My App"
    }
  }'
```

## Database Models

### User

- Authentication information (email, password)
- Profile data (name, company, bio)
- API keys array
- Usage statistics
- Settings and preferences

### ApiLog

- Request/response details
- Performance metrics
- User and API key associations
- Timestamps and metadata

### Activity

- User activity tracking
- System events
- Notifications and alerts
- Activity types and statuses

## Error Handling

The API uses consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors if applicable
}
```

## Rate Limiting

- 100 requests per 15 minutes per IP address
- Additional per-user quotas based on subscription
- Configurable monthly limits per user

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- CORS protection
- Rate limiting
- Helmet.js security headers

## Development

### Project Structure

```
backend/
├── models/          # Mongoose models
├── routes/          # API route handlers
├── middleware/      # Custom middleware
├── scripts/         # Utility scripts
├── server.js        # Main application file
└── package.json     # Dependencies and scripts
```

### Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run seed` - Seed database with sample data

### Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - JWT token expiration time
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed CORS origin

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
