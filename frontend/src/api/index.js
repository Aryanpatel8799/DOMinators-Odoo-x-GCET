/**
 * API Services Index
 * Central export for all API modules
 */

// Core API client
export { api } from './client';

// Authentication
export { authAPI } from './auth';

// Master Data
export { budgetAPI } from './budgets';
export { contactAPI } from './contacts';
export { productAPI, productCategoryAPI } from './products';
export { analyticalAccountAPI } from './analyticalAccounts';
export { autoAnalyticalModelAPI } from './autoAnalyticalModels';

// Transactions
export { salesOrderAPI } from './salesOrders';
export { purchaseOrderAPI } from './purchaseOrders';
export { customerInvoiceAPI } from './customerInvoices';
export { vendorBillAPI } from './vendorBills';

// Portals
export { customerPortalAPI } from './customerPortal';
export { vendorPortalAPI } from './vendorPortal';
