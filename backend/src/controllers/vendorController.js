const vendorBillRepository = require('../repositories/vendorBillRepository');
const purchaseOrderRepository = require('../repositories/purchaseOrderRepository');
const pdfService = require('../services/pdfService');
const contactRepository = require('../repositories/contactRepository');
const paymentService = require('../services/paymentService');
const { asyncHandler, successResponse, paginatedResponse } = require('../utils/responseHandler');
const { ForbiddenError, NotFoundError } = require('../utils/errors');
const { calculatePagination, buildPaginationMeta } = require('../utils/helpers');

/**
 * Helper: Get vendor contact for user
 * Since users table is removed, userId IS the contactId
 */
const getVendorContact = async (userId) => {
    const contact = await contactRepository.findById(userId);
    if (!contact || contact.contact_type !== 'VENDOR') {
        return null;
    }
    return contact;
};

/**
 * @route   GET /api/vendor/dashboard
 * @desc    Get vendor dashboard summary
 * @access  Vendor
 */
const getDashboard = asyncHandler(async (req, res) => {
    const contact = await getVendorContact(req.user.id);
    
    if (!contact) {
        return successResponse(res, {
            vendor: { name: req.user.name, email: req.user.email },
            summary: { total_bills: 0, total_pos: 0 },
            recent_bills: [],
            recent_pos: [],
        }, 'Dashboard fetched successfully');
    }
    
    // Get all bills for the vendor
    const bills = await vendorBillRepository.findAll({ vendor_id: contact.id }, { limit: 1000, offset: 0 });
    const purchaseOrders = await purchaseOrderRepository.findAll({ vendor_id: contact.id }, { limit: 1000, offset: 0 });
    
    // Calculate summary
    const billSummary = bills.reduce((acc, bill) => {
        acc.total_bills++;
        acc.total_amount += parseFloat(bill.total_amount) || 0;
        acc.paid_amount += parseFloat(bill.paid_amount) || 0;
        
        if (bill.payment_status === 'NOT_PAID') acc.unpaid_count++;
        else if (bill.payment_status === 'PARTIALLY_PAID') acc.partial_count++;
        else if (bill.payment_status === 'PAID') acc.paid_count++;
        
        return acc;
    }, {
        total_bills: 0,
        total_amount: 0,
        paid_amount: 0,
        unpaid_count: 0,
        partial_count: 0,
        paid_count: 0,
    });
    
    billSummary.outstanding_amount = billSummary.total_amount - billSummary.paid_amount;
    
    const poSummary = purchaseOrders.reduce((acc, po) => {
        acc.total_pos++;
        acc.total_value += parseFloat(po.total_amount) || 0;
        
        if (po.status === 'DRAFT') acc.draft_count++;
        else if (po.status === 'POSTED') acc.posted_count++;
        
        return acc;
    }, {
        total_pos: 0,
        total_value: 0,
        draft_count: 0,
        posted_count: 0,
    });
    
    successResponse(res, {
        vendor: {
            name: req.user.name,
            email: req.user.email,
            contact: {
                phone: contact.phone,
                address: contact.address,
            },
        },
        bill_summary: billSummary,
        po_summary: poSummary,
        recent_bills: bills.slice(0, 5),
        recent_pos: purchaseOrders.slice(0, 5),
    }, 'Dashboard fetched successfully');
});

/**
 * @route   GET /api/vendor/bills
 * @desc    Get vendor's own bills
 * @access  Vendor
 */
const getMyBills = asyncHandler(async (req, res) => {
    const { page, limit, status, payment_status } = req.query;
    const pagination = calculatePagination(page, limit);
    
    const contact = await getVendorContact(req.user.id);
    if (!contact) {
        return paginatedResponse(res, [], buildPaginationMeta(0, 1, 20), 'Bills fetched successfully');
    }
    
    const filters = { vendor_id: contact.id, status, payment_status };
    
    const [bills, total] = await Promise.all([
        vendorBillRepository.findAll(filters, pagination),
        vendorBillRepository.count(filters),
    ]);
    
    const paginationMeta = buildPaginationMeta(total, pagination.page, pagination.limit);
    paginatedResponse(res, bills, paginationMeta, 'Bills fetched successfully');
});

