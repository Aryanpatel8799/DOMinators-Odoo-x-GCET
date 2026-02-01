const analyticalAccountRepository = require('../repositories/analyticalAccountRepository');
const { dependencyService } = require('../services');
const { asyncHandler, successResponse, createdResponse, paginatedResponse, noContentResponse } = require('../utils/responseHandler');
const { NotFoundError } = require('../utils/errors');
const { calculatePagination, buildPaginationMeta } = require('../utils/helpers');

/**
 * @route   GET /api/analytical-accounts
 * @desc    Get all analytical accounts with filters and pagination
 * @access  Admin
 */
const getAnalyticalAccounts = asyncHandler(async (req, res) => {
    const { page, limit, search, is_active } = req.query;
    const pagination = calculatePagination(page, limit);
    
    const filters = { 
        search, 
        is_active: is_active !== undefined ? is_active === 'true' : undefined 
    };
    
    const [accounts, total] = await Promise.all([
        analyticalAccountRepository.findAll(filters, pagination),
        analyticalAccountRepository.count(filters),
    ]);
    
    const paginationMeta = buildPaginationMeta(total, pagination.page, pagination.limit);
    paginatedResponse(res, accounts, paginationMeta, 'Analytical accounts fetched successfully');
});

/**
 * @route   GET /api/analytical-accounts/:id
 * @desc    Get analytical account by ID
 * @access  Admin
 */
const getAnalyticalAccount = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const account = await analyticalAccountRepository.findById(id);
    
    if (!account) {
        throw new NotFoundError('Analytical account not found');
    }
    
    successResponse(res, account, 'Analytical account fetched successfully');
});

/**
 * @route   POST /api/analytical-accounts
 * @desc    Create a new analytical account
 * @access  Admin
 */
const createAnalyticalAccount = asyncHandler(async (req, res) => {
    const account = await analyticalAccountRepository.create(req.body);
    createdResponse(res, account, 'Analytical account created successfully');
});

/**
 * @route   PUT /api/analytical-accounts/:id
 * @desc    Update an analytical account
 * @access  Admin
 */
const updateAnalyticalAccount = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const existing = await analyticalAccountRepository.findById(id);
    if (!existing) {
        throw new NotFoundError('Analytical account not found');
    }
    
    const account = await analyticalAccountRepository.update(id, req.body);
    successResponse(res, account, 'Analytical account updated successfully');
});

/**
 * @route   DELETE /api/analytical-accounts/:id
 * @desc    Delete an analytical account
 * @access  Admin
 */
const deleteAnalyticalAccount = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const account = await analyticalAccountRepository.findById(id);
    if (!account) {
        throw new NotFoundError('Analytical account not found');
    }

    // TASK 9: Safe delete - check for dependencies before deletion
    await dependencyService.validateAnalyticalAccountDeleteManual(id);

    await analyticalAccountRepository.delete(id);
    noContentResponse(res);
});

module.exports = {
    getAnalyticalAccounts,
    getAnalyticalAccount,
    createAnalyticalAccount,
    updateAnalyticalAccount,
    deleteAnalyticalAccount,
};
