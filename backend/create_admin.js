require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./src/config/database');

async function createAdmin() {
    const hash = await bcrypt.hash('admin123', 10);
    
    // Check if admin exists
    const existing = await db.query('SELECT id FROM contacts WHERE email = $1', ['admin@shivfurniture.com']);
    
    if (existing.rows.length > 0) {
        // Update existing
        await db.query(`
            UPDATE contacts SET password_hash = $1, role = 'ADMIN', is_active = true 
            WHERE email = 'admin@shivfurniture.com'
        `, [hash]);
        console.log('Admin contact updated!');
    } else {
        // Insert new
        await db.query(`
            INSERT INTO contacts (name, email, phone, contact_type, password_hash, role, is_active) 
            VALUES ('Admin', 'admin@shivfurniture.com', '1234567890', 'CUSTOMER', $1, 'ADMIN', true)
        `, [hash]);
        console.log('Admin contact created!');
    }
    
    console.log('Email: admin@shivfurniture.com');
    console.log('Password: admin123');
    process.exit(0);
}

createAdmin().catch(e => {
    console.error('Error:', e);
    process.exit(1);
});
