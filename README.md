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
- `POST /api/testing/request` - Test single API request
- `POST /api/testing/batch` - Test multiple API requests
- `GET /api/testing/history` - Get testing history

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

## Development

### Project Structure
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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository. 