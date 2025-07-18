import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { apiKeysAPI } from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Key, Copy, RefreshCw, Trash2, Eye, EyeOff, Plus } from 'lucide-react';

const ApiKeyManager = () => {
  const { user, updateUser } = useAuth();
  const { success, error } = useToast();
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFullKeys, setShowFullKeys] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const response = await apiKeysAPI.getAll();
      setApiKeys(response.data.apiKeys);
    } catch (err) {
      console.error('Failed to fetch API keys:', err);
      error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    success('API key copied to clipboard!');
  };

  const maskApiKey = (key) => {
    if (!key) return '';
    return key.substring(0, 8) + '••••••••••••••••' + key.substring(key.length - 4);
  };

  const toggleKeyVisibility = (keyId) => {
    setShowFullKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const generateNewKey = async () => {
    if (!newKeyName.trim()) {
      error('Please enter a name for the API key');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiKeysAPI.create(newKeyName.trim());
      setApiKeys(prev => [...prev, response.data.apiKey]);
      setNewKeyName('');
      setShowCreateForm(false);
      success('New API key generated successfully!');
    } catch (err) {
      console.error('Failed to generate API key:', err);
      error(err.message || 'Failed to generate new API key');
    } finally {
      setIsGenerating(false);
    }
  };

  const revokeKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      await apiKeysAPI.revoke(keyId);
      setApiKeys(prev => prev.filter(key => key.keyId !== keyId));
      success('API key revoked successfully!');
    } catch (err) {
      console.error('Failed to revoke API key:', err);
      error(err.message || 'Failed to revoke API key');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Key Manager</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your API keys and access credentials.
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Key Manager</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your API keys and access credentials.
          </p>
        </div>

        <Button
          onClick={() => setShowCreateForm(true)}
          disabled={isGenerating}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Key</span>
        </Button>
      </div>

      {/* Create New Key Form */}
      {showCreateForm && (
        <Card title="Generate New API Key" subtitle="Create a new API key with a custom name">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Key Name
              </label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production API Key"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={generateNewKey}
                disabled={isGenerating || !newKeyName.trim()}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Key'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewKeyName('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* API Keys List */}
      <Card title="Your API Keys" subtitle={`You have ${apiKeys.length} API key${apiKeys.length !== 1 ? 's' : ''}`}>
        {apiKeys.length === 0 ? (
          <div className="text-center py-8">
            <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No API keys found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Generate your first API key to get started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.keyId} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {apiKey.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Created: {formatDate(apiKey.createdAt)}
                      {apiKey.lastUsed && (
                        <span className="ml-4">
                          Last used: {formatDate(apiKey.lastUsed)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      apiKey.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {apiKey.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Key className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <code className="text-sm font-mono text-gray-800 dark:text-gray-200">
                      {showFullKeys[apiKey.keyId] ? apiKey.key : maskApiKey(apiKey.key)}
                    </code>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleKeyVisibility(apiKey.keyId)}
                      className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showFullKeys[apiKey.keyId] ?
                        <EyeOff className="w-4 h-4" /> :
                        <Eye className="w-4 h-4" />
                      }
                    </button>
                    <button
                      onClick={() => copyToClipboard(apiKey.key)}
                      className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => revokeKey(apiKey.keyId)}
                      className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Usage Statistics */}
                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {apiKey.usage.requests.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Requests</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {apiKey.usage.successfulRequests.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Successful</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                      {apiKey.usage.failedRequests.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Failed</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Security Notice */}
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20">
        <div className="p-4">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            Security Notice
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Keep your API keys secure and never share them publicly. If you suspect a key has been compromised,
            revoke it immediately and generate a new one.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ApiKeyManager;