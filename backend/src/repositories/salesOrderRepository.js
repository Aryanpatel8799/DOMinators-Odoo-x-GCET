const db = require('../config/database');

class SalesOrderRepository {
    async findAll(filters = {}, pagination = {}) {
        const { customer_id, status, from_date, to_date } = filters;
        const { limit = 20, offset = 0 } = pagination;
        
        let query = `
            SELECT 
                so.*,
                c.name as customer_name,
                c.email as customer_email
            FROM sales_orders so
            JOIN contacts c ON so.customer_id = c.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;
        
        if (customer_id) {
            query += ` AND so.customer_id = $${paramCount}`;
            params.push(customer_id);
            paramCount++;
        }
        
        if (status) {
            query += ` AND so.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }
        
        if (from_date) {
            query += ` AND so.order_date >= $${paramCount}`;
            params.push(from_date);
            paramCount++;
        }
        
        if (to_date) {
            query += ` AND so.order_date <= $${paramCount}`;
            params.push(to_date);
            paramCount++;
        }
        
        query += ` ORDER BY so.order_date DESC, so.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);
        
        const result = await db.query(query, params);
        return result.rows;
    }
    
    async count(filters = {}) {
        const { customer_id, status, from_date, to_date } = filters;
        
        let query = 'SELECT COUNT(*) FROM sales_orders WHERE 1=1';
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
                so.*,
                c.name as customer_name,
                c.email as customer_email
            FROM sales_orders so
            JOIN contacts c ON so.customer_id = c.id
            WHERE so.id = $1`,
            [id]
        );
        return result.rows[0];
    }
    
    async findLinesById(salesOrderId) {
        const result = await db.query(
            `SELECT 
                sol.*,
                p.name as product_name,
                p.sku as product_sku,
                aa.code as analytical_account_code,
                aa.name as analytical_account_name
            FROM sales_order_lines sol
            JOIN products p ON sol.product_id = p.id
            LEFT JOIN analytical_accounts aa ON sol.analytical_account_id = aa.id
            WHERE sol.sales_order_id = $1
            ORDER BY sol.created_at`,
            [salesOrderId]
        );
        return result.rows;
    }
    
    async generateOrderNumber(client) {
        const result = await client.query(
            "SELECT generate_document_number('SO', 'so_number_seq') as order_number"
        );
        return result.rows[0].order_number;
    }
    
    async create(data, client) {
        const { order_number, customer_id, order_date, expected_date, total_amount, notes } = data;
        
        const result = await client.query(
            `INSERT INTO sales_orders (order_number, customer_id, order_date, expected_date, total_amount, notes)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [order_number, customer_id, order_date || new Date(), expected_date, total_amount, notes]
        );
        return result.rows[0];
    }
    
    async createLine(lineData, client) {
        const { sales_order_id, product_id, quantity, unit_price, subtotal, analytical_account_id } = lineData;
        
        const result = await client.query(
            `INSERT INTO sales_order_lines 
             (sales_order_id, product_id, quantity, unit_price, subtotal, analytical_account_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [sales_order_id, product_id, quantity, unit_price, subtotal, analytical_account_id]
        );
        return result.rows[0];
    }
    
    async updateStatus(id, status, client = db) {
        const result = await client.query(
            `UPDATE sales_orders SET status = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 RETURNING *`,
            [status, id]
        );
        return result.rows[0];
    }
    
    async delete(id) {
        const result = await db.query('DELETE FROM sales_orders WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
}

module.exports = new SalesOrderRepository();
