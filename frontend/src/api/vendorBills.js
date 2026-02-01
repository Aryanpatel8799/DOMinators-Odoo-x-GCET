/**
 * Vendor Bill API Service
 */

import { api } from './client';

export const vendorBillAPI = {
  /**
   * List all vendor bills with optional filters
   * @param {Object} params - { page, limit, status, payment_status, vendor_id, from_date, to_date, overdue }
   * @returns {Promise<Object>} { data: Bill[], pagination }
   */
  getAll: (params = {}) => 
    api.get('/vendor-bills', params),

  /**
   * Get bill by ID with line items
   * @param {string} id - Bill UUID
   * @returns {Promise<Object>} Bill with lines
   */
  getById: (id) => 
    api.get(`/vendor-bills/${id}`),

  /**
   * Create new vendor bill
   * @param {Object} billData - { vendor_id, purchase_order_id, bill_number, bill_date, due_date, notes, lines: [{ product_id, quantity, unit_price, description }] }
   * @returns {Promise<Object>} Created bill
   */
  create: (billData) => 
    api.post('/vendor-bills', billData),

  /**
   * Update bill status
   * @param {string} id - Bill UUID
   * @param {string} status - DRAFT, POSTED, or CANCELLED
   * @returns {Promise<Object>} Updated bill
   */
  updateStatus: (id, status) => 
    api.patch(`/vendor-bills/${id}/status`, { status }),

  /**
   * Download bill as PDF
   * @param {string} id - Bill UUID
   * @param {string} billNumber - Bill number for filename
   * @returns {Promise<void>} Downloads PDF file
   */
  downloadPdf: (id, billNumber) => 
    api.downloadFile(`/vendor-bills/${id}/download`, `${billNumber}.pdf`),

  /**
   * Record payment for bill
   * @param {string} id - Bill UUID
   * @param {Object} paymentData - { amount, payment_date, payment_method, reference, notes }
   * @returns {Promise<Object>} Payment record
   */
  createPayment: (id, paymentData) =>
    api.post(`/vendor-bills/${id}/payments`, paymentData),

  /**
   * Get payment status for bill
   * @param {string} id - Bill UUID
   * @returns {Promise<Object>} Payment status details
   */
  getPaymentStatus: (id) =>
    api.get(`/vendor-bills/${id}/payment-status`),

  /**
   * Get all payments for admin dashboard
   * @param {Object} params - { page, limit }
   * @returns {Promise<Object[]>} List of all payments
   */
  getAllPayments: (params = {}) =>
    api.get('/vendor-bills/payments/all', params)
};
