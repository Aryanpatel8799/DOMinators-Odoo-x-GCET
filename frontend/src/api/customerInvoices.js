/**
 * Customer Invoice API Service
 */

import { api } from './client';

export const customerInvoiceAPI = {
  /**
   * List all customer invoices with optional filters
   * @param {Object} params - { page, limit, status, payment_status, customer_id, from_date, to_date, overdue }
   * @returns {Promise<Object>} { data: Invoice[], pagination }
   */
  getAll: (params = {}) => 
    api.get('/customer-invoices', params),

  /**
   * Get invoice by ID with line items
   * @param {string} id - Invoice UUID
   * @returns {Promise<Object>} Invoice with lines
   */
  getById: (id) => 
    api.get(`/customer-invoices/${id}`),

  /**
   * Create new customer invoice
   * @param {Object} invoiceData - { customer_id, sales_order_id, invoice_date, due_date, notes, lines: [{ product_id, quantity, unit_price, description }] }
   * @returns {Promise<Object>} Created invoice
   */
  create: (invoiceData) => 
    api.post('/customer-invoices', invoiceData),

  /**
   * Update invoice status
   * @param {string} id - Invoice UUID
   * @param {string} status - DRAFT, POSTED, or CANCELLED
   * @returns {Promise<Object>} Updated invoice
   */
  updateStatus: (id, status) => 
    api.patch(`/customer-invoices/${id}/status`, { status }),

  /**
   * Download invoice as PDF
   * @param {string} id - Invoice UUID
   * @param {string} invoiceNumber - Invoice number for filename
   * @returns {Promise<void>} Downloads PDF file
   */
  downloadPdf: (id, invoiceNumber) => 
    api.downloadFile(`/customer-invoices/${id}/download`, `${invoiceNumber}.pdf`),

  /**
   * Record payment for invoice
   * @param {string} id - Invoice UUID
   * @param {Object} paymentData - { amount, payment_date, payment_method, reference, notes }
   * @returns {Promise<Object>} Payment record
   */
  createPayment: (id, paymentData) =>
    api.post(`/customer-invoices/${id}/payments`, paymentData),

  /**
   * Get payment status for invoice
   * @param {string} id - Invoice UUID
   * @returns {Promise<Object>} Payment status details
   */
  getPaymentStatus: (id) =>
    api.get(`/customer-invoices/${id}/payment-status`),

  /**
   * Get all payments for admin dashboard
   * @param {Object} params - { page, limit }
   * @returns {Promise<Object[]>} List of all payments
   */
  getAllPayments: (params = {}) =>
    api.get('/customer-invoices/payments/all', params)
};
