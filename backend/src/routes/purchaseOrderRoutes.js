const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');
const { authenticate, adminOnly } = require('../middlewares/auth');
const { validateBody, validateParams } = require('../middlewares/validate');
const { 
    createPurchaseOrderSchema, 
    updateStatusSchema,
    uuidParamSchema 
} = require('../validations/schemas');

// All routes require admin authentication
router.use(authenticate, adminOnly);

router.get('/', purchaseOrderController.getOrders);
router.get('/:id', validateParams(uuidParamSchema), purchaseOrderController.getOrder);
router.get('/:id/download', validateParams(uuidParamSchema), purchaseOrderController.downloadOrder);
router.post('/', validateBody(createPurchaseOrderSchema), purchaseOrderController.createOrder);
router.put('/:id', validateParams(uuidParamSchema), validateBody(createPurchaseOrderSchema), purchaseOrderController.updateOrder);
router.patch('/:id/status', validateParams(uuidParamSchema), validateBody(updateStatusSchema), purchaseOrderController.updateStatus);

module.exports = router;
