const db = require('../config/database');

class AutoAnalyticalModelRepository {
    async findAll(filters = {}, pagination = {}) {
        const { is_active } = filters;
        const { limit = 20, offset = 0 } = pagination;
        
        let query = `
            SELECT 
                aam.*,
                c.name as partner_name,
                p.name as product_name,
                pc.name as product_category_name,
                aa.code as analytical_account_code,
                aa.name as analytical_account_name
            FROM auto_analytical_models aam
            LEFT JOIN contacts c ON aam.partner_id = c.id
            LEFT JOIN products p ON aam.product_id = p.id
            LEFT JOIN product_categories pc ON aam.product_category_id = pc.id
            JOIN analytical_accounts aa ON aam.analytical_account_id = aa.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;
        
        if (is_active !== undefined) {
            query += ` AND aam.is_active = $${paramCount}`;
            params.push(is_active);
            paramCount++;
        }
        
        query += ` ORDER BY aam.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);
        
        const result = await db.query(query, params);
        return result.rows;
    }
    
    async count(filters = {}) {
        const { is_active } = filters;
        
        let query = 'SELECT COUNT(*) FROM auto_analytical_models WHERE 1=1';
        const params = [];
        let paramCount = 1;
        
        if (is_active !== undefined) {
            query += ` AND is_active = $${paramCount}`;
            params.push(is_active);
            paramCount++;
        }
        
        const result = await db.query(query, params);
        return parseInt(result.rows[0].count, 10);
    }
    
    async findById(id) {
        const result = await db.query(
            `SELECT 
                aam.*,
                c.name as partner_name,
                p.name as product_name,
                pc.name as product_category_name,
                aa.code as analytical_account_code,
                aa.name as analytical_account_name
            FROM auto_analytical_models aam
            LEFT JOIN contacts c ON aam.partner_id = c.id
            LEFT JOIN products p ON aam.product_id = p.id
            LEFT JOIN product_categories pc ON aam.product_category_id = pc.id
            JOIN analytical_accounts aa ON aam.analytical_account_id = aa.id
            WHERE aam.id = $1`,
            [id]
        );
        return result.rows[0];
    }
    
    async findActiveModels() {
        const result = await db.query(
            `SELECT 
                aam.*,
                c.tag as partner_tag_value,
                p.category_id as product_category_from_product
            FROM auto_analytical_models aam
            LEFT JOIN contacts c ON aam.partner_id = c.id
            LEFT JOIN products p ON aam.product_id = p.id
            WHERE aam.is_active = true
            ORDER BY aam.created_at`
        );
        return result.rows;
    }

    /**
     * Find active models ordered by created_at DESC (most recent first)
     * 
     * CRITICAL: This ordering is used for tie-breaking in the resolution engine.
     * When two rules have the same match count, the more recent one wins.
     * By ordering DESC, the first matching rule with highest score is the winner.
     */
    async findActiveModelsOrderedByRecency() {
        const result = await db.query(
            `SELECT 
                aam.*,
                c.tag as partner_tag_value,
                p.category_id as product_category_from_product
            FROM auto_analytical_models aam
            LEFT JOIN contacts c ON aam.partner_id = c.id
            LEFT JOIN products p ON aam.product_id = p.id
            WHERE aam.is_active = true
            ORDER BY aam.created_at DESC`
        );
        return result.rows;
    }
    
    async create(data) {
        const { 
            name, partner_id, partner_tag, product_id, 
            product_category_id, analytical_account_id 
        } = data;
        
        const result = await db.query(
            `INSERT INTO auto_analytical_models 
             (name, partner_id, partner_tag, product_id, product_category_id, analytical_account_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [name, partner_id, partner_tag, product_id, product_category_id, analytical_account_id]
        );
        return result.rows[0];
    }
    
    async update(id, updates) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        
        const allowedFields = [
            'name', 'partner_id', 'partner_tag', 'product_id', 
            'product_category_id', 'analytical_account_id', 'is_active'
        ];
        
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
            `UPDATE auto_analytical_models SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );
        return result.rows[0];
    }
    
    async delete(id) {
        const result = await db.query(
            'DELETE FROM auto_analytical_models WHERE id = $1 RETURNING *',
            [id]
        );
        return result.rows[0];
    }
}

module.exports = new AutoAnalyticalModelRepository();
