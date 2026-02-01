/**
 * Migration: Add CONFIRMED status to document_status enum
 */
require('dotenv').config();
const db = require('../../config/database');

async function migrate() {
    const client = await db.getClient();
    
    try {
        console.log('Adding CONFIRMED to document_status enum...');
        
        // Check if CONFIRMED already exists
        const checkResult = await client.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_enum 
                WHERE enumlabel = 'CONFIRMED' 
                AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'document_status')
            ) as exists
        `);
        
        if (checkResult.rows[0].exists) {
            console.log('CONFIRMED status already exists in document_status enum');
            return;
        }
        
        // Add CONFIRMED to the enum
        await client.query(`ALTER TYPE document_status ADD VALUE 'CONFIRMED'`);
        
        console.log('✅ Successfully added CONFIRMED to document_status enum');
        
    } catch (error) {
        console.error('Migration failed:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

// Run migration
migrate()
    .then(() => {
        console.log('Migration completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
