const db = require('../config/database');

class PaymentRepository {
    // Bill Payments (Vendor)
    async findBillPayments(vendorBillId) {
        const result = await db.query(
            `SELECT * FROM bill_payments 
             WHERE vendor_bill_id = $1 
             ORDER BY payment_date DESC`,
            [vendorBillId]
        );
        return result.rows;
    }
    
    async findBillPaymentById(id) {
        const result = await db.query('SELECT * FROM bill_payments WHERE id = $1', [id]);
        return result.rows[0];
    }
    
    async generateBillPaymentNumber(client) {
        const result = await client.query(
            "SELECT generate_document_number('BP', 'bp_number_seq') as payment_number"
        );
        return result.rows[0].payment_number;
    }
    
    async createBillPayment(data, client = db) {
        const { payment_number, vendor_bill_id, payment_date, amount, payment_method, reference, notes } = data;
        
        const result = await client.query(
            `INSERT INTO bill_payments 
             (payment_number, vendor_bill_id, payment_date, amount, payment_method, reference, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [payment_number, vendor_bill_id, payment_date || new Date(), amount, payment_method, reference, notes]
        );
        return result.rows[0];
    }
    
    async getTotalBillPayments(vendorBillId, client = db) {
        const result = await client.query(
            'SELECT COALESCE(SUM(amount), 0) as total FROM bill_payments WHERE vendor_bill_id = $1',
            [vendorBillId]
        );
        return parseFloat(result.rows[0].total);
    }
    
    // Get all bill payments for admin
    async findAllBillPayments(pagination = {}) {
        const { limit = 50, offset = 0 } = pagination;
        
        const result = await db.query(
            `SELECT 
                bp.*,
                vb.bill_number,
                vb.total_amount as bill_total,
                c.name as vendor_name,
                c.email as vendor_email
             FROM bill_payments bp
             JOIN vendor_bills vb ON bp.vendor_bill_id = vb.id
             JOIN contacts c ON vb.vendor_id = c.id
             ORDER BY bp.payment_date DESC, bp.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        return result.rows;
    }
    
    // Invoice Payments (Customer)
    async findInvoicePayments(customerInvoiceId) {
        const result = await db.query(
            `SELECT ip.*, c.name as paid_by_name, c.email as paid_by_email
             FROM invoice_payments ip
             LEFT JOIN contacts c ON ip.paid_by_contact_id = c.id
             WHERE ip.customer_invoice_id = $1 
             ORDER BY ip.payment_date DESC`,
            [customerInvoiceId]
        );
        return result.rows;
    }
    
    async findInvoicePaymentById(id) {
        const result = await db.query('SELECT * FROM invoice_payments WHERE id = $1', [id]);
        return result.rows[0];
    }
    
    async generateInvoicePaymentNumber(client) {
        const result = await client.query(
            "SELECT generate_document_number('PAY', 'ip_number_seq') as payment_number"
        );
        return result.rows[0].payment_number;
    }
    
    async createInvoicePayment(data, client = db) {
        const { payment_number, customer_invoice_id, payment_date, amount, payment_method, reference, notes, paid_by_contact_id } = data;
        
        const result = await client.query(
            `INSERT INTO invoice_payments 
             (payment_number, customer_invoice_id, payment_date, amount, payment_method, reference, notes, paid_by_contact_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [payment_number, customer_invoice_id, payment_date || new Date(), amount, payment_method, reference, notes, paid_by_contact_id]
        );
        return result.rows[0];
    }
    
    async getTotalInvoicePayments(customerInvoiceId, client = db) {
        const result = await client.query(
            'SELECT COALESCE(SUM(amount), 0) as total FROM invoice_payments WHERE customer_invoice_id = $1',
            [customerInvoiceId]
        );
        return parseFloat(result.rows[0].total);
    }
    
    async findInvoicePaymentsByUserId(userId, pagination = {}) {
        const { limit = 20, offset = 0 } = pagination;
        
        const result = await db.query(
            `SELECT 
                ip.*,
                ci.invoice_number,
                ci.total_amount as invoice_total
             FROM invoice_payments ip
             JOIN customer_invoices ci ON ip.customer_invoice_id = ci.id
             WHERE ip.paid_by_contact_id = $1
             ORDER BY ip.payment_date DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );
        return result.rows;
    }
    
    // Get all invoice payments for admin
    async findAllInvoicePayments(pagination = {}) {
        const { limit = 50, offset = 0 } = pagination;
        
        const result = await db.query(
            `SELECT 
                ip.*,
                ci.invoice_number,
                ci.total_amount as invoice_total,
                c.name as customer_name,
                c.email as customer_email
             FROM invoice_payments ip
             JOIN customer_invoices ci ON ip.customer_invoice_id = ci.id
             JOIN contacts c ON ci.customer_id = c.id
             ORDER BY ip.payment_date DESC, ip.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        return result.rows;
    }
}

module.exports = new PaymentRepository();
