const express = require('express');
const router = express.Router();
const analyticalAccountController = require('../controllers/analyticalAccountController');
const { authenticate, adminOnly } = require('../middlewares/auth');
const { validateBody, validateParams } = require('../middlewares/validate');
const { 
    createAnalyticalAccountSchema, 
    updateAnalyticalAccountSchema, 
    uuidParamSchema 
} = require('../validations/schemas');

// All routes require admin authentication
router.use(authenticate, adminOnly);

router.get('/', analyticalAccountController.getAnalyticalAccounts);
router.get('/:id', validateParams(uuidParamSchema), analyticalAccountController.getAnalyticalAccount);
router.post('/', validateBody(createAnalyticalAccountSchema), analyticalAccountController.createAnalyticalAccount);
router.put('/:id', validateParams(uuidParamSchema), validateBody(updateAnalyticalAccountSchema), analyticalAccountController.updateAnalyticalAccount);
router.delete('/:id', validateParams(uuidParamSchema), analyticalAccountController.deleteAnalyticalAccount);

module.exports = router;
