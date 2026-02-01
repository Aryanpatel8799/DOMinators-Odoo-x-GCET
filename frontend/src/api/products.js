/**
 * Product and Product Category API Services
 */

import { api } from './client';

export const productAPI = {
  /**
   * List all products with optional filters
   * @param {Object} params - { page, limit, category_id, search, is_active }
   * @returns {Promise<Object>} { data: Product[], pagination }
   */
  getAll: (params = {}) => 
    api.get('/products', params),

  /**
   * Get product by ID
   * @param {string} id - Product UUID
   * @returns {Promise<Object>} Product data
   */
  getById: (id) => 
    api.get(`/products/${id}`),

  /**
   * Create new product
   * @param {Object} productData - { name, sku, description, category_id, unit_price, cost_price, stock_quantity }
   * @returns {Promise<Object>} Created product
   */
  create: (productData) => 
    api.post('/products', productData),

  /**
   * Update product
   * @param {string} id - Product UUID
   * @param {Object} productData - Product fields to update
   * @returns {Promise<Object>} Updated product
   */
  update: (id, productData) => 
    api.put(`/products/${id}`, productData),

  /**
   * Delete product
   * @param {string} id - Product UUID
   * @returns {Promise<Object>} Success response
   */
  delete: (id) => 
    api.delete(`/products/${id}`)
};

export const productCategoryAPI = {
  /**
   * List all product categories
   * @param {Object} params - { page, limit }
   * @returns {Promise<Object>} { data: Category[], pagination }
   */
  getAll: (params = {}) => 
    api.get('/product-categories', params),

  /**
   * Get category by ID
   * @param {string} id - Category UUID
   * @returns {Promise<Object>} Category data
   */
  getById: (id) => 
    api.get(`/product-categories/${id}`),

  /**
   * Create new category
   * @param {Object} categoryData - { name, description }
   * @returns {Promise<Object>} Created category
   */
  create: (categoryData) => 
    api.post('/product-categories', categoryData),

  /**
   * Update category
   * @param {string} id - Category UUID
   * @param {Object} categoryData - Category fields to update
   * @returns {Promise<Object>} Updated category
   */
  update: (id, categoryData) => 
    api.put(`/product-categories/${id}`, categoryData),

  /**
   * Delete category
   * @param {string} id - Category UUID
   * @returns {Promise<Object>} Success response
   */
  delete: (id) => 
    api.delete(`/product-categories/${id}`)
};
