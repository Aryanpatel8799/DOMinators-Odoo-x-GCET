const db = require('../config/database');

class VendorBillRepository {
    async findAll(filters = {}, pagination = {}) {
        const { vendor_id, status, payment_status, from_date, to_date } = filters;
        const { limit = 20, offset = 0 } = pagination;
        
        let query = `
            SELECT 
                vb.*,
                c.name as vendor_name,
                c.email as vendor_email
            FROM vendor_bills vb
            JOIN contacts c ON vb.vendor_id = c.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;
        
        if (vendor_id) {
            query += ` AND vb.vendor_id = $${paramCount}`;
            params.push(vendor_id);
            paramCount++;
        }
        
        if (status) {
            query += ` AND vb.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }
        
        if (payment_status) {
            query += ` AND vb.payment_status = $${paramCount}`;
            params.push(payment_status);
            paramCount++;
        }
        
        if (from_date) {
            query += ` AND vb.bill_date >= $${paramCount}`;
            params.push(from_date);
            paramCount++;
        }
        
        if (to_date) {
            query += ` AND vb.bill_date <= $${paramCount}`;
            params.push(to_date);
            paramCount++;
        }
        
        query += ` ORDER BY vb.bill_date DESC, vb.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);
        
        const result = await db.query(query, params);
        return result.rows;
    }
    
    async count(filters = {}) {
        const { vendor_id, status, payment_status, from_date, to_date } = filters;
        
        let query = 'SELECT COUNT(*) FROM vendor_bills WHERE 1=1';
        const params = [];
        let paramCount = 1;
        
        if (vendor_id) {
            query += ` AND vendor_id = $${paramCount}`;
            params.push(vendor_id);
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
            query += ` AND bill_date >= $${paramCount}`;
            params.push(from_date);
            paramCount++;
        }
        
        if (to_date) {
            query += ` AND bill_date <= $${paramCount}`;
            params.push(to_date);
            paramCount++;
        }
        
        const result = await db.query(query, params);
        return parseInt(result.rows[0].count, 10);
    }
    
    async findById(id) {
        const result = await db.query(
            `SELECT 
                vb.*,
                c.name as vendor_name,
                c.email as vendor_email,
                c.tag as vendor_tag
            FROM vendor_bills vb
            JOIN contacts c ON vb.vendor_id = c.id
            WHERE vb.id = $1`,
            [id]
        );
        return result.rows[0];
    }
    
    async findLinesById(vendorBillId) {
        const result = await db.query(
            `SELECT 
                vbl.*,
                p.name as product_name,
                p.sku as product_sku,
                p.category_id as product_category_id,
                aa.code as analytical_account_code,
                aa.name as analytical_account_name
            FROM vendor_bill_lines vbl
            JOIN products p ON vbl.product_id = p.id
            LEFT JOIN analytical_accounts aa ON vbl.analytical_account_id = aa.id
            WHERE vbl.vendor_bill_id = $1
            ORDER BY vbl.created_at`,
            [vendorBillId]
        );
        return result.rows;
    }
    
    async generateBillNumber(client) {
        const result = await client.query(
            "SELECT generate_document_number('BILL', 'vb_number_seq') as bill_number"
        );
        return result.rows[0].bill_number;
    }
    
    async create(data, client) {
        const { bill_number, vendor_id, purchase_order_id, bill_date, due_date, total_amount, notes } = data;
        
        const result = await client.query(
            `INSERT INTO vendor_bills 
             (bill_number, vendor_id, purchase_order_id, bill_date, due_date, total_amount, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [bill_number, vendor_id, purchase_order_id, bill_date || new Date(), due_date, total_amount, notes]
        );
        return result.rows[0];
    }
    
    async createLine(lineData, client) {
        const { vendor_bill_id, product_id, quantity, unit_price, subtotal, analytical_account_id } = lineData;
        
        const result = await client.query(
            `INSERT INTO vendor_bill_lines 
             (vendor_bill_id, product_id, quantity, unit_price, subtotal, analytical_account_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [vendor_bill_id, product_id, quantity, unit_price, subtotal, analytical_account_id]
        );
        return result.rows[0];
    }
    
    async updateStatus(id, status, client = db) {
        const result = await client.query(
            `UPDATE vendor_bills SET status = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 RETURNING *`,
            [status, id]
        );
        return result.rows[0];
    }
    
    async delete(id) {
        const result = await db.query('DELETE FROM vendor_bills WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
}

module.exports = new VendorBillRepository();
