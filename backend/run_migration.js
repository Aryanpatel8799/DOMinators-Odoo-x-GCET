// Script to run database migrations
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
        const migrationPath = path.join(__dirname, 'src', 'database', 'migrations', '002_feature_additions.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('Running migration: 002_feature_additions.sql');
        
        // Execute the migration
        await client.query(sql);
        
        console.log('Migration completed successfully!');
        
        // Verify the views were created
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'public' 
            AND table_name IN ('budget_achievement_summary', 'budget_trend', 'cost_center_performance')
        `);
        
        console.log('Created views:', result.rows.map(r => r.table_name));
        
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
