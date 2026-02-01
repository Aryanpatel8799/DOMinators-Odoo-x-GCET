const customerInvoiceRepository = require('../repositories/customerInvoiceRepository');
const salesOrderRepository = require('../repositories/salesOrderRepository');
const customerInvoiceService = require('../services/customerInvoiceService');
const paymentService = require('../services/paymentService');
const pdfService = require('../services/pdfService');
const stripeService = require('../services/stripeService');
const contactRepository = require('../repositories/contactRepository');
const { asyncHandler, successResponse, createdResponse, paginatedResponse } = require('../utils/responseHandler');
const { ForbiddenError, NotFoundError, BadRequestError } = require('../utils/errors');
const { calculatePagination, buildPaginationMeta } = require('../utils/helpers');

/**
 * @route   GET /api/customer/invoices
 * @desc    Get customer's own invoices
 * @access  Customer
 */
const getMyInvoices = asyncHandler(async (req, res) => {
    const { page, limit, status, payment_status } = req.query;
    const pagination = calculatePagination(page, limit);
    
    const filters = { status, payment_status };
    
    const [invoices, total] = await Promise.all([
        customerInvoiceRepository.findByCustomerUserId(req.user.id, filters, pagination),
        customerInvoiceRepository.countByCustomerUserId(req.user.id, filters),
    ]);
    
    const paginationMeta = buildPaginationMeta(total, pagination.page, pagination.limit);
    paginatedResponse(res, invoices, paginationMeta, 'Invoices fetched successfully');
});

/**
 * @route   GET /api/customer/invoices/:id
 * @desc    Get specific invoice (customer must own it)
 * @access  Customer
 */
const getMyInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Check access
    const canAccess = await customerInvoiceService.canUserAccessInvoice(req.user.id, id);
    if (!canAccess) {
        throw new ForbiddenError('You do not have access to this invoice');
    }
    
    const invoice = await customerInvoiceService.getInvoiceWithLines(id);
    successResponse(res, invoice, 'Invoice fetched successfully');
});

/**
 * @route   GET /api/customer/invoices/:id/payment-status
 * @desc    Get payment status for specific invoice
 * @access  Customer
 */
const getInvoicePaymentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Check access
    const canAccess = await customerInvoiceService.canUserAccessInvoice(req.user.id, id);
    if (!canAccess) {
        throw new ForbiddenError('You do not have access to this invoice');
    }
    
    const status = await paymentService.getInvoicePaymentStatus(id);
    successResponse(res, status, 'Payment status fetched successfully');
});

/**
 * @route   POST /api/customer/invoices/:id/pay
 * @desc    Pay an invoice (customer paying their own invoice)
 * @access  Customer
 */
const payInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Check access
    const canAccess = await customerInvoiceService.canUserAccessInvoice(req.user.id, id);
    if (!canAccess) {
        throw new ForbiddenError('You do not have access to this invoice');
    }
    
    const result = await paymentService.createInvoicePayment(id, req.body, req.user.id);
    createdResponse(res, result, 'Payment successful');
});

/**
 * @route   GET /api/customer/invoices/:id/download
 * @desc    Download invoice as PDF
 * @access  Customer
 */
const downloadInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Check access
    const canAccess = await customerInvoiceService.canUserAccessInvoice(req.user.id, id);
    if (!canAccess) {
        throw new ForbiddenError('You do not have access to this invoice');
    }
    
    const invoice = await customerInvoiceService.getInvoiceWithLines(id);
    const pdfBuffer = await pdfService.generateInvoicePDF(invoice, invoice.lines);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoice_number}.pdf`);
    res.send(pdfBuffer);
});

/**
 * @route   GET /api/customer/sales-orders
 * @desc    Get customer's own sales orders
 * @access  Customer
 */
const getMySalesOrders = asyncHandler(async (req, res) => {
    const { page, limit, status } = req.query;
    const pagination = calculatePagination(page, limit);
    
    // User IS the contact now (no separate users table)
    const contactId = req.user.id;
    
    const filters = { customer_id: contactId, status };
    
    const [orders, total] = await Promise.all([
        salesOrderRepository.findAll(filters, pagination),
        salesOrderRepository.count(filters),
    ]);
    
    const paginationMeta = buildPaginationMeta(total, pagination.page, pagination.limit);
    paginatedResponse(res, orders, paginationMeta, 'Sales orders fetched successfully');
});

/**
 * @route   GET /api/customer/sales-orders/:id
 * @desc    Get specific sales order (customer must own it)
 * @access  Customer
 */
const getMySalesOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // User IS the contact now (no separate users table)
    const contactId = req.user.id;
    
    const order = await salesOrderRepository.findById(id);
    if (!order || order.customer_id !== contactId) {
        throw new ForbiddenError('You do not have access to this sales order');
    }
    
    const lines = await salesOrderRepository.findLinesById(id);
    successResponse(res, { ...order, lines }, 'Sales order fetched successfully');
});

/**
 * @route   GET /api/customer/sales-orders/:id/download
 * @desc    Download sales order as PDF
 * @access  Customer
 */
const downloadSalesOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // User IS the contact now (no separate users table)
    const contactId = req.user.id;
    
    const order = await salesOrderRepository.findById(id);
    if (!order || order.customer_id !== contactId) {
        throw new ForbiddenError('You do not have access to this sales order');
    }
    
    const lines = await salesOrderRepository.findLinesById(id);
    const pdfBuffer = await pdfService.generateSalesOrderPDF(order, lines);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=sales-order-${order.order_number}.pdf`);
    res.send(pdfBuffer);
});

