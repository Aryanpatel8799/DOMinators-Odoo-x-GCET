const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { authenticate, vendorOnly } = require('../middlewares/auth');
const { validateParams } = require('../middlewares/validate');
const { uuidParamSchema } = require('../validations/schemas');

// All routes require vendor authentication
router.use(authenticate, vendorOnly);

// Dashboard
router.get('/dashboard', vendorController.getDashboard);

// Bills
router.get('/bills', vendorController.getMyBills);
router.get('/bills/:id', validateParams(uuidParamSchema), vendorController.getMyBill);
router.get('/bills/:id/download', validateParams(uuidParamSchema), vendorController.downloadBill);

// Purchase Orders
router.get('/purchase-orders', vendorController.getMyPurchaseOrders);
router.get('/purchase-orders/:id', validateParams(uuidParamSchema), vendorController.getMyPurchaseOrder);
router.get('/purchase-orders/:id/download', validateParams(uuidParamSchema), vendorController.downloadPurchaseOrder);

module.exports = router;
