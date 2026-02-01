/**
 * Authentication Hook
 * Manages user authentication state
 */

import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';
import { USER_ROLE } from '../constants';

/**
 * Hook for managing authentication state
 * @returns {Object} Auth state and methods
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Check if user is authenticated
   */
  const checkAuth = async () => {
    setLoading(true);
    try {
      // Check if token exists
      if (authAPI.isAuthenticated()) {
        const response = await authAPI.getCurrentUser();
        setUser(response.data);
      }
    } catch (err) {
      // Token invalid or expired
      authAPI.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login user
   * @param {string} email 
   * @param {string} password 
   */
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.login(email, password);
      setUser(response.data.user);
      return response.data.user;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register new user
   * @param {Object} userData 
   */
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.register(userData);
      return response;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = useCallback(() => {
    authAPI.logout();
    setUser(null);
    setError(null);
  }, []);

  /**
   * Change password
   * @param {string} currentPassword 
   * @param {string} newPassword 
   */
  const changePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.changePassword(currentPassword, newPassword);
      return response;
    } catch (err) {
      setError(err.message || 'Password change failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if user is admin
   * @returns {boolean}
   */
  const isAdmin = () => {
    return user?.role === USER_ROLE.ADMIN;
  };

  /**
   * Check if user is customer
   * @returns {boolean}
   */
  const isCustomer = () => {
    return user?.role === USER_ROLE.CUSTOMER;
  };

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: isAdmin(),
    isCustomer: isCustomer(),
    login,
    logout,
    register,
    changePassword,
    checkAuth,
    setError
  };
}
