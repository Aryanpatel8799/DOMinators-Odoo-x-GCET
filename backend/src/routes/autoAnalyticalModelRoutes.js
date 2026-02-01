const express = require('express');
const router = express.Router();
const autoAnalyticalModelController = require('../controllers/autoAnalyticalModelController');
const { authenticate, adminOnly } = require('../middlewares/auth');
const { validateBody, validateParams } = require('../middlewares/validate');
const { 
    createAutoAnalyticalModelSchema, 
    updateAutoAnalyticalModelSchema, 
    uuidParamSchema 
} = require('../validations/schemas');

// All routes require admin authentication
router.use(authenticate, adminOnly);

router.get('/', autoAnalyticalModelController.getModels);
router.post('/resolve', autoAnalyticalModelController.resolveAnalyticalAccount);
router.get('/:id', validateParams(uuidParamSchema), autoAnalyticalModelController.getModel);
router.post('/', validateBody(createAutoAnalyticalModelSchema), autoAnalyticalModelController.createModel);
router.put('/:id', validateParams(uuidParamSchema), validateBody(updateAutoAnalyticalModelSchema), autoAnalyticalModelController.updateModel);
router.delete('/:id', validateParams(uuidParamSchema), autoAnalyticalModelController.deleteModel);

module.exports = router;
