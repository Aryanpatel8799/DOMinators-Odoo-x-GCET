const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate, customerOnly } = require('../middlewares/auth');
const { validateBody, validateParams } = require('../middlewares/validate');
const { createPaymentSchema, uuidParamSchema } = require('../validations/schemas');

// All routes require customer authentication
router.use(authenticate, customerOnly);

// Dashboard
router.get('/dashboard', customerController.getDashboard);

// Invoices
router.get('/invoices', customerController.getMyInvoices);
router.get('/invoices/:id', validateParams(uuidParamSchema), customerController.getMyInvoice);
router.get('/invoices/:id/payment-status', validateParams(uuidParamSchema), customerController.getInvoicePaymentStatus);
router.get('/invoices/:id/download', validateParams(uuidParamSchema), customerController.downloadInvoice);
router.post('/invoices/:id/pay', validateParams(uuidParamSchema), validateBody(createPaymentSchema), customerController.payInvoice);

// Stripe Payment Routes
router.post('/invoices/:id/create-checkout', validateParams(uuidParamSchema), customerController.createStripeCheckout);
router.post('/invoices/:id/verify-payment', validateParams(uuidParamSchema), customerController.verifyStripePayment);

// Sales Orders
router.get('/sales-orders', customerController.getMySalesOrders);
router.get('/sales-orders/:id', validateParams(uuidParamSchema), customerController.getMySalesOrder);
router.get('/sales-orders/:id/download', validateParams(uuidParamSchema), customerController.downloadSalesOrder);

module.exports = router;
