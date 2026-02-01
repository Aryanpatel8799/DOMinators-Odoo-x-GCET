/**
 * Auto Analytical Model API Service
 * Handles automatic cost center assignment rules
 */

import { api } from './client';

export const autoAnalyticalModelAPI = {
  /**
   * List all auto analytical models (rules)
   * @param {Object} params - { page, limit }
   * @returns {Promise<Object>} { data: Model[], pagination }
   */
  getAll: (params = {}) => 
    api.get('/auto-analytical-models', params),

  /**
   * Get model by ID
   * @param {string} id - Model UUID
   * @returns {Promise<Object>} Model data
   */
  getById: (id) => 
    api.get(`/auto-analytical-models/${id}`),

  /**
   * Create new auto analytical model
   * @param {Object} modelData - Model configuration
   * @returns {Promise<Object>} Created model
   */
  create: (modelData) => 
    api.post('/auto-analytical-models', modelData),

  /**
   * Update model
   * @param {string} id - Model UUID
   * @param {Object} modelData - Model fields to update
   * @returns {Promise<Object>} Updated model
   */
  update: (id, modelData) => 
    api.put(`/auto-analytical-models/${id}`, modelData),

  /**
   * Delete model
   * @param {string} id - Model UUID
   * @returns {Promise<Object>} Success response
   */
  delete: (id) => 
    api.delete(`/auto-analytical-models/${id}`),

  /**
   * Resolve analytical account based on partner and product using auto rules
   * @param {string} partnerId - Partner (vendor/customer) UUID
   * @param {string} productId - Product UUID
   * @returns {Promise<Object>} { analyticalAccountId: string|null }
   */
  resolve: (partnerId, productId) =>
    api.post('/auto-analytical-models/resolve', { partnerId, productId })
};
