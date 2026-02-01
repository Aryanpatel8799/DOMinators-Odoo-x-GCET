const budgetRepository = require('../repositories/budgetRepository');
const { budgetService } = require('../services');
const pdfService = require('../services/pdfService');
const { asyncHandler, successResponse, createdResponse, paginatedResponse, noContentResponse } = require('../utils/responseHandler');
const { NotFoundError } = require('../utils/errors');
const { calculatePagination, buildPaginationMeta } = require('../utils/helpers');

/**
 * @route   GET /api/budgets
 * @desc    Get all budgets with filters and pagination
 * @access  Admin
 */
const getBudgets = asyncHandler(async (req, res) => {
    const { page, limit, analytical_account_id, period_start, period_end } = req.query;
    const pagination = calculatePagination(page, limit);
    
    const filters = { analytical_account_id, period_start, period_end };
    
    const [budgets, total] = await Promise.all([
        budgetRepository.findAll(filters, pagination),
        budgetRepository.count(filters),
    ]);
    
    const paginationMeta = buildPaginationMeta(total, pagination.page, pagination.limit);
    paginatedResponse(res, budgets, paginationMeta, 'Budgets fetched successfully');
});

/**
 * @route   GET /api/budgets/:id
 * @desc    Get budget by ID
 * @access  Admin
 */
const getBudget = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const budget = await budgetRepository.findById(id);
    
    if (!budget) {
        throw new NotFoundError('Budget not found');
    }
    
    successResponse(res, budget, 'Budget fetched successfully');
});

/**
 * @route   POST /api/budgets
 * @desc    Create a new budget
 * @access  Admin
 */
const createBudget = asyncHandler(async (req, res) => {
    // TASK 4: Use budgetService which validates period overlap
    const budget = await budgetService.create(req.body);
    createdResponse(res, budget, 'Budget created successfully');
});

/**
 * @route   PUT /api/budgets/:id
 * @desc    Update a budget (with revision tracking)
 * @access  Admin
 */
const updateBudget = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason, ...updates } = req.body;
    
    const existing = await budgetRepository.findById(id);
    if (!existing) {
        throw new NotFoundError('Budget not found');
    }
    
    // TASK 4: Use budgetService which validates period overlap on period changes
    // Also tracks revisions when budget_amount changes
    const budget = await budgetService.update(id, updates, req.user?.id, reason);
    successResponse(res, budget, 'Budget updated successfully');
});

/**
 * @route   DELETE /api/budgets/:id
 * @desc    Delete a budget
 * @access  Admin
 */
const deleteBudget = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const budget = await budgetRepository.delete(id);
    if (!budget) {
        throw new NotFoundError('Budget not found');
    }
    
    noContentResponse(res);
});

/**
 * @route   GET /api/budgets/report/vs-actual
 * @desc    Get Budget vs Actual report
 * @access  Admin
 */
const getBudgetVsActual = asyncHandler(async (req, res) => {
    const { analytical_account_id, period_start, period_end } = req.query;
    
    const filters = { analytical_account_id, period_start, period_end };
    const report = await budgetRepository.getBudgetVsActual(filters);
    
    // Calculate summary totals
    const summary = report.reduce((acc, row) => {
        acc.total_budget += parseFloat(row.budget_amount) || 0;
        acc.total_expense += parseFloat(row.actual_expense) || 0;
        acc.total_revenue += parseFloat(row.actual_revenue) || 0;
        acc.total_net_actual += parseFloat(row.net_actual) || 0;
        acc.total_remaining += parseFloat(row.remaining_amount) || 0;
        return acc;
    }, {
        total_budget: 0,
        total_expense: 0,
        total_revenue: 0,
        total_net_actual: 0,
        total_remaining: 0,
    });
    
    // Calculate overall utilization
    summary.overall_utilization = summary.total_budget > 0 
        ? ((summary.total_net_actual / summary.total_budget) * 100).toFixed(2)
        : 0;
    
    successResponse(res, { report, summary }, 'Budget vs Actual report fetched successfully');
});

/**
 * @route   GET /api/budgets/:id/revisions
 * @desc    Get budget revision history
 * @access  Admin
 */
const getBudgetRevisions = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const revisions = await budgetService.getRevisions(id);
    successResponse(res, revisions, 'Budget revisions fetched successfully');
});

/**
 * @route   GET /api/budgets/revisions/history
 * @desc    Get all revision history with filters
 * @access  Admin
 */
