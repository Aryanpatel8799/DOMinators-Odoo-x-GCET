const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, adminOnly } = require('../middlewares/auth');
const { validateBody, validateParams } = require('../middlewares/validate');
const { 
    createProductSchema, 
    updateProductSchema, 
    createProductCategorySchema,
    updateProductCategorySchema,
    uuidParamSchema 
} = require('../validations/schemas');

// All routes require admin authentication
router.use(authenticate, adminOnly);

// Product routes
router.get('/', productController.getProducts);
router.get('/:id', validateParams(uuidParamSchema), productController.getProduct);
router.post('/', validateBody(createProductSchema), productController.createProduct);
router.put('/:id', validateParams(uuidParamSchema), validateBody(updateProductSchema), productController.updateProduct);
router.delete('/:id', validateParams(uuidParamSchema), productController.deleteProduct);

module.exports = router;
