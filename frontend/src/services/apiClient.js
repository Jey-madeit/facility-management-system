import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Log method and URL only; avoid logging headers, tokens or payloads
  console.debug(`API Request: ${config.method.toUpperCase()} ${config.url}`);
  return config;
});

// Log responses and errors
apiClient.interceptors.response.use(
  (response) => {
    // Avoid logging full response bodies which may contain sensitive data
    console.debug(`API Response: ${response.status}`);
    return response;
  },
  (error) => {
    // Log error summary without exposing response body contents
    console.error('API Error:', error.message || error);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data keys/type:', error.response.data && typeof error.response.data === 'object'
        ? Object.keys(error.response.data)
        : typeof error.response.data);
      if (typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE')) {
        console.error('CRITICAL: Backend returned HTML instead of JSON. Server may be down or wrong endpoint.');
      }
    } else if (error.request) {
      console.error('No response received. Network error or server unreachable');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
