require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const { pool } = require('../../config/database');

async function run() {
    console.log('Getting existing data...');
    
    // Get vendors (contact_type = 'VENDOR')
    const vendors = await pool.query("SELECT id, name FROM contacts WHERE contact_type = 'VENDOR'");
    console.log('=== VENDORS ===');
    vendors.rows.forEach(v => console.log(v.id, '-', v.name));
    
    // Get product categories
    const categories = await pool.query('SELECT id, name FROM product_categories');
    console.log('\n=== CATEGORIES ===');
    categories.rows.forEach(c => console.log(c.id, '-', c.name));
    
    // Get analytical accounts
    const analytics = await pool.query('SELECT id, name FROM analytical_accounts');
    console.log('\n=== ANALYTICAL ACCOUNTS ===');
    analytics.rows.forEach(a => console.log(a.id, '-', a.name));
    
    if (vendors.rows.length === 0 || analytics.rows.length === 0) {
        console.log('\nCannot create rules: Need at least 1 vendor and 1 analytical account');
        process.exit(1);
    }
    
    console.log('\n=== CREATING SAMPLE AUTO ANALYTICAL RULES ===');
    
    // Create rules based on existing data
    const rules = [];
    
    // Rule 1: If we have categories, create category-based rules
    if (categories.rows.length > 0 && analytics.rows.length > 0) {
        for (let i = 0; i < Math.min(categories.rows.length, analytics.rows.length); i++) {
            rules.push({
                name: `Category Rule: ${categories.rows[i].name}`,
                product_category_id: categories.rows[i].id,
                analytical_account_id: analytics.rows[i % analytics.rows.length].id
            });
        }
    }
    
    // Rule 2: Vendor-based rules
    if (vendors.rows.length > 0 && analytics.rows.length > 0) {
        for (let i = 0; i < Math.min(vendors.rows.length, analytics.rows.length); i++) {
            rules.push({
                name: `Vendor Rule: ${vendors.rows[i].name}`,
                partner_id: vendors.rows[i].id,
                analytical_account_id: analytics.rows[i % analytics.rows.length].id
            });
        }
    }
    
    // Insert rules
    for (const rule of rules) {
        try {
            await pool.query(
                `INSERT INTO auto_analytical_models (name, partner_id, partner_tag, product_id, product_category_id, analytical_account_id, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6, true)`,
                [rule.name, rule.partner_id || null, rule.partner_tag || null, rule.product_id || null, rule.product_category_id || null, rule.analytical_account_id]
            );
            console.log('✓ Created rule:', rule.name);
        } catch (err) {
            console.error('✗ Failed to create rule:', rule.name, err.message);
        }
    }
    
    // Show created rules
    const createdRules = await pool.query('SELECT * FROM auto_analytical_models WHERE is_active = true');
    console.log('\n=== ACTIVE RULES ===');
    createdRules.rows.forEach(r => console.log(r.name, '- Analytics:', r.analytical_account_id));
    
    console.log('\nDone! Created', rules.length, 'rules');
    process.exit(0);
}

run().catch(e => {
    console.error('Error:', e);
    process.exit(1);
});
