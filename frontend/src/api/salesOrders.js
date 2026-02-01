/**
 * Sales Order API Service
 */

import { api } from './client';

export const salesOrderAPI = {
  /**
   * List all sales orders with optional filters
   * @param {Object} params - { page, limit, status, customer_id, from_date, to_date }
   * @returns {Promise<Object>} { data: SalesOrder[], pagination }
   */
  getAll: (params = {}) => 
    api.get('/sales-orders', params),

  /**
   * Get sales order by ID with line items
   * @param {string} id - Order UUID
   * @returns {Promise<Object>} Order with lines
   */
  getById: (id) => 
    api.get(`/sales-orders/${id}`),

  /**
   * Create new sales order
   * @param {Object} orderData - { customer_id, order_date, expected_date, notes, lines: [{ product_id, quantity, unit_price }] }
   * @returns {Promise<Object>} Created order
   */
  create: (orderData) => 
    api.post('/sales-orders', orderData),

  /**
   * Update existing sales order
   * @param {string} id - Order UUID
   * @param {Object} orderData - Order data to update
   * @returns {Promise<Object>} Updated order
   */
  update: (id, orderData) => 
    api.patch(`/sales-orders/${id}`, orderData),

  /**
   * Update sales order status
   * @param {string} id - Order UUID
   * @param {string} status - DRAFT, CONFIRMED, or CANCELLED
   * @returns {Promise<Object>} Updated order
   */
  updateStatus: (id, status) => 
    api.patch(`/sales-orders/${id}/status`, { status }),

  /**
   * Confirm sales order (changes status to CONFIRMED and auto-creates invoice)
   * @param {string} id - Order UUID
   * @returns {Promise<Object>} Updated order
   */
  confirm: (id) => 
    api.patch(`/sales-orders/${id}/status`, { status: 'CONFIRMED' }),

  /**
   * Cancel sales order
   * @param {string} id - Order UUID
   * @returns {Promise<Object>} Updated order
   */
  cancel: (id) => 
    api.patch(`/sales-orders/${id}/status`, { status: 'CANCELLED' }),

  /**
   * Download sales order as PDF
   * @param {string} id - Order UUID
   * @param {string} orderNumber - Order number for filename
   * @returns {Promise<void>} Downloads PDF file
   */
  downloadPdf: (id, orderNumber) => 
    api.downloadFile(`/sales-orders/${id}/download`, `${orderNumber}.pdf`)
};
