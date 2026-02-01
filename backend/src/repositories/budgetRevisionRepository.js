const db = require('../config/database');

/**
 * Budget Revision Repository
 * Handles all database operations for budget revision tracking
 */
class BudgetRevisionRepository {
    /**
     * Get all revisions for a budget
     */
    async findByBudgetId(budgetId) {
        const result = await db.query(
            `SELECT 
                br.*,
                u.name as revised_by_name,
                u.email as revised_by_email
            FROM budget_revisions br
            LEFT JOIN users u ON br.revised_by = u.id
            WHERE br.budget_id = $1
            ORDER BY br.revision_number DESC`,
            [budgetId]
        );
        return result.rows;
    }

    /**
     * Get a specific revision
     */
    async findById(id) {
        const result = await db.query(
            `SELECT 
                br.*,
                b.analytical_account_id,
                aa.code as analytical_account_code,
                aa.name as analytical_account_name,
                u.name as revised_by_name
            FROM budget_revisions br
            JOIN budgets b ON br.budget_id = b.id
            JOIN analytical_accounts aa ON b.analytical_account_id = aa.id
            LEFT JOIN users u ON br.revised_by = u.id
            WHERE br.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    /**
     * Create a new revision record
     */
    async create(data, client = db) {
        const { 
            budget_id, 
            previous_amount, 
            new_amount, 
            reason, 
            revised_by 
        } = data;

        // Calculate change metrics
        const changeAmount = new_amount - previous_amount;
        const changePercentage = previous_amount > 0 
            ? ((changeAmount / previous_amount) * 100) 
            : 100;

        // Get next revision number
        const revResult = await client.query(
            'SELECT get_next_revision_number($1) as revision_number',
            [budget_id]
        );
        const revisionNumber = revResult.rows[0].revision_number;

        const result = await client.query(
            `INSERT INTO budget_revisions 
             (budget_id, revision_number, previous_amount, new_amount, change_amount, change_percentage, reason, revised_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [budget_id, revisionNumber, previous_amount, new_amount, changeAmount, changePercentage, reason, revised_by]
        );
        return result.rows[0];
    }

    /**
     * Get revision history with budget details
     */
    async getRevisionHistory(filters = {}, pagination = {}) {
        const { analytical_account_id, from_date, to_date } = filters;
        const { limit = 50, offset = 0 } = pagination;

        let query = `
            SELECT 
                br.*,
                b.period_start,
                b.period_end,
                b.budget_amount as current_budget_amount,
                aa.code as analytical_account_code,
                aa.name as analytical_account_name,
                u.name as revised_by_name
            FROM budget_revisions br
            JOIN budgets b ON br.budget_id = b.id
            JOIN analytical_accounts aa ON b.analytical_account_id = aa.id
            LEFT JOIN users u ON br.revised_by = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (analytical_account_id) {
            query += ` AND b.analytical_account_id = $${paramCount}`;
            params.push(analytical_account_id);
            paramCount++;
        }

        if (from_date) {
            query += ` AND br.created_at >= $${paramCount}`;
            params.push(from_date);
            paramCount++;
        }

        if (to_date) {
            query += ` AND br.created_at <= $${paramCount}`;
            params.push(to_date);
            paramCount++;
        }

        query += ` ORDER BY br.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await db.query(query, params);
        return result.rows;
    }

    /**
     * Count revisions with filters
     */
    async count(filters = {}) {
        const { analytical_account_id, from_date, to_date } = filters;

        let query = `
            SELECT COUNT(*) FROM budget_revisions br
            JOIN budgets b ON br.budget_id = b.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (analytical_account_id) {
            query += ` AND b.analytical_account_id = $${paramCount}`;
            params.push(analytical_account_id);
            paramCount++;
        }

        if (from_date) {
            query += ` AND br.created_at >= $${paramCount}`;
            params.push(from_date);
            paramCount++;
        }

        if (to_date) {
            query += ` AND br.created_at <= $${paramCount}`;
            params.push(to_date);
            paramCount++;
        }

        const result = await db.query(query, params);
        return parseInt(result.rows[0].count, 10);
    }

    /**
     * Get revision summary statistics
     */
    async getRevisionStats(analyticalAccountId = null) {
        let query = `
            SELECT 
                COUNT(*) as total_revisions,
                COUNT(DISTINCT br.budget_id) as budgets_revised,
                SUM(CASE WHEN br.change_amount > 0 THEN 1 ELSE 0 END) as increases,
                SUM(CASE WHEN br.change_amount < 0 THEN 1 ELSE 0 END) as decreases,
                SUM(br.change_amount) as net_change,
                AVG(ABS(br.change_percentage)) as avg_change_percentage
            FROM budget_revisions br
            JOIN budgets b ON br.budget_id = b.id
        `;
        const params = [];

        if (analyticalAccountId) {
            query += ' WHERE b.analytical_account_id = $1';
            params.push(analyticalAccountId);
        }

        const result = await db.query(query, params);
        return result.rows[0];
    }
}

module.exports = new BudgetRevisionRepository();
