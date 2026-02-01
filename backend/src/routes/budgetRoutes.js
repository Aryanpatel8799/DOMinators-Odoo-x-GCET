const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const { authenticate, adminOnly } = require('../middlewares/auth');
const { validateBody, validateParams } = require('../middlewares/validate');
const { 
    createBudgetSchema, 
    updateBudgetSchema, 
    uuidParamSchema 
} = require('../validations/schemas');

// All routes require admin authentication
router.use(authenticate, adminOnly);

// Report routes (must be before /:id route)
router.get('/report/vs-actual', budgetController.getBudgetVsActual);
router.get('/report/vs-actual/download', budgetController.downloadBudgetReport);
router.get('/report/dashboard', budgetController.getBudgetDashboard);
router.get('/report/achievement', budgetController.getBudgetAchievement);
router.get('/report/trend', budgetController.getBudgetTrend);
router.get('/report/cost-centers', budgetController.getCostCenterPerformance);

// Purchase order entries for analytical account (must be before /:id route)
router.get('/entries/:analyticalAccountId', budgetController.getPurchaseOrderEntries);

// Revision history (must be before /:id route)
router.get('/revisions/history', budgetController.getRevisionHistory);

// CRUD routes
router.get('/', budgetController.getBudgets);
router.get('/:id', validateParams(uuidParamSchema), budgetController.getBudget);
router.get('/:id/revisions', validateParams(uuidParamSchema), budgetController.getBudgetRevisions);
router.post('/', validateBody(createBudgetSchema), budgetController.createBudget);
router.put('/:id', validateParams(uuidParamSchema), validateBody(updateBudgetSchema), budgetController.updateBudget);
router.delete('/:id', validateParams(uuidParamSchema), budgetController.deleteBudget);

module.exports = router;
