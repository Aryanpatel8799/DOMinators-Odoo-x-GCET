const salesOrderRepository = require('../repositories/salesOrderRepository');
const salesOrderService = require('../services/salesOrderService');
const pdfService = require('../services/pdfService');
const { asyncHandler, successResponse, createdResponse, paginatedResponse } = require('../utils/responseHandler');
const { calculatePagination, buildPaginationMeta } = require('../utils/helpers');

/**
 * @route   GET /api/sales-orders
 * @desc    Get all sales orders with filters and pagination
 * @access  Admin
 */
const getOrders = asyncHandler(async (req, res) => {
    const { page, limit, customer_id, status, from_date, to_date } = req.query;
    const pagination = calculatePagination(page, limit);
    
    const filters = { customer_id, status, from_date, to_date };
    
    const [orders, total] = await Promise.all([
        salesOrderRepository.findAll(filters, pagination),
        salesOrderRepository.count(filters),
    ]);
    
    const paginationMeta = buildPaginationMeta(total, pagination.page, pagination.limit);
    paginatedResponse(res, orders, paginationMeta, 'Sales orders fetched successfully');
});

/**
 * @route   GET /api/sales-orders/:id
 * @desc    Get sales order by ID with lines
 * @access  Admin
 */
const getOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await salesOrderService.getOrderWithLines(id);
    successResponse(res, order, 'Sales order fetched successfully');
});

/**
 * @route   POST /api/sales-orders
 * @desc    Create a new sales order
 * @access  Admin
 */
const createOrder = asyncHandler(async (req, res) => {
    const { lines, ...orderData } = req.body;
    const order = await salesOrderService.createOrder(orderData, lines);
    createdResponse(res, order, 'Sales order created successfully');
});

/**
 * @route   PATCH /api/sales-orders/:id/status
 * @desc    Update sales order status
 * @access  Admin
 */
const updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const order = await salesOrderService.updateStatus(id, status);
    successResponse(res, order, 'Sales order status updated successfully');
});

/**
 * @route   GET /api/sales-orders/:id/download
 * @desc    Download sales order as PDF
 * @access  Admin
 */
const downloadOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await salesOrderService.getOrderWithLines(id);
    const pdfBuffer = await pdfService.generateSalesOrderPDF(order, order.lines);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=sales-order-${order.order_number}.pdf`);
    res.send(pdfBuffer);
});

module.exports = {
    getOrders,
    getOrder,
    createOrder,
    updateStatus,
    downloadOrder,
};
