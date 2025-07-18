// API Configuration and Service Layer
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Create API request with auth headers
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  login: async (email, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  register: async (name, email, password) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    });
  },

  logout: async () => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },

  getProfile: async () => {
    return apiRequest('/auth/me');
  },

  changePassword: async (currentPassword, newPassword) => {
    return apiRequest('/auth/change-password', {
      method: 'PUT',
      body: { currentPassword, newPassword },
    });
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    return apiRequest('/user/profile');
  },

  updateProfile: async (profileData) => {
    return apiRequest('/user/profile', {
      method: 'PUT',
      body: profileData,
    });
  },

  updateSettings: async (settings) => {
    return apiRequest('/user/settings', {
      method: 'PUT',
      body: settings,
    });
  },

  getUsage: async () => {
    return apiRequest('/user/usage');
  },

  deactivateAccount: async () => {
    return apiRequest('/user/account', {
      method: 'DELETE',
    });
  },
};

// API Keys API
export const apiKeysAPI = {
  getAll: async () => {
    return apiRequest('/api-keys');
  },

  create: async (name) => {
    return apiRequest('/api-keys', {
      method: 'POST',
      body: { name },
    });
  },

  revoke: async (keyId) => {
    return apiRequest(`/api-keys/${keyId}`, {
      method: 'DELETE',
    });
  },
};

// Analytics API
export const analyticsAPI = {
  getDashboard: async (timeRange = '7d') => {
    return apiRequest(`/analytics/dashboard?timeRange=${timeRange}`);
  },

  getDetailed: async (options = {}) => {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });

    return apiRequest(`/analytics/detailed?${params.toString()}`);
  },

  export: async (timeRange = '7d', format = 'json') => {
    return apiRequest(`/analytics/export?timeRange=${timeRange}&format=${format}`);
  },
};

// Logs API
export const logsAPI = {
  getAll: async (options = {}) => {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });

    return apiRequest(`/logs?${params.toString()}`);
  },

  getById: async (id) => {
    return apiRequest(`/logs/${id}`);
  },

  getSummary: async (timeRange = '24h') => {
    return apiRequest(`/logs/stats/summary?timeRange=${timeRange}`);
  },

  clearOld: async (olderThan) => {
    return apiRequest('/logs', {
      method: 'DELETE',
      body: { olderThan },
    });
  },
};

// Activity API
export const activityAPI = {
  getAll: async (options = {}) => {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });

    return apiRequest(`/activity?${params.toString()}`);
  },

  getStats: async (timeRange = '7d') => {
    return apiRequest(`/activity/stats?timeRange=${timeRange}`);
  },

  markAsRead: async (activityIds = null) => {
    return apiRequest('/activity/mark-read', {
      method: 'PUT',
      body: { activityIds },
    });
  },

  getTypes: async () => {
    return apiRequest('/activity/types');
  },

  getSummary: async (timeRange = '24h') => {
    return apiRequest(`/activity/summary?timeRange=${timeRange}`);
  },

  delete: async (id) => {
    return apiRequest(`/activity/${id}`, {
      method: 'DELETE',
    });
  },

  clearOld: async (olderThan) => {
    return apiRequest('/activity', {
      method: 'DELETE',
      body: { olderThan },
    });
  },
};

// Testing API
export const testingAPI = {
  request: async (requestData) => {
    return apiRequest('/testing/request', {
      method: 'POST',
      body: requestData,
    });
  },

  batch: async (requests, parallel = false) => {
    return apiRequest('/testing/batch', {
      method: 'POST',
      body: { requests, parallel },
    });
  },

  getHistory: async (options = {}) => {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });

    return apiRequest(`/testing/history?${params.toString()}`);
  },
};

// Admin API
export const adminAPI = {
  getStats: async (timeRange = '30d') => {
    return apiRequest(`/admin/stats?timeRange=${timeRange}`);
  },

  getUsers: async (options = {}) => {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });

    return apiRequest(`/admin/users?${params.toString()}`);
  },

  getUser: async (id) => {
    return apiRequest(`/admin/users/${id}`);
  },

  updateUser: async (id, userData) => {
    return apiRequest(`/admin/users/${id}`, {
      method: 'PUT',
      body: userData,
    });
  },

  deleteUser: async (id) => {
    return apiRequest(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  getLogs: async (options = {}) => {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });

    return apiRequest(`/admin/logs?${params.toString()}`);
  },
};

export default {
  authAPI,
  userAPI,
  apiKeysAPI,
  analyticsAPI,
  logsAPI,
  activityAPI,
  testingAPI,
  adminAPI,
};