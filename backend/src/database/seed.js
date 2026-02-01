require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function seedDatabase() {
    const client = await pool.connect();
    
    try {
        console.log('Seeding database...');
        
        await client.query('BEGIN');
        
        // Create Admin User
        const adminPasswordHash = await bcrypt.hash('admin123', 10);
        const adminId = uuidv4();
        await client.query(`
            INSERT INTO users (id, email, password_hash, role, name, is_active)
            VALUES ($1, $2, $3, 'ADMIN', 'Admin User', true)
            ON CONFLICT (email) DO NOTHING
        `, [adminId, 'admin@shivfurniture.com', adminPasswordHash]);
        console.log('Admin user created');
        
        // Create Product Categories
        const categories = [
            { id: uuidv4(), name: 'Living Room', description: 'Living room furniture' },
            { id: uuidv4(), name: 'Bedroom', description: 'Bedroom furniture' },
            { id: uuidv4(), name: 'Office', description: 'Office furniture' },
            { id: uuidv4(), name: 'Outdoor', description: 'Outdoor furniture' },
            { id: uuidv4(), name: 'Raw Materials', description: 'Raw materials for manufacturing' },
        ];
        
        for (const cat of categories) {
            await client.query(`
                INSERT INTO product_categories (id, name, description)
                VALUES ($1, $2, $3)
                ON CONFLICT (name) DO NOTHING
            `, [cat.id, cat.name, cat.description]);
        }
        console.log('Product categories created');
        
        // Create Analytical Accounts (Cost Centers)
        const analyticalAccounts = [
            { code: 'CC001', name: 'Manufacturing', description: 'Manufacturing cost center' },
            { code: 'CC002', name: 'Sales & Marketing', description: 'Sales and marketing expenses' },
            { code: 'CC003', name: 'Administration', description: 'Administrative expenses' },
            { code: 'CC004', name: 'Logistics', description: 'Logistics and delivery' },
            { code: 'CC005', name: 'R&D', description: 'Research and development' },
        ];
        
        for (const aa of analyticalAccounts) {
            await client.query(`
                INSERT INTO analytical_accounts (code, name, description)
                VALUES ($1, $2, $3)
                ON CONFLICT (code) DO NOTHING
            `, [aa.code, aa.name, aa.description]);
        }
        console.log('Analytical accounts created');
        
        // Create Sample Products
        const products = [
            { name: 'Oak Dining Table', sku: 'ODT001', unit_price: 25000, cost_price: 15000, category: 'Living Room' },
            { name: 'Leather Sofa Set', sku: 'LSS001', unit_price: 45000, cost_price: 28000, category: 'Living Room' },
            { name: 'King Size Bed', sku: 'KSB001', unit_price: 35000, cost_price: 22000, category: 'Bedroom' },
            { name: 'Office Desk', sku: 'OFD001', unit_price: 12000, cost_price: 7500, category: 'Office' },
            { name: 'Executive Chair', sku: 'EXC001', unit_price: 8000, cost_price: 5000, category: 'Office' },
            { name: 'Garden Bench', sku: 'GRB001', unit_price: 6000, cost_price: 3500, category: 'Outdoor' },
            { name: 'Teak Wood Plank', sku: 'TWP001', unit_price: 2000, cost_price: 1500, category: 'Raw Materials' },
            { name: 'Upholstery Fabric', sku: 'UPF001', unit_price: 500, cost_price: 300, category: 'Raw Materials' },
        ];
        
        for (const prod of products) {
            const categoryResult = await client.query(
                'SELECT id FROM product_categories WHERE name = $1',
                [prod.category]
            );
            const categoryId = categoryResult.rows[0]?.id;
            
            await client.query(`
                INSERT INTO products (name, sku, unit_price, cost_price, category_id)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (sku) DO NOTHING
            `, [prod.name, prod.sku, prod.unit_price, prod.cost_price, categoryId]);
        }
        console.log('✅ Products created');
        
        // Create Sample Vendors
        const vendors = [
            { name: 'Wood Suppliers Ltd', email: 'contact@woodsuppliers.com', phone: '9876543210', tag: 'raw-materials' },
            { name: 'Fabric World', email: 'sales@fabricworld.com', phone: '9876543211', tag: 'raw-materials' },
            { name: 'Hardware Hub', email: 'info@hardwarehub.com', phone: '9876543212', tag: 'hardware' },
        ];
        
        for (const vendor of vendors) {
            await client.query(`
                INSERT INTO contacts (name, email, phone, contact_type, tag)
                VALUES ($1, $2, $3, 'VENDOR', $4)
                ON CONFLICT DO NOTHING
            `, [vendor.name, vendor.email, vendor.phone, vendor.tag]);
        }
        console.log('✅ Vendors created');
        
        // Create Sample Budgets for current year
        const currentYear = new Date().getFullYear();
        const aaResult = await client.query('SELECT id, code FROM analytical_accounts');
        
        for (const aa of aaResult.rows) {
            const budgetAmounts = {
                'CC001': 500000, // Manufacturing
                'CC002': 200000, // Sales & Marketing
                'CC003': 100000, // Administration
                'CC004': 150000, // Logistics
                'CC005': 75000,  // R&D
            };
            
            await client.query(`
                INSERT INTO budgets (analytical_account_id, period_start, period_end, budget_amount, description)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (analytical_account_id, period_start, period_end) DO NOTHING
            `, [
                aa.id,
                `${currentYear}-01-01`,
                `${currentYear}-12-31`,
                budgetAmounts[aa.code] || 100000,
                `Annual budget for ${aa.code} - ${currentYear}`
            ]);
        }
        console.log('✅ Budgets created');
        
        await client.query('COMMIT');
        console.log('🎉 Database seeded successfully!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error seeding database:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Failed to seed database:', error);
        process.exit(1);
    });
