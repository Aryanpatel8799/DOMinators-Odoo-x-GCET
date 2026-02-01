/**
 * Vendor Portal API Service
 * For authenticated vendors to view their own bills and purchase orders
 */

import { api } from './client';

export const vendorPortalAPI = {
  // ===== Dashboard =====

  /**
   * Get vendor dashboard summary
   * @returns {Promise<Object>} { summary, recent_bills, recent_purchase_orders }
   */
  getDashboard: () => 
    api.get('/vendor/dashboard'),

  // ===== Bills =====

  /**
   * Get my bills
   * @param {Object} params - { page, limit, status, payment_status }
   * @returns {Promise<Object>} { data: Bill[], pagination }
   */
  getBills: (params = {}) => 
    api.get('/vendor/bills', params),

  /**
   * Get my bill by ID
   * @param {string} id - Bill UUID
   * @returns {Promise<Object>} Bill with lines
   */
  getBillById: (id) => 
    api.get(`/vendor/bills/${id}`),

  /**
   * Download my bill as PDF
   * @param {string} id - Bill UUID
   * @param {string} billNumber - Bill number for filename
   * @returns {Promise<void>} Downloads PDF file
   */
  downloadBill: (id, billNumber) => 
    api.downloadFile(`/vendor/bills/${id}/download`, `${billNumber}.pdf`),

  // ===== Purchase Orders =====

  /**
   * Get my purchase orders
   * @param {Object} params - { page, limit, status }
   * @returns {Promise<Object>} { data: PurchaseOrder[], pagination }
   */
  getPurchaseOrders: (params = {}) => 
    api.get('/vendor/purchase-orders', params),

  /**
   * Get my purchase order by ID
   * @param {string} id - Order UUID
   * @returns {Promise<Object>} Order with lines
   */
  getPurchaseOrderById: (id) => 
    api.get(`/vendor/purchase-orders/${id}`),

  /**
   * Download my purchase order as PDF
   * @param {string} id - Order UUID
   * @param {string} orderNumber - Order number for filename
   * @returns {Promise<void>} Downloads PDF file
   */
  downloadPurchaseOrder: (id, orderNumber) => 
    api.downloadFile(`/vendor/purchase-orders/${id}/download`, `${orderNumber}.pdf`)
};
