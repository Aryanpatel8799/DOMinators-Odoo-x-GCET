const db = require('../config/database');
const customerInvoiceRepository = require('../repositories/customerInvoiceRepository');
const contactRepository = require('../repositories/contactRepository');
const authService = require('./authService');
const emailService = require('./emailService');
const autoAnalyticalService = require('./autoAnalyticalService');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const { documentStatus, paymentStatus } = require('../config/constants');

/**
 * Customer Invoice Service
 * 
 * TASK 1: Line-level analytical account assignment
 * TASK 6: Status transition validation
 * TASK 8: Customer data isolation (enforced at service layer)
 * TASK 10: Transaction management
 */
class CustomerInvoiceService {
    /**
     * VALID STATUS TRANSITIONS (TASK 6)
     * 
     * DRAFT → POSTED ✅
     * POSTED → DRAFT ❌ (cannot un-post)
     * POSTED → CANCELLED ❌ (must void through proper process)
     * PAID → any change ❌ (locked after payment)
     * CANCELLED → any change ❌ (terminal state)
     */
    static VALID_TRANSITIONS = {
        'DRAFT': ['POSTED'],
        'POSTED': [], // No transitions allowed from POSTED (except via payment triggers)
        'CANCELLED': [], // Terminal state
    };

    /**
     * Validate status transition
     * 
     * @param {string} currentStatus - Current document status
     * @param {string} newStatus - Requested new status
     * @param {string} paymentStatus - Current payment status
     * @throws {BadRequestError} - If transition is invalid
     */
    validateStatusTransition(currentStatus, newStatus, currentPaymentStatus) {
        // PAID documents cannot have status changed (TASK 6)
        if (currentPaymentStatus === paymentStatus.PAID) {
            throw new BadRequestError('Cannot change status of fully paid invoice');
        }

        // Check if transition is allowed
        const allowedTransitions = CustomerInvoiceService.VALID_TRANSITIONS[currentStatus] || [];
        
        if (!allowedTransitions.includes(newStatus)) {
            throw new BadRequestError(
                `Invalid status transition: ${currentStatus} → ${newStatus}. ` +
                `Allowed transitions from ${currentStatus}: ${allowedTransitions.length > 0 ? allowedTransitions.join(', ') : 'none'}`
            );
        }
    }

