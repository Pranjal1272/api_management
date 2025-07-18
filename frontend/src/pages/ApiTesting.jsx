import React, { useState, useEffect } from 'react';
import { testingAPI } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Play, Plus, Trash2, Clock, CheckCircle, AlertCircle, Copy, History } from 'lucide-react';

const ApiTesting = () => {
  const [requests, setRequests] = useState([{
    id: 1,
    url: '',
    method: 'GET',
    headers: {},
    body: ''
  }]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState({});
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await testingAPI.getHistory({ limit: 20 });
      setHistory(response.data.history);
    } catch (err) {
      console.error('Failed to fetch testing history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const updateRequest = (id, field, value) => {
    setRequests(prev =>
      prev.map(req =>
        req.id === id ? { ...req, [field]: value } : req
      )
    );
  };

  const updateHeaders = (id, headerKey, headerValue) => {
    setRequests(prev =>
      prev.map(req => {
        if (req.id === id) {
          const newHeaders = { ...req.headers };
          if (headerValue.trim() === '') {
            delete newHeaders[headerKey];
          } else {
            newHeaders[headerKey] = headerValue;
          }
          return { ...req, headers: newHeaders };
        }
        return req;
      })
    );
  };

  const addHeader = (id) => {
    setRequests(prev =>
      prev.map(req =>
        req.id === id
          ? { ...req, headers: { ...req.headers, '': '' } }
          : req
      )
    );
  };

  const addRequest = () => {
    const newId = Math.max(...requests.map(r => r.id)) + 1;
    setRequests(prev => [
      ...prev,
      {
        id: newId,
        url: '',
        method: 'GET',
        headers: {},
        body: ''
      }
    ]);
  };

  const removeRequest = (id) => {
    if (requests.length > 1) {
      setRequests(prev => prev.filter(req => req.id !== id));
      setResponses(prev => {
        const newResponses = { ...prev };
        delete newResponses[id];
        return newResponses;
      });
    }
  };

  const executeRequest = async (request) => {
    if (!request.url.trim()) {
      error('Please enter a URL');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, [request.id]: true }));

      const requestData = {
        url: request.url,
        method: request.method,
        headers: request.headers,
        timeout: 30000
      };

      // Add body for methods that support it
      if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.body.trim()) {
        try {
          requestData.body = JSON.parse(request.body);
        } catch (e) {
          requestData.body = request.body;
        }
      }

      const response = await testingAPI.request(requestData);

      setResponses(prev => ({
        ...prev,
        [request.id]: response.data
      }));

      success('Request executed successfully');
      fetchHistory(); // Refresh history
    } catch (err) {
      console.error('Request failed:', err);

      // Still show the error response if available
      if (err.response?.data) {
        setResponses(prev => ({
          ...prev,
          [request.id]: {
            request: {
              url: request.url,
              method: request.method,
              headers: request.headers,
              body: request.body
            },
            response: {
              status: err.response.status,
              headers: err.response.headers,
              body: err.response.data,
              success: false
            },
            error: err.message
          }
        }));
      }

      error(err.message || 'Request failed');
    } finally {
      setLoading(prev => ({ ...prev, [request.id]: false }));
    }
  };

  const executeBatch = async () => {
    const validRequests = requests.filter(req => req.url.trim());

    if (validRequests.length === 0) {
      error('Please add at least one valid request');
      return;
    }

    try {
      setLoading(prev => {
        const newLoading = { ...prev };
        validRequests.forEach(req => {
          newLoading[req.id] = true;
        });
        return newLoading;
      });

      const requestsData = validRequests.map(req => ({
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: ['POST', 'PUT', 'PATCH'].includes(req.method) && req.body.trim()
          ? (() => {
              try {
                return JSON.parse(req.body);
              } catch (e) {
                return req.body;
              }
            })()
          : undefined
      }));

      const response = await testingAPI.batch(requestsData, true); // Execute in parallel

      // Map results back to requests
      response.data.results.forEach((result, index) => {
        const requestId = validRequests[index].id;
        setResponses(prev => ({
          ...prev,
          [requestId]: {
            request: result.request,
            response: result.response,
            error: result.error
          }
        }));
      });

      success(`Batch executed: ${response.data.summary.successful} successful, ${response.data.summary.failed} failed`);
      fetchHistory(); // Refresh history
    } catch (err) {
      console.error('Batch execution failed:', err);
      error(err.message || 'Batch execution failed');
    } finally {
      setLoading(prev => {
        const newLoading = { ...prev };
        validRequests.forEach(req => {
          newLoading[req.id] = false;
        });
        return newLoading;
      });
    }
  };

  const copyResponse = (response) => {
    const text = JSON.stringify(response, null, 2);
    navigator.clipboard.writeText(text);
    success('Response copied to clipboard');
  };

  const loadFromHistory = (historyItem) => {
    setRequests([{
      id: 1,
      url: historyItem.url,
      method: historyItem.method,
      headers: {},
      body: ''
    }]);
    setShowHistory(false);
    success('Request loaded from history');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'text-green-600 dark:text-green-400';
    if (status >= 300 && status < 400) return 'text-blue-600 dark:text-blue-400';
    if (status >= 400 && status < 500) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Testing</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test API endpoints directly from the dashboard.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center space-x-2"
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </Button>
          <Button
            onClick={executeBatch}
            disabled={Object.values(loading).some(Boolean) || requests.every(req => !req.url.trim())}
            className="flex items-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>Execute All</span>
          </Button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <Card title="Request History" subtitle="Previously executed requests">
          {historyLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No request history found
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getMethodColor(item.method)}`}>
                      {item.method}
                    </span>
                    <span className="text-sm font-mono text-gray-900 dark:text-white">
                      {item.endpoint}
                    </span>
                    <span className={`text-sm font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(item.timestamp)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => loadFromHistory(item)}
                    >
                      Load
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Request Builder */}
      <div className="space-y-4">
        {requests.map((request) => (
          <Card
            key={request.id}
            title={`Request ${request.id}`}
            subtitle="Configure and execute API request"
          >
            <div className="space-y-4">
              {/* URL and Method */}
              <div className="flex space-x-4">
                <div className="w-32">
                  <select
                    value={request.method}
                    onChange={(e) => updateRequest(request.id, 'method', e.target.value)}
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
                <div className="flex-1">
                  <input
                    type="text"
                    value={request.url}
                    onChange={(e) => updateRequest(request.id, 'url', e.target.value)}
                    placeholder="https://api.example.com/endpoint"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <Button
                  onClick={() => executeRequest(request)}
                  disabled={loading[request.id] || !request.url.trim()}
                  className="flex items-center space-x-2"
                >
                  {loading[request.id] ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Test</span>
                    </>
                  )}
                </Button>
                {requests.length > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => removeRequest(request.id)}
                    className="flex items-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Headers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Headers
                </label>
                <div className="space-y-2">
                  {Object.entries(request.headers).map(([key, value], index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => {
                          const newHeaders = { ...request.headers };
                          delete newHeaders[key];
                          newHeaders[e.target.value] = value;
                          updateRequest(request.id, 'headers', newHeaders);
                        }}
                        placeholder="Header name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => updateHeaders(request.id, key, e.target.value)}
                        placeholder="Header value"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addHeader(request.id)}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Header</span>
                  </Button>
                </div>
              </div>

              {/* Request Body */}
              {['POST', 'PUT', 'PATCH'].includes(request.method) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Request Body (JSON)
                  </label>
                  <textarea
                    value={request.body}
                    onChange={(e) => updateRequest(request.id, 'body', e.target.value)}
                    placeholder='{"key": "value"}'
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono"
                  />
                </div>
              )}

              {/* Response */}
              {responses[request.id] && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white">Response</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyResponse(responses[request.id])}
                      className="flex items-center space-x-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {/* Status and Timing */}
                    <div className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
                        <span className={`font-medium ${getStatusColor(responses[request.id].response.status)}`}>
                          {responses[request.id].response.status}
                        </span>
                        {responses[request.id].response.success ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      {responses[request.id].response.responseTime && (
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {responses[request.id].response.responseTime}ms
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Error Message */}
                    {responses[request.id].error && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-800 dark:text-red-200 text-sm">
                          {responses[request.id].error}
                        </p>
                      </div>
                    )}

                    {/* Response Headers */}
                    {responses[request.id].response.headers && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Headers</h5>
                        <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                          {JSON.stringify(responses[request.id].response.headers, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Response Body */}
                    {responses[request.id].response.body && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Body</h5>
                        <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto max-h-64">
                          {typeof responses[request.id].response.body === 'string'
                            ? responses[request.id].response.body
                            : JSON.stringify(responses[request.id].response.body, null, 2)
                          }
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}

        <Button
          onClick={addRequest}
          variant="outline"
          className="w-full flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Another Request</span>
        </Button>
      </div>
    </div>
  );
};

export default ApiTesting;