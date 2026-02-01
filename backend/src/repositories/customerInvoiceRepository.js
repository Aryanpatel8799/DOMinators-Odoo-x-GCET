const db = require('../config/database');

class CustomerInvoiceRepository {
    async findAll(filters = {}, pagination = {}) {
        const { customer_id, status, payment_status, from_date, to_date } = filters;
        const { limit = 20, offset = 0 } = pagination;
        
        let query = `
            SELECT 
                ci.*,
                c.name as customer_name,
                c.email as customer_email
            FROM customer_invoices ci
            JOIN contacts c ON ci.customer_id = c.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;
        
        if (customer_id) {
            query += ` AND ci.customer_id = $${paramCount}`;
            params.push(customer_id);
            paramCount++;
        }
        
        if (status) {
            query += ` AND ci.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }
        
        if (payment_status) {
            query += ` AND ci.payment_status = $${paramCount}`;
            params.push(payment_status);
            paramCount++;
        }
        
        if (from_date) {
            query += ` AND ci.invoice_date >= $${paramCount}`;
            params.push(from_date);
            paramCount++;
        }
        
        if (to_date) {
            query += ` AND ci.invoice_date <= $${paramCount}`;
            params.push(to_date);
            paramCount++;
        }
        
        query += ` ORDER BY ci.invoice_date DESC, ci.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);
        
        const result = await db.query(query, params);
        return result.rows;
    }
    
    async count(filters = {}) {
        const { customer_id, status, payment_status, from_date, to_date } = filters;
        
        let query = 'SELECT COUNT(*) FROM customer_invoices WHERE 1=1';
        const params = [];
        let paramCount = 1;
        
        if (customer_id) {
            query += ` AND customer_id = $${paramCount}`;
            params.push(customer_id);
            paramCount++;
        }
        
        if (status) {
            query += ` AND status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }
        
        if (payment_status) {
            query += ` AND payment_status = $${paramCount}`;
            params.push(payment_status);
            paramCount++;
        }
        
        if (from_date) {
            query += ` AND invoice_date >= $${paramCount}`;
            params.push(from_date);
            paramCount++;
        }
        
        if (to_date) {
            query += ` AND invoice_date <= $${paramCount}`;
            params.push(to_date);
            paramCount++;
        }
        
        const result = await db.query(query, params);
        return parseInt(result.rows[0].count, 10);
    }
    
    async findById(id) {
        const result = await db.query(
            `SELECT 
                ci.*,
                c.name as customer_name,
                c.email as customer_email,
                c.tag as customer_tag,
                c.id as customer_contact_id
            FROM customer_invoices ci
            JOIN contacts c ON ci.customer_id = c.id
            WHERE ci.id = $1`,
            [id]
        );
        return result.rows[0];
    }
    
    async findByCustomerUserId(userId, filters = {}, pagination = {}) {
        const { status, payment_status } = filters;
        const { limit = 20, offset = 0 } = pagination;
        
        let query = `
            SELECT 
                ci.*,
                c.name as customer_name,
                c.email as customer_email
            FROM customer_invoices ci
            JOIN contacts c ON ci.customer_id = c.id
            WHERE c.id = $1
        `;
        const params = [userId];
        let paramCount = 2;
        
        if (status) {
            query += ` AND ci.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }
        
        if (payment_status) {
            query += ` AND ci.payment_status = $${paramCount}`;
            params.push(payment_status);
            paramCount++;
        }
        
        query += ` ORDER BY ci.invoice_date DESC, ci.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);
        
        const result = await db.query(query, params);
        return result.rows;
    }
    
    async countByCustomerUserId(userId, filters = {}) {
        const { status, payment_status } = filters;
        
        let query = `
            SELECT COUNT(*) FROM customer_invoices ci
            JOIN contacts c ON ci.customer_id = c.id
            WHERE c.id = $1
        `;
        const params = [userId];
        let paramCount = 2;
        
        if (status) {
            query += ` AND ci.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }
        
        if (payment_status) {
            query += ` AND ci.payment_status = $${paramCount}`;
            params.push(payment_status);
            paramCount++;
        }
        
        const result = await db.query(query, params);
        return parseInt(result.rows[0].count, 10);
    }
    
    async findLinesById(customerInvoiceId) {
        const result = await db.query(
            `SELECT 
                cil.*,
                p.name as product_name,
                p.sku as product_sku,
                p.category_id as product_category_id,
                aa.code as analytical_account_code,
                aa.name as analytical_account_name
            FROM customer_invoice_lines cil
            JOIN products p ON cil.product_id = p.id
            LEFT JOIN analytical_accounts aa ON cil.analytical_account_id = aa.id
            WHERE cil.customer_invoice_id = $1
            ORDER BY cil.created_at`,
            [customerInvoiceId]
        );
        return result.rows;
    }
    
    async generateInvoiceNumber(client) {
        const result = await client.query(
            "SELECT generate_document_number('INV', 'ci_number_seq') as invoice_number"
        );
        return result.rows[0].invoice_number;
    }
    
    async create(data, client) {
        const { invoice_number, customer_id, sales_order_id, invoice_date, due_date, total_amount, notes, status } = data;
        
        const result = await client.query(
            `INSERT INTO customer_invoices 
             (invoice_number, customer_id, sales_order_id, invoice_date, due_date, total_amount, notes, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [invoice_number, customer_id, sales_order_id, invoice_date || new Date(), due_date, total_amount, notes, status || 'DRAFT']
        );
        return result.rows[0];
    }
    
    async createLine(lineData, client) {
        const { customer_invoice_id, product_id, quantity, unit_price, subtotal, analytical_account_id } = lineData;
        
        const result = await client.query(
            `INSERT INTO customer_invoice_lines 
             (customer_invoice_id, product_id, quantity, unit_price, subtotal, analytical_account_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [customer_invoice_id, product_id, quantity, unit_price, subtotal, analytical_account_id]
        );
        return result.rows[0];
    }
    
    async updateStatus(id, status, client = db) {
        const result = await client.query(
            `UPDATE customer_invoices SET status = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 RETURNING *`,
            [status, id]
        );
        return result.rows[0];
    }
    
    async delete(id) {
        const result = await db.query('DELETE FROM customer_invoices WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
}

module.exports = new CustomerInvoiceRepository();
