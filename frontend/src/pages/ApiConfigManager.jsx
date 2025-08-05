import React, { useState, useEffect } from 'react';
import { apiConfigsAPI } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Plus, Edit, Trash2, Play, Save, X } from 'lucide-react';

const ApiConfigManager = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    baseUrl: '',
    endpoint: '',
    method: 'GET',
    headers: {},
    body: ''
  });
  const { success, error } = useToast();

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await apiConfigsAPI.getAll();
      setConfigs(response.data);
    } catch (err) {
      console.error('Failed to fetch API configs:', err);
      error('Failed to fetch API configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const configData = {
        ...formData,
        headers: Object.fromEntries(
          Object.entries(formData.headers)
            .filter(([key, value]) => 
              !key.startsWith('header_') && 
              key.trim() && 
              value.trim()
            )
        )
      };

      if (editingConfig) {
        await apiConfigsAPI.update(editingConfig._id, configData);
        success('API configuration updated successfully');
      } else {
        await apiConfigsAPI.create(configData);
        success('API configuration created successfully');
      }

      setShowForm(false);
      setEditingConfig(null);
      resetForm();
      fetchConfigs();
    } catch (err) {
      console.error('Failed to save API config:', err);
      error(err.message || 'Failed to save API configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this API configuration?')) {
      return;
    }

    try {
      setLoading(true);
      await apiConfigsAPI.delete(id);
      success('API configuration deleted successfully');
      fetchConfigs();
    } catch (err) {
      console.error('Failed to delete API config:', err);
      error(err.message || 'Failed to delete API configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      baseUrl: config.baseUrl,
      endpoint: config.endpoint,
      method: config.method,
      headers: config.headers || {},
      body: config.body || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      baseUrl: '',
      endpoint: '',
      method: 'GET',
      headers: {},
      body: ''
    });
  };

  const addHeader = () => {
    setFormData(prev => ({
      ...prev,
      headers: { ...prev.headers, [`header_${Date.now()}`]: '' }
    }));
  };

  const updateHeader = (oldKey, newKey, value) => {
    setFormData(prev => {
      const newHeaders = { ...prev.headers };
      delete newHeaders[oldKey];
      // Always add the header, even if empty, to allow typing
      newHeaders[newKey] = value;
      return { ...prev, headers: newHeaders };
    });
  };

  const removeHeader = (key) => {
    setFormData(prev => {
      const newHeaders = { ...prev.headers };
      delete newHeaders[key];
      return { ...prev, headers: newHeaders };
    });
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'POST': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PUT': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'DELETE': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'PATCH': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Configurations</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your API endpoint configurations for easy testing.
          </p>
        </div>

        <Button
          onClick={() => {
            setShowForm(true);
            setEditingConfig(null);
            resetForm();
          }}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Configuration</span>
        </Button>
      </div>

      {/* Configuration Form */}
      {showForm && (
        <Card title={editingConfig ? 'Edit Configuration' : 'Add Configuration'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Configuration Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My API Configuration"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  HTTP Method
                </label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData(prev => ({ ...prev, method: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                  <option value="HEAD">HEAD</option>
                  <option value="OPTIONS">OPTIONS</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Base URL
                </label>
                <input
                  type="url"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
                  placeholder="https://api.example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Endpoint
                </label>
                <input
                  type="text"
                  value={formData.endpoint}
                  onChange={(e) => setFormData(prev => ({ ...prev, endpoint: e.target.value }))}
                  placeholder="/users"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Headers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Headers
              </label>
              <div className="space-y-2">
                {Object.entries(formData.headers).map(([key, value], index) => (
                  <div key={key} className="flex space-x-2">
                    <input
                      type="text"
                      value={key.startsWith('header_') ? '' : key}
                      onChange={(e) => updateHeader(key, e.target.value, value)}
                      placeholder="Header name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateHeader(key, key, e.target.value)}
                      placeholder="Header value"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeHeader(key)}
                      className="px-3"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addHeader}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Header</span>
                </Button>
              </div>
            </div>

            {/* Request Body */}
            {['POST', 'PUT', 'PATCH'].includes(formData.method) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Request Body (JSON)
                </label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  placeholder='{"key": "value"}'
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono"
                />
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingConfig(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{editingConfig ? 'Update' : 'Create'}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Configurations List */}
      <div className="space-y-4">
        {loading && !showForm ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : configs.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No API configurations found.</p>
              <p className="text-sm mt-2">Create your first configuration to get started.</p>
            </div>
          </Card>
        ) : (
          configs.map((config) => (
            <Card key={config._id} title={config.name}>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getMethodColor(config.method)}`}>
                    {config.method}
                  </span>
                  <span className="text-sm font-mono text-gray-900 dark:text-white">
                    {config.baseUrl}{config.endpoint}
                  </span>
                </div>

                {Object.keys(config.headers || {}).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Headers</h4>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-sm">
                      {Object.entries(config.headers).map(([key, value]) => (
                        <div key={key} className="font-mono">
                          {key}: {value}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {config.body && ['POST', 'PUT', 'PATCH'].includes(config.method) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Body</h4>
                    <pre className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-sm overflow-x-auto">
                      {typeof config.body === 'string' 
                        ? config.body 
                        : JSON.stringify(config.body, null, 2)
                      }
                    </pre>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(config)}
                    className="flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(config._id)}
                    className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ApiConfigManager; 