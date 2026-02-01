// Script to add vendor_id to products table
const { Pool } = require('pg');
require('dotenv').config();

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
        
        // Add vendor_id column to products
        await client.query(`
            ALTER TABLE products ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES contacts(id);
        `);
        
        console.log('Migration completed successfully! Added vendor_id column to products table.');
        
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
