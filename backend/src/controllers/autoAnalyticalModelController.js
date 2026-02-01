const autoAnalyticalModelRepository = require('../repositories/autoAnalyticalModelRepository');
const autoAnalyticalService = require('../services/autoAnalyticalService');
const { asyncHandler, successResponse, createdResponse, paginatedResponse, noContentResponse } = require('../utils/responseHandler');
const { NotFoundError } = require('../utils/errors');
const { calculatePagination, buildPaginationMeta } = require('../utils/helpers');

/**
 * @route   GET /api/auto-analytical-models
 * @desc    Get all auto analytical models with filters and pagination
 * @access  Admin
 */
const getModels = asyncHandler(async (req, res) => {
    const { page, limit, is_active } = req.query;
    const pagination = calculatePagination(page, limit);
    
    const filters = { 
        is_active: is_active !== undefined ? is_active === 'true' : undefined 
    };
    
    const [models, total] = await Promise.all([
        autoAnalyticalModelRepository.findAll(filters, pagination),
        autoAnalyticalModelRepository.count(filters),
    ]);
    
    const paginationMeta = buildPaginationMeta(total, pagination.page, pagination.limit);
    paginatedResponse(res, models, paginationMeta, 'Auto analytical models fetched successfully');
});

/**
 * @route   GET /api/auto-analytical-models/:id
 * @desc    Get auto analytical model by ID
 * @access  Admin
 */
const getModel = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const model = await autoAnalyticalModelRepository.findById(id);
    
    if (!model) {
        throw new NotFoundError('Auto analytical model not found');
    }
    
    successResponse(res, model, 'Auto analytical model fetched successfully');
});

/**
 * @route   POST /api/auto-analytical-models
 * @desc    Create a new auto analytical model
 * @access  Admin
 */
const createModel = asyncHandler(async (req, res) => {
    const model = await autoAnalyticalModelRepository.create(req.body);
    const fullModel = await autoAnalyticalModelRepository.findById(model.id);
    createdResponse(res, fullModel, 'Auto analytical model created successfully');
});

/**
 * @route   PUT /api/auto-analytical-models/:id
 * @desc    Update an auto analytical model
 * @access  Admin
 */
const updateModel = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const existing = await autoAnalyticalModelRepository.findById(id);
    if (!existing) {
        throw new NotFoundError('Auto analytical model not found');
    }
    
    await autoAnalyticalModelRepository.update(id, req.body);
    const model = await autoAnalyticalModelRepository.findById(id);
    successResponse(res, model, 'Auto analytical model updated successfully');
});

/**
 * @route   DELETE /api/auto-analytical-models/:id
 * @desc    Delete an auto analytical model
 * @access  Admin
 */
const deleteModel = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const model = await autoAnalyticalModelRepository.delete(id);
    if (!model) {
        throw new NotFoundError('Auto analytical model not found');
    }
    
    noContentResponse(res);
});

/**
 * @route   POST /api/auto-analytical-models/resolve
 * @desc    Resolve analytical account based on context using auto analytical rules
 * @access  Admin
 */
const resolveAnalyticalAccount = asyncHandler(async (req, res) => {
    const { partnerId, productId } = req.body;
    
    console.log('[AutoAnalytical] Resolve request:', { partnerId, productId });
    
    if (!partnerId || !productId) {
        console.log('[AutoAnalytical] Missing partnerId or productId');
        return successResponse(res, { analyticalAccountId: null }, 'Missing partnerId or productId');
    }
    
    const analyticalAccountId = await autoAnalyticalService.assignAnalyticalAccountForLine(partnerId, productId);
    
    console.log('[AutoAnalytical] Resolved analyticalAccountId:', analyticalAccountId);
    
    successResponse(res, { analyticalAccountId }, 'Analytical account resolved successfully');
});

module.exports = {
    getModels,
    getModel,
    createModel,
    updateModel,
    deleteModel,
    resolveAnalyticalAccount,
};
