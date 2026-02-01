const purchaseOrderRepository = require('../repositories/purchaseOrderRepository');
const purchaseOrderService = require('../services/purchaseOrderService');
const pdfService = require('../services/pdfService');
const { asyncHandler, successResponse, createdResponse, paginatedResponse } = require('../utils/responseHandler');
const { NotFoundError } = require('../utils/errors');
const { calculatePagination, buildPaginationMeta } = require('../utils/helpers');

/**
 * @route   GET /api/purchase-orders
 * @desc    Get all purchase orders with filters and pagination
 * @access  Admin
 */
const getOrders = asyncHandler(async (req, res) => {
    const { page, limit, vendor_id, status, from_date, to_date } = req.query;
    const pagination = calculatePagination(page, limit);
    
    const filters = { vendor_id, status, from_date, to_date };
    
    const [orders, total] = await Promise.all([
        purchaseOrderRepository.findAll(filters, pagination),
        purchaseOrderRepository.count(filters),
    ]);
    
    const paginationMeta = buildPaginationMeta(total, pagination.page, pagination.limit);
    paginatedResponse(res, orders, paginationMeta, 'Purchase orders fetched successfully');
});

/**
 * @route   GET /api/purchase-orders/:id
 * @desc    Get purchase order by ID with lines
 * @access  Admin
 */
const getOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await purchaseOrderService.getOrderWithLines(id);
    successResponse(res, order, 'Purchase order fetched successfully');
});

/**
 * @route   POST /api/purchase-orders
 * @desc    Create a new purchase order
 * @access  Admin
 */
const createOrder = asyncHandler(async (req, res) => {
    const { lines, ...orderData } = req.body;
    const order = await purchaseOrderService.createOrder(orderData, lines);
    createdResponse(res, order, 'Purchase order created successfully');
});

/**
 * @route   PATCH /api/purchase-orders/:id/status
 * @desc    Update purchase order status
 * @access  Admin
 */
const updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const order = await purchaseOrderService.updateStatus(id, status);
    successResponse(res, order, 'Purchase order status updated successfully');
});

/**
 * @route   PUT /api/purchase-orders/:id
 * @desc    Update an existing purchase order
 * @access  Admin
 */
const updateOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { lines, ...orderData } = req.body;
    const order = await purchaseOrderService.updateOrder(id, orderData, lines);
    successResponse(res, order, 'Purchase order updated successfully');
});

/**
 * @route   GET /api/purchase-orders/:id/download
 * @desc    Download purchase order as PDF
 * @access  Admin
 */
const downloadOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await purchaseOrderService.getOrderWithLines(id);
    const pdfBuffer = await pdfService.generatePurchaseOrderPDF(order, order.lines);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=purchase-order-${order.order_number}.pdf`);
    res.send(pdfBuffer);
});

module.exports = {
    getOrders,
    getOrder,
    createOrder,
    updateOrder,
    updateStatus,
    downloadOrder,
};
