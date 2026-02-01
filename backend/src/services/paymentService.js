const db = require('../config/database');
const paymentRepository = require('../repositories/paymentRepository');
const vendorBillRepository = require('../repositories/vendorBillRepository');
const customerInvoiceRepository = require('../repositories/customerInvoiceRepository');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/errors');
const { documentStatus, paymentStatus } = require('../config/constants');

/**
 * Payment Service
 * 
 * TASK 7: Payment Safety & Validation
 * - Prevents overpayment
 * - Uses DB transactions for atomicity
 * - Handles concurrent payments safely with SELECT FOR UPDATE
 * - Payment status is derived, not manually set
 * 
 * TASK 10: Transaction Management
 */
class PaymentService {
    /**
     * Record a payment for vendor bill (TASK 7)
     * 
     * Uses SELECT FOR UPDATE to lock the bill row during payment processing,
     * preventing race conditions from concurrent payment attempts.
     */
    async createBillPayment(vendorBillId, paymentData) {
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            // Lock the bill row to prevent concurrent payment race conditions (TASK 7)
            const lockResult = await client.query(
                `SELECT * FROM vendor_bills WHERE id = $1 FOR UPDATE`,
                [vendorBillId]
            );
            
            const bill = lockResult.rows[0];
            if (!bill) {
                throw new NotFoundError('Vendor bill not found');
            }
            
            // Validate bill status - can only pay POSTED bills
            if (bill.status !== documentStatus.POSTED) {
                throw new BadRequestError('Can only pay posted bills');
            }
            
            // Check if already fully paid (TASK 7)
            if (bill.payment_status === paymentStatus.PAID) {
                throw new BadRequestError('Bill is already fully paid');
            }
            
            // Calculate remaining amount and validate payment (TASK 7)
            const totalAmount = parseFloat(bill.total_amount);
            const paidAmount = parseFloat(bill.paid_amount);
            const remainingAmount = totalAmount - paidAmount;
            const paymentAmount = parseFloat(paymentData.amount);
            
            // Prevent overpayment (TASK 7)
            if (paymentAmount <= 0) {
                throw new BadRequestError('Payment amount must be greater than zero');
            }
            
            if (paymentAmount > remainingAmount) {
                throw new BadRequestError(
                    `Payment amount (${paymentAmount.toFixed(2)}) exceeds remaining balance (${remainingAmount.toFixed(2)}). ` +
                    `Total: ${totalAmount.toFixed(2)}, Already paid: ${paidAmount.toFixed(2)}`
                );
            }
            
            // Generate payment number
            const payment_number = await paymentRepository.generateBillPaymentNumber(client);
            
            // Create payment record
            const payment = await paymentRepository.createBillPayment({
                ...paymentData,
                payment_number,
                vendor_bill_id: vendorBillId,
            }, client);
            
            // The DB trigger will automatically update paid_amount and payment_status
            // But we calculate it here too for returning accurate data
            const newPaidAmount = paidAmount + paymentAmount;
            const newPaymentStatus = newPaidAmount >= totalAmount 
                ? paymentStatus.PAID 
                : paymentStatus.PARTIALLY_PAID;
            
            await client.query('COMMIT');
            
            // Fetch updated bill after commit
            const updatedBill = await vendorBillRepository.findById(vendorBillId);
            
            return {
                payment,
                bill: updatedBill,
                payment_summary: {
                    total_amount: totalAmount,
                    paid_amount: newPaidAmount,
                    remaining_amount: totalAmount - newPaidAmount,
                    payment_status: newPaymentStatus,
                },
            };
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    
    /**
     * Record a payment for customer invoice (TASK 7)
     * 
     * Uses SELECT FOR UPDATE to lock the invoice row during payment processing.
     */
    async createInvoicePayment(customerInvoiceId, paymentData, paidByUserId = null) {
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            // Lock the invoice row to prevent concurrent payment race conditions (TASK 7)
            const lockResult = await client.query(
                `SELECT * FROM customer_invoices WHERE id = $1 FOR UPDATE`,
                [customerInvoiceId]
            );
            
            const invoice = lockResult.rows[0];
            if (!invoice) {
                throw new NotFoundError('Customer invoice not found');
            }
            
            // Validate invoice status - can only pay POSTED invoices
            if (invoice.status !== documentStatus.POSTED) {
                throw new BadRequestError('Can only pay posted invoices');
            }
            
            // Check if already fully paid (TASK 7)
            if (invoice.payment_status === paymentStatus.PAID) {
                throw new BadRequestError('Invoice is already fully paid');
            }
            
            // Calculate remaining amount and validate payment (TASK 7)
            const totalAmount = parseFloat(invoice.total_amount);
            const paidAmount = parseFloat(invoice.paid_amount);
            const remainingAmount = totalAmount - paidAmount;
            const paymentAmount = parseFloat(paymentData.amount);
            
            // Prevent overpayment (TASK 7)
            if (paymentAmount <= 0) {
                throw new BadRequestError('Payment amount must be greater than zero');
            }
            
            if (paymentAmount > remainingAmount) {
                throw new BadRequestError(
                    `Payment amount (${paymentAmount.toFixed(2)}) exceeds remaining balance (${remainingAmount.toFixed(2)}). ` +
                    `Total: ${totalAmount.toFixed(2)}, Already paid: ${paidAmount.toFixed(2)}`
                );
            }
            
            // Generate payment number
            const payment_number = await paymentRepository.generateInvoicePaymentNumber(client);
            
            // Create payment record (use contact id instead of user id)
            const payment = await paymentRepository.createInvoicePayment({
                ...paymentData,
                payment_number,
                customer_invoice_id: customerInvoiceId,
                paid_by_contact_id: paidByUserId, // This is actually the contact id now
            }, client);
            
            // Calculate new status (for return value)
            const newPaidAmount = paidAmount + paymentAmount;
            const newPaymentStatus = newPaidAmount >= totalAmount 
                ? paymentStatus.PAID 
                : paymentStatus.PARTIALLY_PAID;
            
            await client.query('COMMIT');
            
            // Fetch updated invoice after commit
            const updatedInvoice = await customerInvoiceRepository.findById(customerInvoiceId);
            
            return {
                payment,
                invoice: updatedInvoice,
                payment_summary: {
                    total_amount: totalAmount,
                    paid_amount: newPaidAmount,
                    remaining_amount: totalAmount - newPaidAmount,
                    payment_status: newPaymentStatus,
                },
            };
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    
    /**
     * Get payment status summary for a bill
     */
    async getBillPaymentStatus(vendorBillId) {
        const bill = await vendorBillRepository.findById(vendorBillId);
        if (!bill) {
            throw new NotFoundError('Vendor bill not found');
        }
        
        const payments = await paymentRepository.findBillPayments(vendorBillId);
        
        const totalAmount = parseFloat(bill.total_amount);
        const paidAmount = parseFloat(bill.paid_amount);
        
        return {
            bill_id: vendorBillId,
            bill_number: bill.bill_number,
            total_amount: totalAmount,
            paid_amount: paidAmount,
            remaining_amount: totalAmount - paidAmount,
            payment_status: bill.payment_status,
            payments,
        };
    }
    
    /**
     * Get payment status summary for an invoice
     */
    async getInvoicePaymentStatus(customerInvoiceId) {
        const invoice = await customerInvoiceRepository.findById(customerInvoiceId);
        if (!invoice) {
            throw new NotFoundError('Customer invoice not found');
        }
        
        const payments = await paymentRepository.findInvoicePayments(customerInvoiceId);
        
        const totalAmount = parseFloat(invoice.total_amount);
        const paidAmount = parseFloat(invoice.paid_amount);
        
        return {
            invoice_id: customerInvoiceId,
            invoice_number: invoice.invoice_number,
            total_amount: totalAmount,
            paid_amount: paidAmount,
            remaining_amount: totalAmount - paidAmount,
            payment_status: invoice.payment_status,
            payments,
        };
    }
}

module.exports = new PaymentService();
