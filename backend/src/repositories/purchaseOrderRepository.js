const db = require('../config/database');

class PurchaseOrderRepository {
    async findAll(filters = {}, pagination = {}) {
        const { vendor_id, status, from_date, to_date } = filters;
        const { limit = 20, offset = 0 } = pagination;
        
        let query = `
            SELECT 
                po.*,
                c.name as vendor_name,
                c.email as vendor_email
            FROM purchase_orders po
            JOIN contacts c ON po.vendor_id = c.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;
        
        if (vendor_id) {
            query += ` AND po.vendor_id = $${paramCount}`;
            params.push(vendor_id);
            paramCount++;
        }
        
        if (status) {
            query += ` AND po.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }
        
        if (from_date) {
            query += ` AND po.order_date >= $${paramCount}`;
            params.push(from_date);
            paramCount++;
        }
        
        if (to_date) {
            query += ` AND po.order_date <= $${paramCount}`;
            params.push(to_date);
            paramCount++;
        }
        
        query += ` ORDER BY po.order_date DESC, po.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);
        
        const result = await db.query(query, params);
        return result.rows;
    }
    
    async count(filters = {}) {
        const { vendor_id, status, from_date, to_date } = filters;
        
        let query = 'SELECT COUNT(*) FROM purchase_orders WHERE 1=1';
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
        
        if (from_date) {
            query += ` AND order_date >= $${paramCount}`;
            params.push(from_date);
            paramCount++;
        }
        
        if (to_date) {
            query += ` AND order_date <= $${paramCount}`;
            params.push(to_date);
            paramCount++;
        }
        
        const result = await db.query(query, params);
        return parseInt(result.rows[0].count, 10);
    }
    
    async findById(id) {
        const result = await db.query(
            `SELECT 
                po.*,
                c.name as vendor_name,
                c.email as vendor_email
            FROM purchase_orders po
            JOIN contacts c ON po.vendor_id = c.id
            WHERE po.id = $1`,
            [id]
        );
        return result.rows[0];
    }
    
    async findLinesById(purchaseOrderId) {
        const result = await db.query(
            `SELECT 
                pol.*,
                p.name as product_name,
                p.sku as product_sku,
                aa.code as analytical_account_code,
                aa.name as analytical_account_name
            FROM purchase_order_lines pol
            JOIN products p ON pol.product_id = p.id
            LEFT JOIN analytical_accounts aa ON pol.analytical_account_id = aa.id
            WHERE pol.purchase_order_id = $1
            ORDER BY pol.created_at`,
            [purchaseOrderId]
        );
        return result.rows;
    }
    
    async generateOrderNumber(client) {
        const result = await client.query(
            "SELECT generate_document_number('PO', 'po_number_seq') as order_number"
        );
        return result.rows[0].order_number;
    }
    
    async create(data, client) {
        const { order_number, vendor_id, order_date, expected_date, total_amount, notes } = data;
        
        const result = await client.query(
            `INSERT INTO purchase_orders (order_number, vendor_id, order_date, expected_date, total_amount, notes)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [order_number, vendor_id, order_date || new Date(), expected_date, total_amount, notes]
        );
        return result.rows[0];
    }
    
    async createLine(lineData, client) {
        const { purchase_order_id, product_id, quantity, unit_price, subtotal, analytical_account_id } = lineData;
        
        const result = await client.query(
            `INSERT INTO purchase_order_lines 
             (purchase_order_id, product_id, quantity, unit_price, subtotal, analytical_account_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [purchase_order_id, product_id, quantity, unit_price, subtotal, analytical_account_id]
        );
        return result.rows[0];
    }
    
    async updateStatus(id, status, client = db) {
        const result = await client.query(
            `UPDATE purchase_orders SET status = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 RETURNING *`,
            [status, id]
        );
        return result.rows[0];
    }

    async update(id, data, client = db) {
        const { vendor_id, order_date, expected_date, notes, total_amount } = data;
        
        const result = await client.query(
            `UPDATE purchase_orders 
             SET vendor_id = COALESCE($1, vendor_id), 
                 order_date = COALESCE($2, order_date), 
                 expected_date = COALESCE($3, expected_date), 
                 notes = COALESCE($4, notes), 
                 total_amount = COALESCE($5, total_amount), 
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $6
             RETURNING *`,
            [vendor_id, order_date, expected_date, notes, total_amount, id]
        );
        return result.rows[0];
    }

    async deleteLinesForOrder(purchaseOrderId, client = db) {
        await client.query('DELETE FROM purchase_order_lines WHERE purchase_order_id = $1', [purchaseOrderId]);
    }
    
    async delete(id) {
        const result = await db.query('DELETE FROM purchase_orders WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
}

module.exports = new PurchaseOrderRepository();
