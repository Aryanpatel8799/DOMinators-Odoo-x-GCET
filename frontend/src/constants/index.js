/**
 * Application Constants and Enums
 * Matching backend constants from config/constants.js
 */

// ===== Document Status =====
export const DOCUMENT_STATUS = {
  DRAFT: 'DRAFT',
  POSTED: 'POSTED',
  CANCELLED: 'CANCELLED'
};

// ===== Payment Status =====
export const PAYMENT_STATUS = {
  NOT_PAID: 'NOT_PAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID'
};

// ===== Contact Type =====
export const CONTACT_TYPE = {
  CUSTOMER: 'CUSTOMER',
  VENDOR: 'VENDOR'
};

// ===== User Role =====
export const USER_ROLE = {
  ADMIN: 'ADMIN',
  CUSTOMER: 'CUSTOMER'
};

// ===== Budget Status =====
export const BUDGET_STATUS = {
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED'
};

// ===== Payment Methods =====
export const PAYMENT_METHOD = {
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CHECK: 'CHECK',
  UPI: 'UPI',
  CARD: 'CARD',
  NEFT: 'NEFT',
  RTGS: 'RTGS',
  CHEQUE: 'CHEQUE',
  CREDIT_CARD: 'CREDIT_CARD'
};

// ===== Status Colors for UI =====
export const STATUS_COLORS = {
  // Document Status
  DRAFT: 'bg-gray-100 text-gray-800',
  POSTED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  
  // Budget Status
  ACTIVE: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
  
  // Payment Status
  NOT_PAID: 'bg-red-100 text-red-800',
  PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800'
};

// ===== Status Labels =====
export const STATUS_LABELS = {
  // Document Status
  DRAFT: 'Draft',
  POSTED: 'Posted',
  CANCELLED: 'Cancelled',
  
  // Budget Status
  ACTIVE: 'Active',
  CLOSED: 'Closed',
  
  // Payment Status
  NOT_PAID: 'Not Paid',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid'
};

// ===== Payment Method Labels =====
export const PAYMENT_METHOD_LABELS = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CHECK: 'Check',
  UPI: 'UPI',
  CARD: 'Card',
  NEFT: 'NEFT',
  RTGS: 'RTGS',
  CHEQUE: 'Cheque',
  CREDIT_CARD: 'Credit Card'
};

// ===== Pagination Defaults =====
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

// ===== Application Settings from Environment =====
export const APP_CONFIG = {
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Shiv Furniture - Budget Accounting System',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  CURRENCY: import.meta.env.VITE_DEFAULT_CURRENCY || 'INR',
  CURRENCY_SYMBOL: import.meta.env.VITE_CURRENCY_SYMBOL || '₹',
  DATE_FORMAT: import.meta.env.VITE_DATE_FORMAT || 'dd/MM/yyyy',
  DATE_LOCALE: import.meta.env.VITE_DATE_LOCALE || 'en-IN'
};

// ===== Date Formatting Helpers =====
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  API: 'yyyy-MM-dd',
  DATETIME: 'dd/MM/yyyy HH:mm',
  TIME: 'HH:mm'
};

// ===== Contact Tags =====
export const CONTACT_TAGS = [
  'PREMIUM',
  'REGULAR',
  'NEW',
  'VIP'
];

// ===== Indian States =====
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh'
];