/**
 * @route   GET /api/vendor/bills/:id
 * @desc    Get specific bill (vendor must own it)
 * @access  Vendor
 */
const getMyBill = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const contact = await getVendorContact(req.user.id);
    if (!contact) {
        throw new ForbiddenError('You do not have access to this bill');
    }
    
    const bill = await vendorBillRepository.findById(id);
    if (!bill || bill.vendor_id !== contact.id) {
        throw new ForbiddenError('You do not have access to this bill');
    }
    
    const lines = await vendorBillRepository.findLinesById(id);
    successResponse(res, { ...bill, lines }, 'Bill fetched successfully');
});

/**
 * @route   GET /api/vendor/bills/:id/download
 * @desc    Download bill as PDF
 * @access  Vendor
 */
const downloadBill = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const contact = await getVendorContact(req.user.id);
    if (!contact) {
        throw new ForbiddenError('You do not have access to this bill');
    }
    
    const bill = await vendorBillRepository.findById(id);
    if (!bill || bill.vendor_id !== contact.id) {
        throw new ForbiddenError('You do not have access to this bill');
    }
    
    const lines = await vendorBillRepository.findLinesById(id);
    const pdfBuffer = await pdfService.generateBillPDF(bill, lines);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bill-${bill.bill_number}.pdf`);
    res.send(pdfBuffer);
});

/**
 * @route   GET /api/vendor/purchase-orders
 * @desc    Get vendor's own purchase orders
 * @access  Vendor
 */
const getMyPurchaseOrders = asyncHandler(async (req, res) => {
    const { page, limit, status } = req.query;
    const pagination = calculatePagination(page, limit);
    
    const contact = await getVendorContact(req.user.id);
    if (!contact) {
        return paginatedResponse(res, [], buildPaginationMeta(0, 1, 20), 'Purchase orders fetched successfully');
    }
    
    const filters = { vendor_id: contact.id, status };
    
    const [orders, total] = await Promise.all([
        purchaseOrderRepository.findAll(filters, pagination),
        purchaseOrderRepository.count(filters),
    ]);
    
    const paginationMeta = buildPaginationMeta(total, pagination.page, pagination.limit);
    paginatedResponse(res, orders, paginationMeta, 'Purchase orders fetched successfully');
});

/**
 * @route   GET /api/vendor/purchase-orders/:id
 * @desc    Get specific purchase order (vendor must own it)
 * @access  Vendor
 */
const getMyPurchaseOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const contact = await getVendorContact(req.user.id);
    if (!contact) {
        throw new ForbiddenError('You do not have access to this purchase order');
    }
    
    const order = await purchaseOrderRepository.findById(id);
    if (!order || order.vendor_id !== contact.id) {
        throw new ForbiddenError('You do not have access to this purchase order');
    }
    
    const lines = await purchaseOrderRepository.findLinesById(id);
    successResponse(res, { ...order, lines }, 'Purchase order fetched successfully');
});

/**
 * @route   GET /api/vendor/purchase-orders/:id/download
 * @desc    Download purchase order as PDF
 * @access  Vendor
 */
const downloadPurchaseOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const contact = await getVendorContact(req.user.id);
    if (!contact) {
        throw new ForbiddenError('You do not have access to this purchase order');
    }
    
    const order = await purchaseOrderRepository.findById(id);
    if (!order || order.vendor_id !== contact.id) {
        throw new ForbiddenError('You do not have access to this purchase order');
    }
    
    const lines = await purchaseOrderRepository.findLinesById(id);
    const pdfBuffer = await pdfService.generatePurchaseOrderPDF(order, lines);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=purchase-order-${order.order_number}.pdf`);
    res.send(pdfBuffer);
});

module.exports = {
    getDashboard,
    getMyBills,
    getMyBill,
    downloadBill,
    getMyPurchaseOrders,
    getMyPurchaseOrder,
    downloadPurchaseOrder,
};
