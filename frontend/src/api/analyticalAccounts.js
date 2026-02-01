import { api } from './client';

export const analyticalAccountAPI = {
  /**
   * List all analytical accounts (cost centers)
   * @param {Object} params - { page, limit }
   * @returns {Promise<Object>} { data: AnalyticalAccount[], pagination }
   */
  getAll: (params = {}) => 
    api.get('/analytical-accounts', params),

  /**
   * Get analytical account by ID
   * @param {string} id - Account UUID
   * @returns {Promise<Object>} Account data
   */
  getById: (id) => 
    api.get(`/analytical-accounts/${id}`),

  /**
   * Create new analytical account
   * @param {Object} accountData - { code, name, description }
   * @returns {Promise<Object>} Created account
   */
  create: (accountData) => 
    api.post('/analytical-accounts', accountData),

  /**
   * Update analytical account
   * @param {string} id - Account UUID
   * @param {Object} accountData - Account fields to update
   * @returns {Promise<Object>} Updated account
   */
  update: (id, accountData) => 
    api.put(`/analytical-accounts/${id}`, accountData),

  /**
   * Delete analytical account
   * @param {string} id - Account UUID
   * @returns {Promise<Object>} Success response
   */
  delete: (id) => 
    api.delete(`/analytical-accounts/${id}`)
};
