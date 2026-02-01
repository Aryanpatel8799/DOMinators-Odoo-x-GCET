/**
 * API Client for Shiv Furniture Backend
 * Handles all HTTP requests with authentication and error handling
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || 'budget_auth_token';
const USER_KEY = import.meta.env.VITE_AUTH_USER_KEY || 'budget_user';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE;
    this.token = localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Set authentication token
   * @param {string} token - JWT token
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }

  /**
   * Clear authentication token and user data
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /**
   * Store user data in localStorage
   * @param {Object} user - User object
   */
  setUser(user) {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }

  /**
   * Get stored user data
   * @returns {Object|null} User object or null
   */
  getUser() {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Get headers for API requests
   * @param {string|null} contentType - Content type header
   * @returns {Object} Headers object
   */
  getHeaders(contentType = 'application/json') {
    const headers = {};
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  /**
   * Make an API request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Response data
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(options.contentType),
        ...options.headers
      }
    };

    // Remove contentType from config as it's handled in headers
    delete config.contentType;

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized - session expired
      if (response.status === 401) {
        this.clearToken();
        window.location.href = '/';
        throw new Error('Session expired. Please login again.');
      }

      // Try to parse JSON response
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // For non-JSON responses (like PDF downloads), return the response
        return response;
      }

      if (!response.ok) {
        const errorMessage = data.message || `HTTP ${response.status}: ${response.statusText}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      // Network or parsing errors
      if (!error.status) {
        console.error('API Request Error:', error);
      }
      throw error;
    }
  }

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Response data
   */
  async get(endpoint, params = {}) {
    // Filter out undefined/null values
    const filteredParams = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const queryString = new URLSearchParams(filteredParams).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body
   * @returns {Promise<Object>} Response data
   */
  async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body
   * @returns {Promise<Object>} Response data
   */
  async put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  /**
   * PATCH request
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body
   * @returns {Promise<Object>} Response data
   */
  async patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<Object>} Response data
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  /**
   * Download file from API
   * @param {string} endpoint - API endpoint
   * @param {string} filename - Downloaded file name
   */
  async downloadFile(endpoint, filename) {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      headers: this.getHeaders(null)
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  }
}

// Export singleton instance
export const api = new ApiClient();
