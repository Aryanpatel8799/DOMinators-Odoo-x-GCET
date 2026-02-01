const db = require('../config/database');

class BudgetRepository {
    async findAll(filters = {}, pagination = {}) {
        const { analytical_account_id, period_start, period_end } = filters;
        const { limit = 20, offset = 0 } = pagination;
        
        // Calculate Used Amount from purchase order lines within budget period
        // Remaining = Budget Amount - Used Amount
        let query = `
            SELECT 
                b.*,
                aa.code as analytical_account_code,
                aa.name as analytical_account_name,
                COALESCE(po_used.used_amount, 0) as used_amount,
                COALESCE(po_used.used_amount, 0) as actual_amount,
                b.budget_amount - COALESCE(po_used.used_amount, 0) as remaining_amount
            FROM budgets b
            JOIN analytical_accounts aa ON b.analytical_account_id = aa.id
            LEFT JOIN (
                SELECT 
                    pol.analytical_account_id,
                    b_inner.id as budget_id,
                    SUM(pol.subtotal) as used_amount
                FROM purchase_order_lines pol
                JOIN purchase_orders po ON pol.purchase_order_id = po.id
                JOIN budgets b_inner ON pol.analytical_account_id = b_inner.analytical_account_id
                    AND po.order_date BETWEEN b_inner.period_start AND b_inner.period_end
                WHERE pol.analytical_account_id IS NOT NULL
                GROUP BY pol.analytical_account_id, b_inner.id
            ) po_used ON b.id = po_used.budget_id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;
        
        if (analytical_account_id) {
            query += ` AND b.analytical_account_id = $${paramCount}`;
            params.push(analytical_account_id);
            paramCount++;
        }
        
        if (period_start) {
            query += ` AND b.period_start >= $${paramCount}`;
            params.push(period_start);
            paramCount++;
        }
        
        if (period_end) {
            query += ` AND b.period_end <= $${paramCount}`;
            params.push(period_end);
            paramCount++;
        }
        
        query += ` ORDER BY b.period_start DESC, aa.code LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);
        
        const result = await db.query(query, params);
        return result.rows;
    }
    
    async count(filters = {}) {
        const { analytical_account_id, period_start, period_end } = filters;
        
        let query = 'SELECT COUNT(*) FROM budgets WHERE 1=1';
        const params = [];
        let paramCount = 1;
        
        if (analytical_account_id) {
            query += ` AND analytical_account_id = $${paramCount}`;
            params.push(analytical_account_id);
            paramCount++;
        }
        
        if (period_start) {
            query += ` AND period_start >= $${paramCount}`;
            params.push(period_start);
            paramCount++;
        }
        
        if (period_end) {
            query += ` AND period_end <= $${paramCount}`;
            params.push(period_end);
            paramCount++;
        }
        
        const result = await db.query(query, params);
        return parseInt(result.rows[0].count, 10);
    }
    
    async findById(id) {
        const result = await db.query(
            `SELECT 
                b.*,
                aa.code as analytical_account_code,
                aa.name as analytical_account_name
            FROM budgets b
            JOIN analytical_accounts aa ON b.analytical_account_id = aa.id
            WHERE b.id = $1`,
            [id]
        );
        return result.rows[0];
    }
    
    async findByAccountAndPeriod(analyticalAccountId, periodStart, periodEnd) {
        const result = await db.query(
            `SELECT * FROM budgets 
             WHERE analytical_account_id = $1 
             AND period_start = $2 
             AND period_end = $3`,
            [analyticalAccountId, periodStart, periodEnd]
        );
        return result.rows[0];
    }
    
    async create(data) {
        const { analytical_account_id, period_start, period_end, budget_amount, description } = data;
        
        const result = await db.query(
            `INSERT INTO budgets (analytical_account_id, period_start, period_end, budget_amount, description)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [analytical_account_id, period_start, period_end, budget_amount, description]
        );
        return result.rows[0];
    }
    
    async update(id, updates) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        
        // Allow updating budget_amount, description, and period dates
        const allowedFields = ['budget_amount', 'description', 'period_start', 'period_end'];
        
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
            `UPDATE budgets SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );
        return result.rows[0];
    }
    
    async delete(id) {
        const result = await db.query('DELETE FROM budgets WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
    
    async getBudgetVsActual(filters = {}) {
        const { analytical_account_id, period_start, period_end } = filters;
        
        let query = 'SELECT * FROM budget_vs_actual WHERE 1=1';
        const params = [];
        let paramCount = 1;
        
        if (analytical_account_id) {
            query += ` AND analytical_account_id = $${paramCount}`;
            params.push(analytical_account_id);
            paramCount++;
        }
        
        if (period_start) {
            query += ` AND period_start >= $${paramCount}`;
            params.push(period_start);
            paramCount++;
        }
        
        if (period_end) {
            query += ` AND period_end <= $${paramCount}`;
            params.push(period_end);
            paramCount++;
        }
        
        query += ' ORDER BY analytical_account_code, period_start';
        
        const result = await db.query(query, params);
        return result.rows;
    }

    // Get purchase order entries for a specific analytical account
    async getPurchaseOrderEntries(analyticalAccountId) {
        const result = await db.query(
            `SELECT 
                pol.id,
                pol.quantity,
                pol.unit_price,
                pol.subtotal,
                pol.created_at,
                p.name as product_name,
                p.sku as product_sku,
                po.order_number,
                po.order_date,
                c.name as vendor_name
            FROM purchase_order_lines pol
            JOIN purchase_orders po ON pol.purchase_order_id = po.id
            JOIN products p ON pol.product_id = p.id
            JOIN contacts c ON po.vendor_id = c.id
            WHERE pol.analytical_account_id = $1
            ORDER BY po.order_date DESC, pol.created_at DESC`,
            [analyticalAccountId]
        );
        return result.rows;
    }
}

module.exports = new BudgetRepository();
