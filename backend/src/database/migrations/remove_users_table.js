/**
 * Migration: Remove users table and add auth fields to contacts
 * User signup data will be stored directly in contacts table
 */

require('dotenv').config();
const db = require('../../config/database');

async function migrate() {
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        console.log('Starting migration: Remove users table, add auth to contacts...');
        
        // Step 1: Add auth fields to contacts table
        console.log('Adding auth fields to contacts table...');
        await client.query(`
            ALTER TABLE contacts 
            ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
            ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'CUSTOMER',
            ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
            ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP,
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE
        `);
        
        // Step 2: Create index for reset token
        console.log('Creating indexes...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_contacts_reset_token ON contacts(password_reset_token);
        `);
        
        // Step 3: Update invoice_payments table - rename paid_by_user_id to paid_by_contact_id
        console.log('Updating invoice_payments table...');
        
        // First, drop the existing foreign key constraint if it exists
        await client.query(`
            ALTER TABLE invoice_payments DROP CONSTRAINT IF EXISTS invoice_payments_paid_by_user_id_fkey;
        `);
        
        // Check if column exists before renaming
        const checkColumn = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'invoice_payments' AND column_name = 'paid_by_user_id'
        `);
        
        if (checkColumn.rows.length > 0) {
            // Set invalid user_id references to NULL before renaming
            await client.query(`
                UPDATE invoice_payments SET paid_by_user_id = NULL 
                WHERE paid_by_user_id NOT IN (SELECT id FROM contacts)
            `);
            
            await client.query(`
                ALTER TABLE invoice_payments RENAME COLUMN paid_by_user_id TO paid_by_contact_id;
            `);
        }
        
        // Check if column exists and add foreign key only if column exists
        const checkNewColumn = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'invoice_payments' AND column_name = 'paid_by_contact_id'
        `);
        
        if (checkNewColumn.rows.length > 0) {
            await client.query(`
                ALTER TABLE invoice_payments 
                ADD CONSTRAINT invoice_payments_paid_by_contact_id_fkey 
                FOREIGN KEY (paid_by_contact_id) REFERENCES contacts(id);
            `);
        }
        
        // Step 4: Drop foreign key constraint from contacts to users (if exists)
        console.log('Dropping user_id foreign key from contacts...');
        await client.query(`
            ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_user_id_fkey;
        `);
        
        // Step 5: Drop user_id column from contacts (if exists)
        console.log('Dropping user_id column from contacts...');
        await client.query(`
            ALTER TABLE contacts DROP COLUMN IF EXISTS user_id;
        `);
        
        // Step 6: Drop users table
        console.log('Dropping users table...');
        await client.query(`
            DROP TABLE IF EXISTS users CASCADE;
        `);
        
        await client.query('COMMIT');
        console.log('Migration completed successfully!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run migration
migrate()
    .then(() => {
        console.log('Migration script finished');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration script failed:', error);
        process.exit(1);
    });
