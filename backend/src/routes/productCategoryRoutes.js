const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, adminOnly } = require('../middlewares/auth');
const { validateBody, validateParams } = require('../middlewares/validate');
const { 
    createProductCategorySchema,
    updateProductCategorySchema,
    uuidParamSchema 
} = require('../validations/schemas');

// All routes require admin authentication
router.use(authenticate, adminOnly);

// Product Category routes
router.get('/', productController.getCategories);
router.get('/:id', validateParams(uuidParamSchema), productController.getCategory);
router.post('/', validateBody(createProductCategorySchema), productController.createCategory);
router.put('/:id', validateParams(uuidParamSchema), validateBody(updateProductCategorySchema), productController.updateCategory);
router.delete('/:id', validateParams(uuidParamSchema), productController.deleteCategory);

module.exports = router;
