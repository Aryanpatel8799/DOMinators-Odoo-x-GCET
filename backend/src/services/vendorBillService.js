const db = require('../config/database');
const vendorBillRepository = require('../repositories/vendorBillRepository');
const contactRepository = require('../repositories/contactRepository');
const autoAnalyticalService = require('./autoAnalyticalService');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { documentStatus, paymentStatus } = require('../config/constants');

/**
 * Vendor Bill Service
 * 
 * TASK 1: Line-level analytical account assignment
 * TASK 6: Status transition validation
 * TASK 10: Transaction management
 */
class VendorBillService {
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
        'POSTED': [], // No transitions allowed from POSTED
        'CANCELLED': [], // Terminal state
    };

    /**
     * Validate status transition
     * 
     * @param {string} currentStatus - Current document status
     * @param {string} newStatus - Requested new status
     * @param {string} currentPaymentStatus - Current payment status
     * @throws {BadRequestError} - If transition is invalid
     */
    validateStatusTransition(currentStatus, newStatus, currentPaymentStatus) {
        // PAID documents cannot have status changed (TASK 6)
        if (currentPaymentStatus === paymentStatus.PAID) {
            throw new BadRequestError('Cannot change status of fully paid bill');
        }

        // Check if transition is allowed
        const allowedTransitions = VendorBillService.VALID_TRANSITIONS[currentStatus] || [];
        
        if (!allowedTransitions.includes(newStatus)) {
            throw new BadRequestError(
                `Invalid status transition: ${currentStatus} → ${newStatus}. ` +
                `Allowed transitions from ${currentStatus}: ${allowedTransitions.length > 0 ? allowedTransitions.join(', ') : 'none'}`
            );
        }
    }

    /**
     * Create a vendor bill with automatic analytical account assignment
     * 
     * TASK 1: Lines processed one-by-one with individual resolution
     * TASK 10: All wrapped in transaction
     */
    async createBill(billData, lines) {
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            // 1. Validate vendor
            const vendor = await contactRepository.findById(billData.vendor_id);
            if (!vendor) {
                throw new NotFoundError('Vendor not found');
            }
            
            if (vendor.contact_type !== 'VENDOR') {
                throw new BadRequestError('Contact is not a vendor');
            }
            
            // 2. Generate bill number
            const bill_number = await vendorBillRepository.generateBillNumber(client);
            
            // 3. Process lines with auto analytical assignment (TASK 1 & 2)
            const processedLines = await this.processLinesWithAnalyticalResolution(
                billData.vendor_id,
                lines,
                vendor.tag
            );
            
            // 4. Calculate total
            const total_amount = processedLines.reduce(
                (sum, line) => sum + (parseFloat(line.quantity) * parseFloat(line.unit_price)),
                0
            );
            
            // 5. Create bill header
            const bill = await vendorBillRepository.create({
                ...billData,
                bill_number,
                total_amount,
            }, client);
            
            // 6. Create bill lines one-by-one (TASK 1)
            const createdLines = [];
            for (const line of processedLines) {
                const subtotal = parseFloat(line.quantity) * parseFloat(line.unit_price);
                const createdLine = await vendorBillRepository.createLine({
                    vendor_bill_id: bill.id,
                    product_id: line.product_id,
                    quantity: line.quantity,
                    unit_price: line.unit_price,
                    subtotal,
                    analytical_account_id: line.analytical_account_id,
                }, client);
                createdLines.push(createdLine);
            }
            
            await client.query('COMMIT');
            
            return {
                ...bill,
                lines: createdLines,
                vendor_name: vendor.name,
                vendor_email: vendor.email,
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
     * @param {string} vendorId - Vendor UUID
     * @param {Array} lines - Line items
     * @param {string} vendorTag - Vendor's tag for rule matching
     * @returns {Array} - Lines with analytical_account_id assigned
     */
    async processLinesWithAnalyticalResolution(vendorId, lines, vendorTag) {
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
                partnerId: vendorId,
                partnerTag: vendorTag || null,
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
     * Update bill status with transition validation (TASK 6)
     */
    async updateStatus(billId, newStatus) {
        const bill = await vendorBillRepository.findById(billId);
        
        if (!bill) {
            throw new NotFoundError('Bill not found');
        }
        
        // Validate status transition (TASK 6)
        this.validateStatusTransition(bill.status, newStatus, bill.payment_status);
        
        return vendorBillRepository.updateStatus(billId, newStatus);
    }
    
    /**
     * Get bill with lines
     */
    async getBillWithLines(billId) {
        const bill = await vendorBillRepository.findById(billId);
        
        if (!bill) {
            throw new NotFoundError('Bill not found');
        }
        
        const lines = await vendorBillRepository.findLinesById(billId);
        
        return { ...bill, lines };
    }
}

module.exports = new VendorBillService();
