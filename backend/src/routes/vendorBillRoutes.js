const express = require('express');
const router = express.Router();
const vendorBillController = require('../controllers/vendorBillController');
const { authenticate, adminOnly } = require('../middlewares/auth');
const { validateBody, validateParams } = require('../middlewares/validate');
const { 
    createVendorBillSchema, 
    updateStatusSchema,
    createPaymentSchema,
    uuidParamSchema 
} = require('../validations/schemas');

// All routes require admin authentication
router.use(authenticate, adminOnly);

// Get all bill payments (must be before :id routes)
router.get('/payments/all', vendorBillController.getAllPayments);

router.get('/', vendorBillController.getBills);
router.get('/:id', validateParams(uuidParamSchema), vendorBillController.getBill);
router.get('/:id/download', validateParams(uuidParamSchema), vendorBillController.downloadBill);
router.post('/', validateBody(createVendorBillSchema), vendorBillController.createBill);
router.patch('/:id/status', validateParams(uuidParamSchema), validateBody(updateStatusSchema), vendorBillController.updateStatus);
router.post('/:id/payments', validateParams(uuidParamSchema), validateBody(createPaymentSchema), vendorBillController.createPayment);
router.get('/:id/payment-status', validateParams(uuidParamSchema), vendorBillController.getPaymentStatus);

module.exports = router;
