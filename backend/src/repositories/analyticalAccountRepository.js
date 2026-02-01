const db = require('../config/database');

class AnalyticalAccountRepository {
    async findAll(filters = {}, pagination = {}) {
        const { is_active, search } = filters;
        const { limit = 20, offset = 0 } = pagination;
        
        // Join with budgets to get budget_amount and calculate consumed from purchase order lines
        let query = `
            SELECT 
                aa.*,
                COALESCE(b.budget_amount, 0) as budget_amount,
                COALESCE(po_consumed.total_consumed, 0) as consumed_amount,
                COALESCE(b.budget_amount, 0) - COALESCE(po_consumed.total_consumed, 0) as remaining_amount
            FROM analytical_accounts aa
            LEFT JOIN budgets b ON aa.id = b.analytical_account_id 
                AND CURRENT_DATE BETWEEN b.period_start AND b.period_end
            LEFT JOIN (
                -- Calculate consumed amount from purchase order lines
                SELECT 
                    pol.analytical_account_id,
                    SUM(pol.subtotal) as total_consumed
                FROM purchase_order_lines pol
                JOIN purchase_orders po ON pol.purchase_order_id = po.id
                WHERE pol.analytical_account_id IS NOT NULL
                GROUP BY pol.analytical_account_id
            ) po_consumed ON aa.id = po_consumed.analytical_account_id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;
        
        if (is_active !== undefined) {
            query += ` AND aa.is_active = $${paramCount}`;
            params.push(is_active);
            paramCount++;
        }
        
        if (search) {
            query += ` AND (aa.name ILIKE $${paramCount} OR aa.code ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }
        
        query += ` ORDER BY aa.code LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);
        
        const result = await db.query(query, params);
        return result.rows;
    }
    
    async count(filters = {}) {
        const { is_active, search } = filters;
        
        let query = 'SELECT COUNT(*) FROM analytical_accounts WHERE 1=1';
        const params = [];
        let paramCount = 1;
        
        if (is_active !== undefined) {
            query += ` AND is_active = $${paramCount}`;
            params.push(is_active);
            paramCount++;
        }
        
        if (search) {
            query += ` AND (name ILIKE $${paramCount} OR code ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }
        
        const result = await db.query(query, params);
        return parseInt(result.rows[0].count, 10);
    }
    
    async findById(id) {
        const result = await db.query('SELECT * FROM analytical_accounts WHERE id = $1', [id]);
        return result.rows[0];
    }
    
    async findByCode(code) {
        const result = await db.query('SELECT * FROM analytical_accounts WHERE code = $1', [code]);
        return result.rows[0];
    }
    
    async create(data) {
        const { code, name, description } = data;
        const result = await db.query(
            'INSERT INTO analytical_accounts (code, name, description) VALUES ($1, $2, $3) RETURNING *',
            [code, name, description]
        );
        return result.rows[0];
    }
    
    async update(id, updates) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        
        const allowedFields = ['name', 'description', 'is_active'];
        
        Object.entries(updates).forEach(([key, value]) => {
            if (allowedFields.includes(key) && value !== undefined) {
                fields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        });
        
        if (fields.length === 0) return this.findById(id);
        
        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        
        const result = await db.query(
            `UPDATE analytical_accounts SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );
        return result.rows[0];
    }
    
    async delete(id) {
        const result = await db.query('DELETE FROM analytical_accounts WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
}

module.exports = new AnalyticalAccountRepository();
