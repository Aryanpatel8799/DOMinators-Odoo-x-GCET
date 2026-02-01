const { productRepository, productCategoryRepository } = require('../repositories/productRepository');
const dependencyService = require('../services/dependencyService');
const { asyncHandler, successResponse, createdResponse, paginatedResponse, noContentResponse } = require('../utils/responseHandler');
const { NotFoundError } = require('../utils/errors');
const { calculatePagination, buildPaginationMeta } = require('../utils/helpers');

// ==================== PRODUCTS ====================

/**
 * @route   GET /api/products
 * @desc    Get all products with filters and pagination
 * @access  Admin
 */
const getProducts = asyncHandler(async (req, res) => {
    const { page, limit, category_id, search, is_active } = req.query;
    const pagination = calculatePagination(page, limit);
    
    const filters = { 
        category_id, 
        search, 
        is_active: is_active !== undefined ? is_active === 'true' : undefined 
    };
    
    const [products, total] = await Promise.all([
        productRepository.findAll(filters, pagination),
        productRepository.count(filters),
    ]);
    
    const paginationMeta = buildPaginationMeta(total, pagination.page, pagination.limit);
    paginatedResponse(res, products, paginationMeta, 'Products fetched successfully');
});

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Admin
 */
const getProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await productRepository.findById(id);
    
    if (!product) {
        throw new NotFoundError('Product not found');
    }
    
    successResponse(res, product, 'Product fetched successfully');
});

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Admin
 */
const createProduct = asyncHandler(async (req, res) => {
    const product = await productRepository.create(req.body);
    createdResponse(res, product, 'Product created successfully');
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Admin
 */
const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const existing = await productRepository.findById(id);
    if (!existing) {
        throw new NotFoundError('Product not found');
    }
    
    const product = await productRepository.update(id, req.body);
    successResponse(res, product, 'Product updated successfully');
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product (TASK 9 - Safe Delete)
 * @access  Admin
 * 
 * Validates that product has no dependencies before deletion.
 * Returns 409 Conflict if product is referenced in any line items.
 */
const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const product = await productRepository.findById(id);
    if (!product) {
        throw new NotFoundError('Product not found');
    }
    
    // TASK 9: Check dependencies before delete
    await dependencyService.validateProductDeleteManual(id);
    
    await productRepository.delete(id);
    noContentResponse(res);
});

// ==================== PRODUCT CATEGORIES ====================

/**
 * @route   GET /api/product-categories
 * @desc    Get all product categories
 * @access  Admin
 */
const getCategories = asyncHandler(async (req, res) => {
    const categories = await productCategoryRepository.findAll();
    successResponse(res, categories, 'Categories fetched successfully');
});

/**
 * @route   GET /api/product-categories/:id
 * @desc    Get category by ID
 * @access  Admin
 */
const getCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const category = await productCategoryRepository.findById(id);
    
    if (!category) {
        throw new NotFoundError('Category not found');
    }
    
    successResponse(res, category, 'Category fetched successfully');
});

/**
 * @route   POST /api/product-categories
 * @desc    Create a new category
 * @access  Admin
 */
const createCategory = asyncHandler(async (req, res) => {
    const category = await productCategoryRepository.create(req.body);
    createdResponse(res, category, 'Category created successfully');
});

/**
 * @route   PUT /api/product-categories/:id
 * @desc    Update a category
 * @access  Admin
 */
const updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const existing = await productCategoryRepository.findById(id);
    if (!existing) {
        throw new NotFoundError('Category not found');
    }
    
    const category = await productCategoryRepository.update(id, req.body);
    successResponse(res, category, 'Category updated successfully');
});

/**
 * @route   DELETE /api/product-categories/:id
 * @desc    Delete a category (TASK 9 - Safe Delete)
 * @access  Admin
 * 
 * Validates that category has no dependencies before deletion.
 * Returns 409 Conflict if category is referenced by products.
 */
const deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const category = await productCategoryRepository.findById(id);
    if (!category) {
        throw new NotFoundError('Category not found');
    }
    
    // TASK 9: Check dependencies before delete
    await dependencyService.validateProductCategoryDeleteManual(id);
    
    await productCategoryRepository.delete(id);
    noContentResponse(res);
});

module.exports = {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
};
