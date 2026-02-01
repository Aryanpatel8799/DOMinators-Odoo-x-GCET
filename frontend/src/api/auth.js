

import { api } from './client';

export const authAPI = {

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    debugger
    if (response.success && response.data) {
      api.setToken(response.data.token);
      api.setUser(response.data.user);
    }
    return response;
  },

  /**
   * Register new user (customer registration)
   * @param {Object} userData - { email, password, name, role }
   * @returns {Promise<Object>} Created user
   */
  register: (userData) => 
    api.post('/auth/register', userData),

  /**
   * Get all users (Admin only)
   * @returns {Promise<Object>} List of users
   */
  getUsers: () => 
    api.get('/auth/users'),

  /**
   * Update a user (Admin only)
   * @param {string} id - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise<Object>} Updated user
   */
  updateUser: (id, userData) => 
    api.put(`/auth/users/${id}`, userData),

  /**
   * Delete a user (Admin only)
   * @param {string} id - User ID
   * @returns {Promise<Object>} Success response
   */
  deleteUser: (id) => 
    api.delete(`/auth/users/${id}`),

  /**
   * Get current authenticated user profile
   * @returns {Promise<Object>} User data
   */
  getCurrentUser: () => 
    api.get('/auth/me'),

  /**
   * Change password for logged-in user
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Success response
   */
  changePassword: (currentPassword, newPassword) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),

  /**
   * Request password reset email
   * @param {string} email - User email
   * @returns {Promise<Object>} Success response
   */
  requestPasswordReset: (email) =>
    api.post('/auth/reset-password', { email }),

  /**
   * Set new password using reset token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise<Object>} Success response
   */
  setPassword: (token, password) =>
    api.post('/auth/set-password', { token, password, confirmPassword: password }),

  /**
   * Logout user (client-side only)
   * @returns {Promise<void>}
   */
  logout: () => {
    api.clearToken();
    return Promise.resolve();
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!api.token;
  },

  /**
   * Get stored user from localStorage
   * @returns {Object|null}
   */
  getStoredUser: () => {
    return api.getUser();
  }
};
