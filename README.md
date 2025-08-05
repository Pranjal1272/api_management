<<<<<<< HEAD
# API Management System

A comprehensive API management platform that allows users to register, test, and monitor API endpoints with detailed analytics and logging.

## Features

### 🔐 Authentication & User Management
- User registration and login with JWT authentication
- Role-based access control (User/Admin)
- Secure password hashing with bcrypt
- API key management for each user

### 🧪 API Testing & Configuration
- **API Configuration Management**: Save and manage API endpoint configurations
- **Real-time API Testing**: Test GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS requests
- **Request/Response Logging**: Detailed logging of all API interactions
- **Batch Testing**: Execute multiple requests in parallel or sequence
- **Error Handling**: Graceful handling of network errors, timeouts, and HTTP errors
- **Response Analysis**: View status codes, headers, response times, and body content

### 📊 Analytics & Monitoring
- **Request Analytics**: Track request volume, success rates, and response times
- **Performance Metrics**: Monitor average response times and throughput
- **Error Tracking**: Identify and analyze failed requests
- **Usage Statistics**: Track API usage per user and API key

### 📝 Logging & History
- **Comprehensive Logging**: Log all request details including headers, body, and metadata
- **Request History**: View and replay previous API requests
- **Activity Tracking**: Monitor user activities and system events
- **Search & Filter**: Filter logs by endpoint, method, status, and date range

### 🔑 API Key Management
- **Multiple API Keys**: Generate and manage multiple API keys per user
- **Key Usage Tracking**: Monitor usage per API key
- **Key Revocation**: Securely revoke compromised keys
- **Usage Limits**: Set and enforce usage limits

### 👨‍💼 Admin Panel
- **User Management**: View and manage all users
- **System Analytics**: Platform-wide usage statistics
- **Log Monitoring**: Access to all system logs
- **User Activity**: Monitor user activities across the platform

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcrypt** for password hashing
- **Axios** for HTTP requests
- **Express Validator** for input validation
- **Helmet** for security headers
- **Morgan** for logging
- **Rate Limiting** for API protection

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API communication
- **Context API** for state management

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd api_management
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend environment
   cd backend
   cp env.example .env
   # Edit .env with your configuration

   # Frontend environment
   cd ../frontend
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB (if running locally)
   mongod

   # Seed the database with sample data
   cd backend
   npm run seed
   ```

5. **Start the application**
   ```bash
   # Start backend server (from backend directory)
   npm run dev

   # Start frontend development server (from frontend directory)
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/health

### Default Credentials
After running the seed script, you can login with:

**Admin User:**
- Email: admin@example.com
- Password: admin123

**Regular Users:**
- Email: user1@example.com to user5@example.com
- Password: password123

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile

### API Testing
=======
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

>>>>>>> f4a09ac005e307af56006e58faee00113b8a03e4
- `POST /api/testing/request` - Test single API request
- `POST /api/testing/batch` - Test multiple API requests
- `GET /api/testing/history` - Get testing history

<<<<<<< HEAD
### API Configurations
- `GET /api/configs` - Get user's API configurations
- `POST /api/configs` - Create new API configuration
- `PUT /api/configs/:id` - Update API configuration
- `DELETE /api/configs/:id` - Delete API configuration

### Analytics & Logs
- `GET /api/analytics/dashboard` - Get analytics dashboard data
- `GET /api/logs` - Get API logs with filtering
- `GET /api/activity` - Get user activity logs

### API Keys
- `GET /api/api-keys` - Get user's API keys
- `POST /api/api-keys` - Generate new API key
- `DELETE /api/api-keys/:id` - Revoke API key

## Usage Guide

### 1. Getting Started
1. Register a new account or login with existing credentials
2. Generate your first API key from the API Keys page
3. Start creating API configurations for your endpoints

### 2. API Configuration
1. Navigate to "API Configs" in the sidebar
2. Click "Add Configuration" to create a new API endpoint configuration
3. Fill in the details:
   - **Name**: A descriptive name for your configuration
   - **Base URL**: The base URL of your API (e.g., https://api.example.com)
   - **Endpoint**: The specific endpoint path (e.g., /users)
   - **Method**: HTTP method (GET, POST, PUT, DELETE, etc.)
   - **Headers**: Any required headers (Authorization, Content-Type, etc.)
   - **Body**: Request body for POST/PUT requests (JSON format)

### 3. API Testing
1. Go to the "API Testing" page
2. You can either:
   - Manually enter request details
   - Load a saved configuration from the "Configs" panel
   - Load a previous request from the "History" panel
3. Click "Test" to execute the request
4. View detailed response information including status, headers, body, and timing

### 4. Batch Testing
1. Add multiple requests using the "Add Another Request" button
2. Configure each request with different URLs, methods, headers, and bodies
3. Click "Execute All" to run all requests
4. Choose between parallel or sequential execution

### 5. Monitoring & Analytics
1. View real-time analytics on the Dashboard
2. Check detailed logs in the "API Logs" page
3. Monitor your activity in the "Activity" page
4. Track API key usage in the "API Keys" page
=======
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
>>>>>>> f4a09ac005e307af56006e58faee00113b8a03e4

## Development

### Project Structure
<<<<<<< HEAD
```
api_management/
├── backend/
│   ├── middleware/     # Authentication & error handling
│   ├── models/        # MongoDB schemas
│   ├── routes/        # API route handlers
│   ├── scripts/       # Database seeding
│   └── server.js      # Express server
├── frontend/
│   ├── components/    # React components
│   ├── contexts/      # React contexts
│   ├── lib/          # API utilities
│   ├── pages/        # Page components
│   └── src/          # Main source files
```

### Adding New Features
1. **Backend**: Add routes in `backend/routes/`, models in `backend/models/`
2. **Frontend**: Add pages in `frontend/src/pages/`, components in `frontend/src/components/`
3. **API Integration**: Update `frontend/src/lib/api.js` with new endpoints

### Environment Variables

**Backend (.env)**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/api_management
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

**Frontend (.env)**
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=API Management System
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Rate Limiting**: Protection against abuse
- **CORS Configuration**: Controlled cross-origin requests
- **Input Validation**: Server-side validation for all inputs
- **Error Handling**: Secure error responses without sensitive data
- **API Key Management**: Secure API key generation and rotation
=======

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
>>>>>>> f4a09ac005e307af56006e58faee00113b8a03e4

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
<<<<<<< HEAD

## Support

For support and questions, please open an issue in the repository. 
=======
>>>>>>> f4a09ac005e307af56006e58faee00113b8a03e4
