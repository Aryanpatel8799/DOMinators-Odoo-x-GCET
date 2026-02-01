const db = require('../config/database');
const budgetRepository = require('../repositories/budgetRepository');
const budgetRevisionRepository = require('../repositories/budgetRevisionRepository');
const analyticalAccountRepository = require('../repositories/analyticalAccountRepository');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/errors');

/**
 * Budget Service
 * 
 * Handles budget creation and updates with overlap validation (TASK 4).
 * 
 * BUSINESS RULE: For a given analytical_account_id, no two budgets
 * may have overlapping date ranges. This prevents double-counting
 * in budget reports and ensures accurate financial tracking.
 */
class BudgetService {
    /**
     * Check if a budget period overlaps with existing budgets
     * 
     * Two periods overlap if: start1 <= end2 AND end1 >= start2
     * 
     * @param {string} analyticalAccountId - The analytical account UUID
     * @param {Date|string} periodStart - Budget period start date
     * @param {Date|string} periodEnd - Budget period end date
     * @param {string|null} excludeBudgetId - Budget ID to exclude (for updates)
     * @param {object} client - Optional DB client for transaction
     * @returns {Array} - List of overlapping budgets (empty if none)
     */
    async checkOverlap(analyticalAccountId, periodStart, periodEnd, excludeBudgetId = null, client = db) {
        let query = `
            SELECT id, period_start, period_end, budget_amount
            FROM budgets
            WHERE analytical_account_id = $1
              AND period_start <= $3
              AND period_end >= $2
        `;
        const params = [analyticalAccountId, periodStart, periodEnd];
        
        if (excludeBudgetId) {
            query += ` AND id != $4`;
            params.push(excludeBudgetId);
        }
        
        const result = await client.query(query, params);
        return result.rows;
    }

    /**
     * Create a new budget with overlap validation
     * 
     * @param {Object} budgetData - Budget data
     * @param {string} budgetData.analytical_account_id - The analytical account UUID
     * @param {Date|string} budgetData.period_start - Budget period start date
     * @param {Date|string} budgetData.period_end - Budget period end date
     * @param {number} budgetData.budget_amount - Planned budget amount
     * @param {string} budgetData.description - Optional description
     * @returns {Object} - Created budget
     * @throws {NotFoundError} - If analytical account doesn't exist
     * @throws {BadRequestError} - If period_end <= period_start
     * @throws {ConflictError} - If period overlaps with existing budget
     */
    async create(budgetData) {
        const { analytical_account_id, period_start, period_end, budget_amount, description } = budgetData;
        
        // Validate analytical account exists
        const analyticalAccount = await analyticalAccountRepository.findById(analytical_account_id);
        if (!analyticalAccount) {
            throw new NotFoundError('Analytical account not found');
        }
        
        // Validate period dates
        if (new Date(period_end) <= new Date(period_start)) {
            throw new BadRequestError('Period end date must be after period start date');
        }
        
        // Check for overlapping budgets (TASK 4)
        const overlaps = await this.checkOverlap(analytical_account_id, period_start, period_end);
        
        if (overlaps.length > 0) {
            const overlapInfo = overlaps[0];
            throw new ConflictError(
                `Overlapping budget period for analytical account: existing budget covers ${overlapInfo.period_start} to ${overlapInfo.period_end}`
            );
        }
        
        return budgetRepository.create(budgetData);
    }

