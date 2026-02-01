require('dotenv').config();
const db = require('./src/config/database');

async function testBudgetQuery() {
    const result = await db.query(`
        SELECT 
            b.*,
            aa.name as analytical_account_name,
            COALESCE(po_used.used_amount, 0) as used_amount
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
    `);
    
    console.log('Budget Query Results:');
    console.log(JSON.stringify(result.rows, null, 2));
    process.exit(0);
}

testBudgetQuery().catch(e => {
    console.error(e);
    process.exit(1);
});
