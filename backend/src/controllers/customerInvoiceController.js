const customerInvoiceRepository = require('../repositories/customerInvoiceRepository');
const customerInvoiceService = require('../services/customerInvoiceService');
const paymentService = require('../services/paymentService');
const paymentRepository = require('../repositories/paymentRepository');
const pdfService = require('../services/pdfService');
const { asyncHandler, successResponse, createdResponse, paginatedResponse } = require('../utils/responseHandler');
const { calculatePagination, buildPaginationMeta } = require('../utils/helpers');

/**
 * @route   GET /api/customer-invoices
 * @desc    Get all customer invoices with filters and pagination
 * @access  Admin
 */
const getInvoices = asyncHandler(async (req, res) => {
    const { page, limit, customer_id, status, payment_status, from_date, to_date } = req.query;
    const pagination = calculatePagination(page, limit);
    
    const filters = { customer_id, status, payment_status, from_date, to_date };
    
    const [invoices, total] = await Promise.all([
        customerInvoiceRepository.findAll(filters, pagination),
        customerInvoiceRepository.count(filters),
    ]);
    
    const paginationMeta = buildPaginationMeta(total, pagination.page, pagination.limit);
    paginatedResponse(res, invoices, paginationMeta, 'Customer invoices fetched successfully');
});

/**
 * @route   GET /api/customer-invoices/:id
 * @desc    Get customer invoice by ID with lines
 * @access  Admin
 */
const getInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const invoice = await customerInvoiceService.getInvoiceWithLines(id);
    successResponse(res, invoice, 'Customer invoice fetched successfully');
});

/**
 * @route   POST /api/customer-invoices
 * @desc    Create a new customer invoice (triggers user creation if needed)
 * @access  Admin
 */
const createInvoice = asyncHandler(async (req, res) => {
    const { lines, ...invoiceData } = req.body;
    const invoice = await customerInvoiceService.createInvoice(invoiceData, lines);
    createdResponse(res, invoice, 'Customer invoice created successfully');
});

/**
 * @route   PATCH /api/customer-invoices/:id/status
 * @desc    Update customer invoice status
 * @access  Admin
 */
const updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const invoice = await customerInvoiceService.updateStatus(id, status);
    successResponse(res, invoice, 'Customer invoice status updated successfully');
});

/**
 * @route   POST /api/customer-invoices/:id/payments
 * @desc    Record a payment for customer invoice (Admin)
 * @access  Admin
 */
const createPayment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await paymentService.createInvoicePayment(id, req.body, null);
    createdResponse(res, result, 'Payment recorded successfully');
});

/**
 * @route   GET /api/customer-invoices/:id/payment-status
 * @desc    Get payment status for customer invoice
 * @access  Admin
 */
const getPaymentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const status = await paymentService.getInvoicePaymentStatus(id);
    successResponse(res, status, 'Payment status fetched successfully');
});

/**
 * @route   GET /api/customer-invoices/:id/download
 * @desc    Download customer invoice as PDF
 * @access  Admin
 */
const downloadInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const invoice = await customerInvoiceService.getInvoiceWithLines(id);
    const pdfBuffer = await pdfService.generateInvoicePDF(invoice, invoice.lines);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoice_number}.pdf`);
    res.send(pdfBuffer);
});

/**
 * @route   GET /api/customer-invoices/payments/all
 * @desc    Get all invoice payments (for admin)
 * @access  Admin
 */
const getAllPayments = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const pagination = calculatePagination(page, limit);
    
    const payments = await paymentRepository.findAllInvoicePayments(pagination);
    successResponse(res, payments, 'Invoice payments fetched successfully');
});

module.exports = {
    getInvoices,
    getInvoice,
    createInvoice,
    updateStatus,
    createPayment,
    getPaymentStatus,
    downloadInvoice,
    getAllPayments,
};
