const { z } = require('zod');

// Auth Schemas
const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

const resetPasswordRequestSchema = z.object({
    email: z.string().email('Invalid email format'),
});

const setPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

const registerSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password is required'),
    role: z.enum(['ADMIN', 'CUSTOMER']).default('CUSTOMER'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

// Contact Schemas
const createContactSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    email: z.string().email('Invalid email format'),
    phone: z.string().max(50).optional(),
    address: z.string().optional(),
    contact_type: z.enum(['CUSTOMER', 'VENDOR']),
    tag: z.string().max(100).optional(),
});

const updateContactSchema = createContactSchema.partial();

// Product Category Schemas
const createProductCategorySchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    description: z.string().optional(),
});

const updateProductCategorySchema = createProductCategorySchema.partial();

// Product Schemas
const createProductSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    sku: z.string().max(100).optional(),
    description: z.string().optional(),
    unit_price: z.number().min(0, 'Unit price must be non-negative'),
    cost_price: z.number().min(0, 'Cost price must be non-negative'),
    category_id: z.string().uuid().optional(),
    vendor_id: z.string().uuid().optional(),
});

const updateProductSchema = createProductSchema.partial();

// Analytical Account Schemas
const createAnalyticalAccountSchema = z.object({
    code: z.string().min(1, 'Code is required').max(50),
    name: z.string().min(1, 'Name is required').max(255),
    description: z.string().optional(),
});

const updateAnalyticalAccountSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    is_active: z.boolean().optional(),
});

// Auto Analytical Model Schemas
const createAutoAnalyticalModelSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    partner_id: z.string().uuid().nullable().optional(),
    partner_tag: z.string().max(100).nullable().optional(),
    product_id: z.string().uuid().nullable().optional(),
    product_category_id: z.string().uuid().nullable().optional(),
    analytical_account_id: z.string().uuid('Analytical account ID is required'),
}).refine((data) => {
    // At least one matching field must be provided
    return data.partner_id || data.partner_tag || data.product_id || data.product_category_id;
}, {
    message: 'At least one matching criteria (partner, partner_tag, product, or product_category) must be provided',
});

const updateAutoAnalyticalModelSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    partner_id: z.string().uuid().nullable().optional(),
    partner_tag: z.string().max(100).nullable().optional(),
    product_id: z.string().uuid().nullable().optional(),
    product_category_id: z.string().uuid().nullable().optional(),
    analytical_account_id: z.string().uuid().optional(),
    is_active: z.boolean().optional(),
});

// Budget Schemas
const createBudgetSchema = z.object({
    analytical_account_id: z.string().uuid('Analytical account ID is required'),
    period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    budget_amount: z.number().min(0, 'Budget amount must be non-negative'),
    description: z.string().optional(),
}).refine((data) => new Date(data.period_end) > new Date(data.period_start), {
    message: 'Period end must be after period start',
    path: ['period_end'],
});

const updateBudgetSchema = z.object({
    budget_amount: z.number().min(0).optional(),
    description: z.string().optional(),
    period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
    period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
    reason: z.string().max(500, 'Reason must be less than 500 characters').optional(),
});

// Order Line Schema (shared)
const orderLineSchema = z.object({
    product_id: z.string().uuid('Product ID is required'),
    description: z.string().optional(),
    quantity: z.number().positive('Quantity must be positive'),
    unit_price: z.number().min(0, 'Unit price must be non-negative'),
    analytical_account_id: z.string().uuid().optional(),
});

// Purchase Order Schemas
const createPurchaseOrderSchema = z.object({
    vendor_id: z.string().uuid('Vendor ID is required'),
    order_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    expected_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    notes: z.string().optional(),
    lines: z.array(orderLineSchema).min(1, 'At least one line item is required'),
});

// Vendor Bill Schemas
const createVendorBillSchema = z.object({
    vendor_id: z.string().uuid('Vendor ID is required'),
    purchase_order_id: z.string().uuid().optional(),
    bill_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date is required'),
    notes: z.string().optional(),
    lines: z.array(orderLineSchema).min(1, 'At least one line item is required'),
});

// Sales Order Schemas
const createSalesOrderSchema = z.object({
    customer_id: z.string().uuid('Customer ID is required'),
    order_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    expected_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    notes: z.string().optional(),
    lines: z.array(orderLineSchema).min(1, 'At least one line item is required'),
});

// Customer Invoice Schemas
const createCustomerInvoiceSchema = z.object({
    customer_id: z.string().uuid('Customer ID is required'),
    sales_order_id: z.string().uuid().optional(),
    invoice_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date is required'),
    notes: z.string().optional(),
    lines: z.array(orderLineSchema).min(1, 'At least one line item is required'),
});

// Payment Schemas
const createPaymentSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    payment_method: z.string().min(1, 'Payment method is required').max(50),
    reference: z.string().max(255).optional(),
    notes: z.string().optional(),
});

// Status Update Schema
const updateStatusSchema = z.object({
    status: z.enum(['DRAFT', 'POSTED', 'CONFIRMED', 'CANCELLED']),
});

// Pagination Schema
const paginationSchema = z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
});

// UUID Param Schema
const uuidParamSchema = z.object({
    id: z.string().uuid('Invalid ID format'),
});

module.exports = {
    loginSchema,
    resetPasswordRequestSchema,
    setPasswordSchema,
    registerSchema,
    createContactSchema,
    updateContactSchema,
    createProductCategorySchema,
    updateProductCategorySchema,
    createProductSchema,
    updateProductSchema,
    createAnalyticalAccountSchema,
    updateAnalyticalAccountSchema,
    createAutoAnalyticalModelSchema,
    updateAutoAnalyticalModelSchema,
    createBudgetSchema,
    updateBudgetSchema,
    createPurchaseOrderSchema,
    createVendorBillSchema,
    createSalesOrderSchema,
    createCustomerInvoiceSchema,
    createPaymentSchema,
    updateStatusSchema,
    paginationSchema,
    uuidParamSchema,
};
