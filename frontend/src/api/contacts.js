/**
 * Contact API Service
 * Handles customer and vendor contacts
 */

import { api } from './client';

export const contactAPI = {
  /**
   * List all contacts with optional filters
   * @param {Object} params - { page, limit, type, search, tag }
   * @returns {Promise<Object>} { data: Contact[], pagination }
   */
  getAll: (params = {}) => 
    api.get('/contacts', params),

  /**
   * Get contact by ID
   * @param {string} id - Contact UUID
   * @returns {Promise<Object>} Contact data
   */
  getById: (id) => 
    api.get(`/contacts/${id}`),

  /**
   * Create new contact
   * @param {Object} contactData - { name, contact_type, email, phone, address, city, state, pincode, gst_number, tag }
   * @returns {Promise<Object>} Created contact
   */
  create: (contactData) => 
    api.post('/contacts', contactData),

  /**
   * Update contact
   * @param {string} id - Contact UUID
   * @param {Object} contactData - Contact fields to update
   * @returns {Promise<Object>} Updated contact
   */
  update: (id, contactData) => 
    api.put(`/contacts/${id}`, contactData),

  /**
   * Delete contact
   * @param {string} id - Contact UUID
   * @returns {Promise<Object>} Success response
   */
  delete: (id) => 
    api.delete(`/contacts/${id}`),

  /**
   * Get vendors only
   * @param {Object} params - Additional filters
   * @returns {Promise<Object>} { data: Contact[] }
   */
  getVendors: (params = {}) => 
    api.get('/contacts', { ...params, contact_type: 'VENDOR' }),

  /**
   * Get customers only
   * @param {Object} params - Additional filters
   * @returns {Promise<Object>} { data: Contact[] }
   */
  getCustomers: (params = {}) => 
    api.get('/contacts', { ...params, contact_type: 'CUSTOMER' })
};
