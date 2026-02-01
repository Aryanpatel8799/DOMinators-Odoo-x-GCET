const express = require('express');
const router = express.Router();
const customerInvoiceController = require('../controllers/customerInvoiceController');
const { authenticate, adminOnly } = require('../middlewares/auth');
const { validateBody, validateParams } = require('../middlewares/validate');
const { 
    createCustomerInvoiceSchema, 
    updateStatusSchema,
    createPaymentSchema,
    uuidParamSchema 
} = require('../validations/schemas');

// All routes require admin authentication
router.use(authenticate, adminOnly);

// Get all invoice payments (must be before :id routes)
router.get('/payments/all', customerInvoiceController.getAllPayments);

router.get('/', customerInvoiceController.getInvoices);
router.get('/:id', validateParams(uuidParamSchema), customerInvoiceController.getInvoice);
router.get('/:id/download', validateParams(uuidParamSchema), customerInvoiceController.downloadInvoice);
router.post('/', validateBody(createCustomerInvoiceSchema), customerInvoiceController.createInvoice);
router.patch('/:id/status', validateParams(uuidParamSchema), validateBody(updateStatusSchema), customerInvoiceController.updateStatus);
router.post('/:id/payments', validateParams(uuidParamSchema), validateBody(createPaymentSchema), customerInvoiceController.createPayment);
router.get('/:id/payment-status', validateParams(uuidParamSchema), customerInvoiceController.getPaymentStatus);

module.exports = router;
