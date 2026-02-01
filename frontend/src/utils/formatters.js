/**
 * Utility functions for formatting data
 */

import { format, parseISO, isValid } from 'date-fns';
import { APP_CONFIG, DATE_FORMATS } from '../constants';

/**
 * Format currency amount
 * @param {number|string} amount - Amount to format
 * @param {string} currency - Currency code (default: INR)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = APP_CONFIG.CURRENCY) {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return `${APP_CONFIG.CURRENCY_SYMBOL}0.00`;
  }

  return new Intl.NumberFormat(APP_CONFIG.DATE_LOCALE, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount);
}

/**
 * Format number with commas (Indian numbering system)
 * @param {number|string} number - Number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(number) {
  const numValue = typeof number === 'string' ? parseFloat(number) : number;
  
  if (isNaN(numValue)) {
    return '0';
  }

  return new Intl.NumberFormat(APP_CONFIG.DATE_LOCALE).format(numValue);
}

/**
 * Format percentage
 * @param {number|string} value - Value to format
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted percentage string
 */
export function formatPercent(value, decimals = 2) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0%';
  }

  return `${numValue.toFixed(decimals)}%`;
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {string} formatStr - Format string (default: dd/MM/yyyy)
 * @returns {string} Formatted date string
 */
export function formatDate(date, formatStr = DATE_FORMATS.DISPLAY) {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '-';
    return format(dateObj, formatStr);
  } catch {
    return '-';
  }
}

/**
 * Format date for API (YYYY-MM-DD)
 * @param {Date} date - Date object
 * @returns {string} API formatted date string
 */
export function formatDateForApi(date) {
  if (!date || !isValid(date)) return '';
  return format(date, DATE_FORMATS.API);
}

/**
 * Format datetime for display
 * @param {string|Date} date - Datetime to format
 * @returns {string} Formatted datetime string
 */
export function formatDateTime(date) {
  return formatDate(date, DATE_FORMATS.DATETIME);
}

/**
 * Parse date string from API
 * @param {string} dateStr - Date string from API
 * @returns {Date|null} Date object or null
 */
export function parseDate(dateStr) {
  if (!dateStr) return null;
  try {
    const date = parseISO(dateStr);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
}

/**
 * Format phone number (Indian format)
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export function formatPhone(phone) {
  if (!phone) return '-';
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Format as Indian phone number
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  
  return phone;
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Format GST number
 * @param {string} gst - GST number
 * @returns {string} Formatted GST number
 */
export function formatGST(gst) {
  if (!gst) return '-';
  return gst.toUpperCase();
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {string|Date} date - Date to compare
 * @returns {string} Relative time string
 */
export function getRelativeTime(date) {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '-';
  
  const now = new Date();
  const diffMs = now - dateObj;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatDate(dateObj);
}