    /**
     * Create a customer invoice with automatic user creation
     * 
     * BUSINESS RULES:
     * 1. Header created first, then lines processed one-by-one (TASK 1)
     * 2. Auto Analytical Model resolution runs for EACH line (TASK 2)
     * 3. If no rule matches, analytical_account_id can be null (manual required)
     * 4. User account created if needed (existing logic)
     * 5. All wrapped in transaction (TASK 10)
     */
    async createInvoice(invoiceData, lines) {
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            // 1. Get customer contact
            const customer = await contactRepository.findById(invoiceData.customer_id);
            if (!customer) {
                throw new NotFoundError('Customer not found');
            }
            
            if (customer.contact_type !== 'CUSTOMER') {
                throw new BadRequestError('Contact is not a customer');
            }
            
            // 2. Ensure customer has auth credentials for portal access
            let resetToken = null;
            if (!customer.password_hash) {
                const userResult = await authService.ensureCustomerUser(
                    customer.email,
                    customer.name,
                    client
                );
                resetToken = userResult.resetToken;
            }
            
            // 3. Generate invoice number
            const invoice_number = await customerInvoiceRepository.generateInvoiceNumber(client);
            
            // 4. Process lines with auto analytical assignment (TASK 1 & 2)
            // Each line is processed individually with its own resolution
            const processedLines = await this.processLinesWithAnalyticalResolution(
                invoiceData.customer_id,
                lines,
                customer.tag
            );
            
            // 5. Calculate total from lines
            const total_amount = processedLines.reduce(
                (sum, line) => sum + (parseFloat(line.quantity) * parseFloat(line.unit_price)),
                0
            );
            
            // 6. Create invoice header
            const invoice = await customerInvoiceRepository.create({
                ...invoiceData,
                invoice_number,
                total_amount,
            }, client);
            
            // 7. Create invoice lines one-by-one (TASK 1)
            const createdLines = [];
            for (const line of processedLines) {
                const subtotal = parseFloat(line.quantity) * parseFloat(line.unit_price);
                const createdLine = await customerInvoiceRepository.createLine({
                    customer_invoice_id: invoice.id,
                    product_id: line.product_id,
                    quantity: line.quantity,
                    unit_price: line.unit_price,
                    subtotal,
                    analytical_account_id: line.analytical_account_id,
                }, client);
                createdLines.push(createdLine);
            }
            
            await client.query('COMMIT');
            
            // 8. Send emails (after commit to ensure data is saved)
            if (resetToken) {
                // New user - send password set email
                await emailService.sendPasswordSetEmail(customer.email, customer.name, resetToken);
            }
            
            // Send invoice notification
            await emailService.sendInvoiceNotification(
                customer.email,
                customer.name,
                invoice.invoice_number,
                total_amount,
                invoice.due_date
            );
            
            return {
                ...invoice,
                lines: createdLines,
                customer_name: customer.name,
                customer_email: customer.email,
            };
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Process lines with analytical account resolution (TASK 1 & 2)
     * 
     * For EACH line:
     * 1. Get product details (including category_id from FK)
     * 2. Run Auto Analytical Model resolution
     * 3. Assign resolved analytical_account_id (or null if no match)
     * 
     * @param {string} customerId - Customer UUID
     * @param {Array} lines - Line items
     * @param {string} customerTag - Customer's tag for rule matching
     * @returns {Array} - Lines with analytical_account_id assigned
     */
    async processLinesWithAnalyticalResolution(customerId, lines, customerTag) {
        const { productRepository } = require('../repositories/productRepository');
        
        const processedLines = [];
        
        for (const line of lines) {
            // Get product with category_id (TASK 3: FK ensures valid category)
            const product = await productRepository.findById(line.product_id);
            
            if (!product) {
                throw new NotFoundError(`Product not found: ${line.product_id}`);
            }
            
            // Build resolution context
            const context = {
                partnerId: customerId,
                partnerTag: customerTag || null,
                productId: line.product_id,
                productCategoryId: product.category_id || null, // From FK (TASK 3)
            };
            
            // Resolve analytical account (TASK 2)
            const analyticalAccountId = await autoAnalyticalService.resolveAnalyticalAccount(context);
            
            processedLines.push({
                ...line,
                // Use resolved account, or manual override if provided, or null
                analytical_account_id: line.analytical_account_id || analyticalAccountId || null,
            });
        }
        
        return processedLines;
    }

    /**
     * Update invoice status with transition validation (TASK 6)
     */
    async updateStatus(invoiceId, newStatus) {
        const invoice = await customerInvoiceRepository.findById(invoiceId);
        
        if (!invoice) {
            throw new NotFoundError('Invoice not found');
        }
        
        // Validate status transition (TASK 6)
        this.validateStatusTransition(invoice.status, newStatus, invoice.payment_status);
        
        return customerInvoiceRepository.updateStatus(invoiceId, newStatus);
    }
    
    /**
     * Get invoice with lines
     */
    async getInvoiceWithLines(invoiceId) {
        const invoice = await customerInvoiceRepository.findById(invoiceId);
        
        if (!invoice) {
            throw new NotFoundError('Invoice not found');
        }
        
        const lines = await customerInvoiceRepository.findLinesById(invoiceId);
        
        return { ...invoice, lines };
    }
    
    /**
     * Check if user can access invoice (TASK 8 - Customer data isolation)
     * 
     * SECURITY: This is enforced at SERVICE layer, not controller.
     * Invoice access requires: invoice.customer_id === user.id (contact id)
     * Never trust invoice ID alone.
     */
    async canUserAccessInvoice(userId, invoiceId) {
        const invoice = await customerInvoiceRepository.findById(invoiceId);
        
        if (!invoice) {
            return false;
        }
        
        // Since users table is removed, userId IS the contact id
        return invoice.customer_id === userId || invoice.customer_contact_id === userId;
    }

    /**
     * Get invoice for customer with access check (TASK 8)
     * 
     * @param {string} userId - Current user ID
     * @param {string} invoiceId - Invoice ID
     * @returns {Object} - Invoice with lines
     * @throws {ForbiddenError} - If user cannot access invoice
     */
    async getInvoiceForCustomer(userId, invoiceId) {
        const invoice = await customerInvoiceRepository.findById(invoiceId);
        
        if (!invoice) {
            throw new NotFoundError('Invoice not found');
        }
        
        // TASK 8: Enforce customer data isolation at service layer
        // Since users table is removed, userId IS the contact id
        if (invoice.customer_id !== userId && invoice.customer_contact_id !== userId) {
            throw new ForbiddenError('You do not have access to this invoice');
        }
        
        const lines = await customerInvoiceRepository.findLinesById(invoiceId);
        
        return { ...invoice, lines };
    }
}

module.exports = new CustomerInvoiceService();
