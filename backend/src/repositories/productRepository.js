const db = require('../config/database');

class ProductRepository {
    async findAll(filters = {}, pagination = {}) {
        const { category_id, vendor_id, search, is_active } = filters;
        const { limit = 20, offset = 0 } = pagination;
        
        let query = `
            SELECT p.*, pc.name as category_name, c.name as vendor_name
            FROM products p
            LEFT JOIN product_categories pc ON p.category_id = pc.id
            LEFT JOIN contacts c ON p.vendor_id = c.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;
        
        if (category_id) {
            query += ` AND p.category_id = $${paramCount}`;
            params.push(category_id);
            paramCount++;
        }
        
        if (vendor_id) {
            query += ` AND p.vendor_id = $${paramCount}`;
            params.push(vendor_id);
            paramCount++;
        }
        
        if (is_active !== undefined) {
            query += ` AND p.is_active = $${paramCount}`;
            params.push(is_active);
            paramCount++;
        }
        
        if (search) {
            query += ` AND (p.name ILIKE $${paramCount} OR p.sku ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }
        
        query += ` ORDER BY p.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);
        
        const result = await db.query(query, params);
        return result.rows;
    }
    
    async count(filters = {}) {
        const { category_id, vendor_id, search, is_active } = filters;
        
        let query = 'SELECT COUNT(*) FROM products WHERE 1=1';
        const params = [];
        let paramCount = 1;
        
        if (category_id) {
            query += ` AND category_id = $${paramCount}`;
            params.push(category_id);
            paramCount++;
        }
        
        if (vendor_id) {
            query += ` AND vendor_id = $${paramCount}`;
            params.push(vendor_id);
            paramCount++;
        }
        
        if (is_active !== undefined) {
            query += ` AND is_active = $${paramCount}`;
            params.push(is_active);
            paramCount++;
        }
        
        if (search) {
            query += ` AND (name ILIKE $${paramCount} OR sku ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }
        
        const result = await db.query(query, params);
        return parseInt(result.rows[0].count, 10);
    }
    
    async findById(id) {
        const result = await db.query(
            `SELECT p.*, pc.name as category_name, c.name as vendor_name
             FROM products p
             LEFT JOIN product_categories pc ON p.category_id = pc.id
             LEFT JOIN contacts c ON p.vendor_id = c.id
             WHERE p.id = $1`,
            [id]
        );
        return result.rows[0];
    }
    
    async findBySku(sku) {
        const result = await db.query('SELECT * FROM products WHERE sku = $1', [sku]);
        return result.rows[0];
    }
    
    async create(productData) {
        const { name, sku, description, unit_price, cost_price, category_id, vendor_id } = productData;
        
        const result = await db.query(
            `INSERT INTO products (name, sku, description, unit_price, cost_price, category_id, vendor_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [name, sku, description, unit_price, cost_price, category_id, vendor_id]
        );
        return result.rows[0];
    }
    
    async update(id, updates) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        
        const allowedFields = ['name', 'sku', 'description', 'unit_price', 'cost_price', 'category_id', 'vendor_id', 'is_active'];
        
        Object.entries(updates).forEach(([key, value]) => {
            if (allowedFields.includes(key) && value !== undefined) {
                fields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        });
        
        if (fields.length === 0) return this.findById(id);
        
        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        
        const result = await db.query(
            `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );
        return result.rows[0];
    }
    
    async delete(id) {
        const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
}

class ProductCategoryRepository {
    async findAll() {
        const result = await db.query('SELECT * FROM product_categories ORDER BY name');
        return result.rows;
    }
    
    async findById(id) {
        const result = await db.query('SELECT * FROM product_categories WHERE id = $1', [id]);
        return result.rows[0];
    }
    
    async findByName(name) {
        const result = await db.query('SELECT * FROM product_categories WHERE name = $1', [name]);
        return result.rows[0];
    }
    
    async create(data) {
        const { name, description } = data;
        const result = await db.query(
            'INSERT INTO product_categories (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );
        return result.rows[0];
    }
    
    async update(id, updates) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        
        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined && ['name', 'description'].includes(key)) {
                fields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        });
        
        if (fields.length === 0) return this.findById(id);
        
        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        
        const result = await db.query(
            `UPDATE product_categories SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );
        return result.rows[0];
    }
    
    async delete(id) {
        const result = await db.query('DELETE FROM product_categories WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
}

module.exports = {
    productRepository: new ProductRepository(),
    productCategoryRepository: new ProductCategoryRepository(),
};
