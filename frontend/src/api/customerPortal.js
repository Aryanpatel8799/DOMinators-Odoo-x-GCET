/**
 * Customer Portal API Service
 * For authenticated customers to view their own invoices and orders
 */

import { api } from './client';

export const customerPortalAPI = {
  // ===== Dashboard =====

  /**
   * Get customer dashboard summary
   * @returns {Promise<Object>} Dashboard data
   */
  getDashboard: () => 
    api.get('/customer/dashboard'),

  // ===== Invoices =====

  /**
   * Get my invoices
   * @param {Object} params - { page, limit, status, payment_status }
   * @returns {Promise<Object>} { data: Invoice[], pagination }
   */
  getInvoices: (params = {}) => 
    api.get('/customer/invoices', params),

  /**
   * Get my invoice by ID
   * @param {string} id - Invoice UUID
   * @returns {Promise<Object>} Invoice with lines
   */
  getInvoiceById: (id) => 
    api.get(`/customer/invoices/${id}`),

  /**
   * Get payment status for my invoice
   * @param {string} id - Invoice UUID
   * @returns {Promise<Object>} Payment status details
   */
  getInvoicePaymentStatus: (id) =>
    api.get(`/customer/invoices/${id}/payment-status`),

  /**
   * Download my invoice as PDF
   * @param {string} id - Invoice UUID
   * @param {string} invoiceNumber - Invoice number for filename
   * @returns {Promise<void>} Downloads PDF file
   */
  downloadInvoice: (id, invoiceNumber) => 
    api.downloadFile(`/customer/invoices/${id}/download`, `${invoiceNumber}.pdf`),

  /**
   * Pay invoice (customer payment)
   * @param {string} id - Invoice UUID
   * @param {Object} paymentData - { amount, payment_date, payment_method, reference, notes }
   * @returns {Promise<Object>} Payment record
   */
  payInvoice: (id, paymentData) =>
    api.post(`/customer/invoices/${id}/pay`, paymentData),

  /**
   * Create Stripe checkout session for invoice payment
   * @param {string} id - Invoice UUID
   * @param {number} amount - Optional amount to pay (defaults to full remaining amount)
   * @returns {Promise<Object>} { sessionId, url }
   */
  createStripeCheckout: (id, amount = null) =>
    api.post(`/customer/invoices/${id}/create-checkout`, { amount }),

  /**
   * Verify Stripe payment after redirect
   * @param {string} id - Invoice UUID
   * @param {string} sessionId - Stripe checkout session ID
   * @returns {Promise<Object>} Payment verification result
   */
  verifyStripePayment: (id, sessionId) =>
    api.post(`/customer/invoices/${id}/verify-payment`, { session_id: sessionId }),

  // ===== Sales Orders =====

  /**
   * Get my sales orders
   * @param {Object} params - { page, limit, status }
   * @returns {Promise<Object>} { data: SalesOrder[], pagination }
   */
  getSalesOrders: (params = {}) => 
    api.get('/customer/sales-orders', params),

  /**
   * Get my sales order by ID
   * @param {string} id - Order UUID
   * @returns {Promise<Object>} Order with lines
   */
  getSalesOrderById: (id) => 
    api.get(`/customer/sales-orders/${id}`),

  /**
   * Download my sales order as PDF
   * @param {string} id - Order UUID
   * @param {string} orderNumber - Order number for filename
   * @returns {Promise<void>} Downloads PDF file
   */
  downloadSalesOrder: (id, orderNumber) => 
    api.downloadFile(`/customer/sales-orders/${id}/download`, `${orderNumber}.pdf`)
};
