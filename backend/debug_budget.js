// Debug script to check budget dashboard API response
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'shiv_furniture',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'vraj'
});

async function debug() {
    const client = await pool.connect();
    try {
        // Check budgets
        console.log('=== BUDGETS ===');
        const budgets = await client.query('SELECT id, analytical_account_id, budget_amount, period_start, period_end FROM budgets');
        console.log(JSON.stringify(budgets.rows, null, 2));

        // Check cost center performance
        console.log('\n=== COST CENTER PERFORMANCE ===');
        const ccPerf = await client.query('SELECT * FROM cost_center_performance');
        console.log(JSON.stringify(ccPerf.rows, null, 2));

        // Check budget vs actual
        console.log('\n=== BUDGET VS ACTUAL ===');
        const bva = await client.query('SELECT * FROM budget_vs_actual');
        console.log(JSON.stringify(bva.rows, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

debug();