    /**
     * Update a budget with overlap validation and revision tracking
     * 
     * Note: We allow updating budget_amount and description without
     * period change checks. Period changes require overlap validation.
     * Budget amount changes are tracked in budget_revisions table.
     * 
     * @param {string} budgetId - Budget UUID to update
     * @param {Object} updates - Fields to update
     * @param {string} userId - User making the update (for revision tracking)
     * @param {string} reason - Reason for the revision
     * @returns {Object} - Updated budget with revision info
     * @throws {NotFoundError} - If budget doesn't exist
     * @throws {ConflictError} - If new period overlaps with existing budget
     */
    async update(budgetId, updates, userId = null, reason = null) {
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            const budget = await budgetRepository.findById(budgetId);
            
            if (!budget) {
                throw new NotFoundError('Budget not found');
            }
            
            // If period is being changed, validate no overlap
            const newPeriodStart = updates.period_start || budget.period_start;
            const newPeriodEnd = updates.period_end || budget.period_end;
            
            // Only check overlap if period dates are changing
            if (updates.period_start || updates.period_end) {
                // Validate period dates
                if (new Date(newPeriodEnd) <= new Date(newPeriodStart)) {
                    throw new BadRequestError('Period end date must be after period start date');
                }
                
                // Check for overlapping budgets, excluding current budget
                const overlaps = await this.checkOverlap(
                    budget.analytical_account_id,
                    newPeriodStart,
                    newPeriodEnd,
                    budgetId,
                    client
                );
                
                if (overlaps.length > 0) {
                    const overlapInfo = overlaps[0];
                    throw new ConflictError(
                        `Overlapping budget period for analytical account: existing budget covers ${overlapInfo.overlapping_period_start} to ${overlapInfo.overlapping_period_end}`
                    );
                }
            }
            
            // Track budget amount revision if amount is changing
            let revision = null;
            if (updates.budget_amount !== undefined && 
                parseFloat(updates.budget_amount) !== parseFloat(budget.budget_amount)) {
                revision = await budgetRevisionRepository.create({
                    budget_id: budgetId,
                    previous_amount: budget.budget_amount,
                    new_amount: updates.budget_amount,
                    reason: reason || 'Budget amount updated',
                    revised_by: userId,
                }, client);
            }
            
            // Update the budget
            const result = await client.query(
                `UPDATE budgets SET 
                    budget_amount = COALESCE($1, budget_amount),
                    description = COALESCE($2, description),
                    period_start = COALESCE($3, period_start),
                    period_end = COALESCE($4, period_end),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $5 RETURNING *`,
                [
                    updates.budget_amount,
                    updates.description,
                    updates.period_start,
                    updates.period_end,
                    budgetId
                ]
            );
            
            await client.query('COMMIT');
            
            const updatedBudget = await budgetRepository.findById(budgetId);
            return { ...updatedBudget, revision };
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get budget revisions
     * 
     * @param {string} budgetId - Budget UUID
     * @returns {Array} - List of revisions
     */
    async getRevisions(budgetId) {
        const budget = await budgetRepository.findById(budgetId);
        if (!budget) {
            throw new NotFoundError('Budget not found');
        }
        return budgetRevisionRepository.findByBudgetId(budgetId);
    }

    /**
     * Get all revision history with filters
     */
    async getRevisionHistory(filters = {}, pagination = {}) {
        return budgetRevisionRepository.getRevisionHistory(filters, pagination);
    }

    /**
     * Get revision statistics
     */
    async getRevisionStats(analyticalAccountId = null) {
        return budgetRevisionRepository.getRevisionStats(analyticalAccountId);
    }

    /**
     * Delete a budget
     * 
     * @param {string} budgetId - Budget UUID to delete
     * @returns {Object} - Deleted budget
     * @throws {NotFoundError} - If budget doesn't exist
     */
    async delete(budgetId) {
        const budget = await budgetRepository.findById(budgetId);
        
        if (!budget) {
            throw new NotFoundError('Budget not found');
        }
        
        return budgetRepository.delete(budgetId);
    }

    /**
     * Get budget with actual data from VIEW
     * 
     * @param {string} budgetId - Budget UUID
     * @returns {Object} - Budget with actual expense/revenue data
     */
    async getBudgetWithActuals(budgetId) {
        const budget = await budgetRepository.findById(budgetId);
        
        if (!budget) {
            throw new NotFoundError('Budget not found');
        }
        
        // Get from budget_vs_actual view
        const result = await db.query(
            'SELECT * FROM budget_vs_actual WHERE budget_id = $1',
            [budgetId]
        );
        
        return result.rows[0] || budget;
    }

    /**
     * Get budget achievement summary (for charts)
     * Monthly aggregated data by cost center
     */
    async getBudgetAchievementSummary(filters = {}) {
        const { analytical_account_id, year } = filters;
        
        let query = 'SELECT * FROM budget_achievement_summary WHERE 1=1';
        const params = [];
        let paramCount = 1;
        
        if (analytical_account_id) {
            query += ` AND analytical_account_id = $${paramCount}`;
            params.push(analytical_account_id);
            paramCount++;
        }
        
        if (year) {
            query += ` AND year = $${paramCount}`;
            params.push(year);
            paramCount++;
        }
        
        query += ' ORDER BY year, month, analytical_account_code';
        
        const result = await db.query(query, params);
        return result.rows;
    }

    /**
     * Get budget trend data (time-series for line charts)
     */
    async getBudgetTrend(filters = {}) {
        const { year, months = 12 } = filters;
        
        let query = 'SELECT * FROM budget_trend';
        const params = [];
        
        if (year) {
            query += ' WHERE period_year = $1';
            params.push(year);
        }
        
        query += ' ORDER BY period_year, period_month LIMIT $' + (params.length + 1);
        params.push(months);
        
        const result = await db.query(query, params);
        return result.rows;
    }

    /**
     * Get cost center performance data
     */
    async getCostCenterPerformance(filters = {}) {
        const { analytical_account_id } = filters;
        
        let query = 'SELECT * FROM cost_center_performance';
        const params = [];
        
        if (analytical_account_id) {
            query += ' WHERE analytical_account_id = $1';
            params.push(analytical_account_id);
        }
        
        query += ' ORDER BY analytical_account_code';
        
        const result = await db.query(query, params);
        return result.rows;
    }

    /**
     * Get comprehensive budget dashboard data
     * Includes summary, trends, and top performers
     */
    async getBudgetDashboard(filters = {}) {
        const { period_start, period_end, year } = filters;
        
        // Get budget vs actual report
        const budgetVsActual = await budgetRepository.getBudgetVsActual({ period_start, period_end });
        
        // Calculate summary
        const summary = budgetVsActual.reduce((acc, row) => {
            acc.total_budget += parseFloat(row.budget_amount) || 0;
            acc.total_expense += parseFloat(row.actual_expense) || 0;
            acc.total_revenue += parseFloat(row.actual_revenue) || 0;
            acc.total_net_actual += parseFloat(row.net_actual) || 0;
            acc.total_remaining += parseFloat(row.remaining_amount) || 0;
            return acc;
        }, {
            total_budget: 0,
            total_expense: 0,
            total_revenue: 0,
            total_net_actual: 0,
            total_remaining: 0,
        });
        
        summary.overall_utilization = summary.total_budget > 0 
            ? ((summary.total_net_actual / summary.total_budget) * 100).toFixed(2)
            : 0;
        
        // Get cost center performance
        const costCenterPerformance = await this.getCostCenterPerformance();
        
        // Get revision stats
        const revisionStats = await this.getRevisionStats();
        
        // Top over-budget cost centers
        const overBudget = budgetVsActual
            .filter(b => parseFloat(b.remaining_amount) < 0)
            .sort((a, b) => parseFloat(a.remaining_amount) - parseFloat(b.remaining_amount))
            .slice(0, 5);
        
        // Top under-utilized cost centers
        const underUtilized = budgetVsActual
            .filter(b => parseFloat(b.utilization_percentage) < 50 && parseFloat(b.budget_amount) > 0)
            .sort((a, b) => parseFloat(a.utilization_percentage) - parseFloat(b.utilization_percentage))
            .slice(0, 5);
        
        return {
            summary,
            budget_count: budgetVsActual.length,
            cost_center_count: costCenterPerformance.length,
            revision_stats: revisionStats,
            over_budget: overBudget,
            under_utilized: underUtilized,
            by_cost_center: costCenterPerformance,
        };
    }
}

module.exports = new BudgetService();
