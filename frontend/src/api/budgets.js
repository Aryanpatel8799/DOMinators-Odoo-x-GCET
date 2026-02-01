/**
 * Budget API Service
 * Handles budget CRUD, revisions, and reports
 */

import { api } from './client';

export const budgetAPI = {
  /**
   * List all budgets with optional filters
   * @param {Object} params - { page, limit, fiscal_year, status, analytical_account_id }
   * @returns {Promise<Object>} { data: Budget[], pagination }
   */
  getAll: (params = {}) => 
    api.get('/budgets', params),

  /**
   * Get single budget by ID
   * @param {string} id - Budget UUID
   * @returns {Promise<Object>} Budget data
   */
  getById: (id) => 
    api.get(`/budgets/${id}`),

  /**
   * Create new budget
   * @param {Object} budgetData - { name, fiscal_year, period_start, period_end, amount, analytical_account_id }
   * @returns {Promise<Object>} Created budget
   */
  create: (budgetData) => 
    api.post('/budgets', budgetData),

  /**
   * Update budget (creates revision if amount changes)
   * @param {string} id - Budget UUID
   * @param {Object} budgetData - { amount, reason, name, status }
   * @returns {Promise<Object>} Updated budget
   */
  update: (id, budgetData) => 
    api.put(`/budgets/${id}`, budgetData),

  /**
   * Delete budget
   * @param {string} id - Budget UUID
   * @returns {Promise<Object>} Success response
   */
  delete: (id) => 
    api.delete(`/budgets/${id}`),

  /**
   * Get revisions for a specific budget
   * @param {string} id - Budget UUID
   * @returns {Promise<Object>} { data: BudgetRevision[] }
   */
  getRevisions: (id) => 
    api.get(`/budgets/${id}/revisions`),

  /**
   * Get all revision history across budgets
   * @returns {Promise<Object>} { data: BudgetRevision[] }
   */
  getAllRevisions: () => 
    api.get('/budgets/revisions/history'),

  // ===== Report Endpoints =====

  /**
   * Get budget vs actual report
   * @param {Object} params - { fiscal_year, analytical_account_id }
   * @returns {Promise<Object>} Report data
   */
  getVsActualReport: (params = {}) => 
    api.get('/budgets/report/vs-actual', params),

  /**
   * Download budget vs actual report as PDF
   * @returns {Promise<void>} Downloads PDF file
   */
  downloadVsActualReport: () => 
    api.downloadFile('/budgets/report/vs-actual/download', 'budget-vs-actual.pdf'),

  /**
   * Get budget dashboard summary
   * @returns {Promise<Object>} { summary, by_status, top_utilized }
   */
  getDashboard: () => 
    api.get('/budgets/report/dashboard'),

  /**
   * Get budget achievement report
   * @param {number} year - Fiscal year
   * @returns {Promise<Object>} Achievement data
   */
  getAchievement: (year) => 
    api.get('/budgets/report/achievement', { year }),

  /**
   * Get budget trend analysis
   * @param {number} year - Fiscal year
   * @returns {Promise<Object>} Monthly trend data
   */
  getTrend: (year) => 
    api.get('/budgets/report/trend', { year }),

  /**
   * Get cost center performance report
   * @returns {Promise<Object>} Cost center performance data
   */
  getCostCenterReport: () => 
    api.get('/budgets/report/cost-centers'),

  /**
   * Get purchase order entries for a specific analytical account
   * @param {string} analyticalAccountId - Analytical Account UUID
   * @returns {Promise<Object>} { data: PurchaseOrderEntry[] }
   */
  getPurchaseOrderEntries: (analyticalAccountId) => 
    api.get(`/budgets/entries/${analyticalAccountId}`)
};
