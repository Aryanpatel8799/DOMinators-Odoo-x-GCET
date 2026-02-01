const express = require('express');
const router = express.Router();
const salesOrderController = require('../controllers/salesOrderController');
const { authenticate, adminOnly } = require('../middlewares/auth');
const { validateBody, validateParams } = require('../middlewares/validate');
const { 
    createSalesOrderSchema, 
    updateStatusSchema,
    uuidParamSchema 
} = require('../validations/schemas');

// All routes require admin authentication
router.use(authenticate, adminOnly);

router.get('/', salesOrderController.getOrders);
router.get('/:id', validateParams(uuidParamSchema), salesOrderController.getOrder);
router.get('/:id/download', validateParams(uuidParamSchema), salesOrderController.downloadOrder);
router.post('/', validateBody(createSalesOrderSchema), salesOrderController.createOrder);
router.patch('/:id/status', validateParams(uuidParamSchema), validateBody(updateStatusSchema), salesOrderController.updateStatus);

module.exports = router;