/**
 * @route   GET /api/customer/dashboard
 * @desc    Get customer dashboard summary
 * @access  Customer
 */
const getDashboard = asyncHandler(async (req, res) => {
    // Get all invoices for the customer
    const invoices = await customerInvoiceRepository.findByCustomerUserId(req.user.id, {}, { limit: 1000, offset: 0 });
    
    // Calculate summary
    const summary = invoices.reduce((acc, inv) => {
        acc.total_invoices++;
        acc.total_amount += parseFloat(inv.total_amount) || 0;
        acc.paid_amount += parseFloat(inv.paid_amount) || 0;
        
        if (inv.payment_status === 'NOT_PAID') {
            acc.unpaid_count++;
        } else if (inv.payment_status === 'PARTIALLY_PAID') {
            acc.partial_count++;
        } else if (inv.payment_status === 'PAID') {
            acc.paid_count++;
        }
        
        // Check overdue
        if (inv.payment_status !== 'PAID' && new Date(inv.due_date) < new Date()) {
            acc.overdue_count++;
            acc.overdue_amount += (parseFloat(inv.total_amount) - parseFloat(inv.paid_amount));
        }
        
        return acc;
    }, {
        total_invoices: 0,
        total_amount: 0,
        paid_amount: 0,
        outstanding_amount: 0,
        unpaid_count: 0,
        partial_count: 0,
        paid_count: 0,
        overdue_count: 0,
        overdue_amount: 0,
    });
    
    summary.outstanding_amount = summary.total_amount - summary.paid_amount;
    
    // Get recent invoices
    const recentInvoices = invoices.slice(0, 5);
    
    // Get contact info (user IS the contact now)
    const contact = await contactRepository.findById(req.user.id);
    
    successResponse(res, {
        customer: {
            name: req.user.name,
            email: req.user.email,
            contact: contact ? {
                phone: contact.phone,
                address: contact.address,
            } : null,
        },
        summary,
        recent_invoices: recentInvoices,
    }, 'Dashboard fetched successfully');
});

/**
 * @route   POST /api/customer/invoices/:id/create-checkout
 * @desc    Create Stripe checkout session for invoice payment
 * @access  Customer
 */
const createStripeCheckout = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;
    
    // Check if Stripe is configured
    if (!stripeService.isConfigured()) {
        throw new BadRequestError('Online payment is not available at this time');
    }
    
    // Check access
    const canAccess = await customerInvoiceService.canUserAccessInvoice(req.user.id, id);
    if (!canAccess) {
        throw new ForbiddenError('You do not have access to this invoice');
    }
    
    // Get invoice
    const invoice = await customerInvoiceService.getInvoiceWithLines(id);
    if (!invoice) {
        throw new NotFoundError('Invoice not found');
    }
    
    // Check if invoice is already fully paid
    const remainingAmount = parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount || 0);
    if (remainingAmount <= 0) {
        throw new BadRequestError('This invoice is already fully paid');
    }
    
    // Use provided amount or remaining amount
    const paymentAmount = amount ? Math.min(parseFloat(amount), remainingAmount) : remainingAmount;
    
    if (paymentAmount <= 0) {
        throw new BadRequestError('Invalid payment amount');
    }
    
    // Create checkout session
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const session = await stripeService.createCheckoutSession(
        invoice,
        paymentAmount,
        req.user.email,
        `${frontendUrl}/payment-success`,
        `${frontendUrl}/payment-cancelled`
    );
    
    successResponse(res, session, 'Checkout session created');
});

/**
 * @route   POST /api/customer/invoices/:id/verify-payment
 * @desc    Verify Stripe payment and record it
 * @access  Customer
 */
const verifyStripePayment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { session_id } = req.body;
    
    if (!session_id) {
        throw new BadRequestError('Session ID is required');
    }
    
    // Check if Stripe is configured
    if (!stripeService.isConfigured()) {
        throw new BadRequestError('Online payment is not available at this time');
    }
    
    // Check access
    const canAccess = await customerInvoiceService.canUserAccessInvoice(req.user.id, id);
    if (!canAccess) {
        throw new ForbiddenError('You do not have access to this invoice');
    }
    
    // Verify the checkout session
    const sessionDetails = await stripeService.verifyCheckoutSession(session_id);
    
    if (sessionDetails.paymentStatus !== 'paid') {
        throw new BadRequestError('Payment was not completed');
    }
    
    // Record the payment
    const paymentData = {
        amount: sessionDetails.amountTotal,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'STRIPE',
        reference: sessionDetails.paymentIntentId,
        notes: `Online payment via Stripe (Session: ${session_id})`,
    };
    
    const result = await paymentService.createInvoicePayment(id, paymentData, req.user.id);
    
    createdResponse(res, {
        payment: result,
        stripe_session: sessionDetails,
    }, 'Payment verified and recorded successfully');
});

module.exports = {
    getMyInvoices,
    getMyInvoice,
    getInvoicePaymentStatus,
    payInvoice,
    downloadInvoice,
    getMySalesOrders,
    getMySalesOrder,
    downloadSalesOrder,
    getDashboard,
    createStripeCheckout,
    verifyStripePayment,
};
