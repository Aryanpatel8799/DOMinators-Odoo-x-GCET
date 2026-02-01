const vendorBillRepository = require('../repositories/vendorBillRepository');
const vendorBillService = require('../services/vendorBillService');
const paymentService = require('../services/paymentService');
const paymentRepository = require('../repositories/paymentRepository');
const pdfService = require('../services/pdfService');
const { asyncHandler, successResponse, createdResponse, paginatedResponse } = require('../utils/responseHandler');
const { calculatePagination, buildPaginationMeta } = require('../utils/helpers');

/**
 * @route   GET /api/vendor-bills
 * @desc    Get all vendor bills with filters and pagination
 * @access  Admin
 */
const getBills = asyncHandler(async (req, res) => {
    const { page, limit, vendor_id, status, payment_status, from_date, to_date } = req.query;
    const pagination = calculatePagination(page, limit);
    
    const filters = { vendor_id, status, payment_status, from_date, to_date };
    
    const [bills, total] = await Promise.all([
        vendorBillRepository.findAll(filters, pagination),
        vendorBillRepository.count(filters),
    ]);
    
    const paginationMeta = buildPaginationMeta(total, pagination.page, pagination.limit);
    paginatedResponse(res, bills, paginationMeta, 'Vendor bills fetched successfully');
});

/**
 * @route   GET /api/vendor-bills/:id
 * @desc    Get vendor bill by ID with lines
 * @access  Admin
 */
const getBill = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const bill = await vendorBillService.getBillWithLines(id);
    successResponse(res, bill, 'Vendor bill fetched successfully');
});

/**
 * @route   POST /api/vendor-bills
 * @desc    Create a new vendor bill
 * @access  Admin
 */
const createBill = asyncHandler(async (req, res) => {
    const { lines, ...billData } = req.body;
    const bill = await vendorBillService.createBill(billData, lines);
    createdResponse(res, bill, 'Vendor bill created successfully');
});

/**
 * @route   PATCH /api/vendor-bills/:id/status
 * @desc    Update vendor bill status
 * @access  Admin
 */
const updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const bill = await vendorBillService.updateStatus(id, status);
    successResponse(res, bill, 'Vendor bill status updated successfully');
});

/**
 * @route   POST /api/vendor-bills/:id/payments
 * @desc    Record a payment for vendor bill
 * @access  Admin
 */
const createPayment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await paymentService.createBillPayment(id, req.body);
    createdResponse(res, result, 'Payment recorded successfully');
});

/**
 * @route   GET /api/vendor-bills/:id/payment-status
 * @desc    Get payment status for vendor bill
 * @access  Admin
 */
const getPaymentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const status = await paymentService.getBillPaymentStatus(id);
    successResponse(res, status, 'Payment status fetched successfully');
});

/**
 * @route   GET /api/vendor-bills/:id/download
 * @desc    Download vendor bill as PDF
 * @access  Admin
 */
const downloadBill = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const bill = await vendorBillService.getBillWithLines(id);
    const pdfBuffer = await pdfService.generateBillPDF(bill, bill.lines);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bill-${bill.bill_number}.pdf`);
    res.send(pdfBuffer);
});

/**
 * @route   GET /api/vendor-bills/payments/all
 * @desc    Get all bill payments (for admin)
 * @access  Admin
 */
const getAllPayments = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const pagination = calculatePagination(page, limit);
    
    const payments = await paymentRepository.findAllBillPayments(pagination);
    successResponse(res, payments, 'Bill payments fetched successfully');
});

module.exports = {
    getBills,
    getBill,
    createBill,
    updateStatus,
    createPayment,
    getPaymentStatus,
    downloadBill,
    getAllPayments,
};
