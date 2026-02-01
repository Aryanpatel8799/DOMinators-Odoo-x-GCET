// Script to run the budget views migration
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Database configuration
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'shiv_furniture',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'vraj'
});

async function runMigration() {
    const client = await pool.connect();
    
    try {
        console.log('Connected to database');
        
        // Read migration file
        const migrationPath = path.join(__dirname, 'src', 'database', 'migrations', '007_update_budget_views_for_po.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('Running migration: 007_update_budget_views_for_po.sql');
        
        // Execute the migration
        await client.query(sql);
        
        console.log('Migration completed successfully!');
        
        // Verify the views were created
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'public' 
            AND table_name IN ('budget_vs_actual', 'cost_center_performance', 'budget_achievement_summary')
        `);
        
        console.log('Updated views:', result.rows.map(r => r.table_name));

        // Test cost_center_performance view
        const ccResult = await client.query('SELECT * FROM cost_center_performance LIMIT 5');
        console.log('Cost center performance data:');
        console.log(JSON.stringify(ccResult.rows, null, 2));
        
    } catch (error) {
        console.error('Migration failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
