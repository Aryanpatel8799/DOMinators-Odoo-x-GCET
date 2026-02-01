/**
 * Purchase Order API Service
 */

import { api } from './client';

export const purchaseOrderAPI = {
  /**
   * List all purchase orders with optional filters
   * @param {Object} params - { page, limit, status, vendor_id, from_date, to_date }
   * @returns {Promise<Object>} { data: PurchaseOrder[], pagination }
   */
  getAll: (params = {}) => 
    api.get('/purchase-orders', params),

  /**
   * Get purchase order by ID with line items
   * @param {string} id - Order UUID
   * @returns {Promise<Object>} Order with lines
   */
  getById: (id) => 
    api.get(`/purchase-orders/${id}`),

  /**
   * Create new purchase order
   * @param {Object} orderData - { vendor_id, order_date, expected_date, notes, lines: [{ product_id, quantity, unit_price }] }
   * @returns {Promise<Object>} Created order
   */
  create: (orderData) => 
    api.post('/purchase-orders', orderData),

  /**
   * Update existing purchase order
   * @param {string} id - Order UUID
   * @param {Object} orderData - Updated order data with lines
   * @returns {Promise<Object>} Updated order
   */
  update: (id, orderData) => 
    api.put(`/purchase-orders/${id}`, orderData),

  /**
   * Update purchase order status
   * @param {string} id - Order UUID
   * @param {string} status - DRAFT, POSTED, or CANCELLED
   * @returns {Promise<Object>} Updated order
   */
  updateStatus: (id, status) => 
    api.patch(`/purchase-orders/${id}/status`, { status }),

  /**
   * Download purchase order as PDF
   * @param {string} id - Order UUID
   * @param {string} orderNumber - Order number for filename
   * @returns {Promise<void>} Downloads PDF file
   */
  downloadPdf: (id, orderNumber) => 
    api.downloadFile(`/purchase-orders/${id}/download`, `${orderNumber}.pdf`)
};