const getRevisionHistory = asyncHandler(async (req, res) => {
    const { page, limit, analytical_account_id, from_date, to_date } = req.query;
    const pagination = calculatePagination(page, limit);
    
    const filters = { analytical_account_id, from_date, to_date };
    
    const revisions = await budgetService.getRevisionHistory(filters, pagination);
    successResponse(res, revisions, 'Revision history fetched successfully');
});

/**
 * @route   GET /api/budgets/report/dashboard
 * @desc    Get comprehensive budget dashboard data
 * @access  Admin
 */
const getBudgetDashboard = asyncHandler(async (req, res) => {
    const { period_start, period_end, year } = req.query;
    const dashboard = await budgetService.getBudgetDashboard({ period_start, period_end, year });
    successResponse(res, dashboard, 'Budget dashboard fetched successfully');
});

/**
 * @route   GET /api/budgets/report/achievement
 * @desc    Get budget achievement summary (for charts)
 * @access  Admin
 */
const getBudgetAchievement = asyncHandler(async (req, res) => {
    const { analytical_account_id, year } = req.query;
    const achievement = await budgetService.getBudgetAchievementSummary({ analytical_account_id, year });
    successResponse(res, achievement, 'Budget achievement data fetched successfully');
});

/**
 * @route   GET /api/budgets/report/trend
 * @desc    Get budget trend data (for line charts)
 * @access  Admin
 */
const getBudgetTrend = asyncHandler(async (req, res) => {
    const { year, months } = req.query;
    const trend = await budgetService.getBudgetTrend({ year, months: parseInt(months) || 12 });
    successResponse(res, trend, 'Budget trend data fetched successfully');
});

/**
 * @route   GET /api/budgets/report/cost-centers
 * @desc    Get cost center performance data
 * @access  Admin
 */
const getCostCenterPerformance = asyncHandler(async (req, res) => {
    const { analytical_account_id } = req.query;
    const performance = await budgetService.getCostCenterPerformance({ analytical_account_id });
    successResponse(res, performance, 'Cost center performance fetched successfully');
});

/**
 * @route   GET /api/budgets/report/vs-actual/download
 * @desc    Download Budget vs Actual report as PDF
 * @access  Admin
 */
const downloadBudgetReport = asyncHandler(async (req, res) => {
    const { analytical_account_id, period_start, period_end } = req.query;
    
    const filters = { analytical_account_id, period_start, period_end };
    const report = await budgetRepository.getBudgetVsActual(filters);
    
    // Calculate summary
    const summary = report.reduce((acc, row) => {
        acc.total_budget += parseFloat(row.budget_amount) || 0;
        acc.total_expense += parseFloat(row.actual_expense) || 0;
        acc.total_revenue += parseFloat(row.actual_revenue) || 0;
        acc.total_net_actual += parseFloat(row.net_actual) || 0;
        acc.total_remaining += parseFloat(row.remaining_amount) || 0;
        return acc;
    }, {
        total_budget: 0,
        total_expense: 0,
        total_revenue: 0,
        total_net_actual: 0,
        total_remaining: 0,
    });
    
    summary.overall_utilization = summary.total_budget > 0 
        ? ((summary.total_net_actual / summary.total_budget) * 100).toFixed(2)
        : 0;
    
    const pdfBuffer = await pdfService.generateBudgetReportPDF(report, summary, filters);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=budget-report-${new Date().toISOString().split('T')[0]}.pdf`);
    res.send(pdfBuffer);
});

/**
 * @route   GET /api/budgets/entries/:analyticalAccountId
 * @desc    Get purchase order entries for a specific analytical account
 * @access  Admin
 */
const getPurchaseOrderEntries = asyncHandler(async (req, res) => {
    const { analyticalAccountId } = req.params;
    const entries = await budgetRepository.getPurchaseOrderEntries(analyticalAccountId);
    successResponse(res, entries, 'Purchase order entries fetched successfully');
});

module.exports = {
    getBudgets,
    getBudget,
    createBudget,
    updateBudget,
    deleteBudget,
    getBudgetVsActual,
    getBudgetRevisions,
    getRevisionHistory,
    getBudgetDashboard,
    getBudgetAchievement,
    getBudgetTrend,
    getCostCenterPerformance,
    downloadBudgetReport,
    getPurchaseOrderEntries,
};
