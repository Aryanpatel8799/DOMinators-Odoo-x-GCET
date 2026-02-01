const db = require('../config/database');

class ContactRepository {
    async findAll(filters = {}, pagination = {}) {
        const { contact_type, tag, search } = filters;
        const { limit = 20, offset = 0 } = pagination;
        
        let query = 'SELECT * FROM contacts WHERE 1=1';
        const params = [];
        let paramCount = 1;
        
        if (contact_type) {
            query += ` AND contact_type = $${paramCount}`;
            params.push(contact_type);
            paramCount++;
        }
        
        if (tag) {
            query += ` AND tag = $${paramCount}`;
            params.push(tag);
            paramCount++;
        }
        
        if (search) {
            query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }
        
        query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);
        
        const result = await db.query(query, params);
        return result.rows;
    }
    
    async count(filters = {}) {
        const { contact_type, tag, search } = filters;
        
        let query = 'SELECT COUNT(*) FROM contacts WHERE 1=1';
        const params = [];
        let paramCount = 1;
        
        if (contact_type) {
            query += ` AND contact_type = $${paramCount}`;
            params.push(contact_type);
            paramCount++;
        }
        
        if (tag) {
            query += ` AND tag = $${paramCount}`;
            params.push(tag);
            paramCount++;
        }
        
        if (search) {
            query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }
        
        const result = await db.query(query, params);
        return parseInt(result.rows[0].count, 10);
    }
    
    async findById(id) {
        const result = await db.query('SELECT * FROM contacts WHERE id = $1', [id]);
        return result.rows[0];
    }
    
    async findByEmail(email) {
        const result = await db.query(
            'SELECT * FROM contacts WHERE email = $1',
            [email.toLowerCase()]
        );
        return result.rows[0];
    }
    
    async findByEmailAndType(email, contactType) {
        const result = await db.query(
            'SELECT * FROM contacts WHERE email = $1 AND contact_type = $2',
            [email.toLowerCase(), contactType]
        );
        return result.rows[0];
    }
    
    // Auth-related methods
    async findByResetToken(tokenHash) {
        const result = await db.query(
            `SELECT * FROM contacts 
             WHERE password_reset_token = $1 
             AND password_reset_expires > NOW()`,
            [tokenHash]
        );
        return result.rows[0];
    }
    
    async setPassword(id, passwordHash, client = db) {
        const result = await client.query(
            `UPDATE contacts 
             SET password_hash = $1, 
                 password_reset_token = NULL, 
                 password_reset_expires = NULL,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [passwordHash, id]
        );
        return result.rows[0];
    }
    
    async setResetToken(id, tokenHash, expires) {
        const result = await db.query(
            `UPDATE contacts 
             SET password_reset_token = $1, 
                 password_reset_expires = $2,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [tokenHash, expires, id]
        );
        return result.rows[0];
    }

    async create(contactData, client = db) {
        const { name, email, phone, address, contact_type, tag, password_hash, role, password_reset_token, password_reset_expires, is_active } = contactData;
        
        const result = await client.query(
            `INSERT INTO contacts (name, email, phone, address, contact_type, tag, password_hash, role, password_reset_token, password_reset_expires, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [name, email.toLowerCase(), phone || null, address || null, contact_type, tag || null, password_hash || null, role || 'CUSTOMER', password_reset_token || null, password_reset_expires || null, is_active !== false]
        );
        return result.rows[0];
    }
    
    async update(id, updates, client = db) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        
        const allowedFields = ['name', 'email', 'phone', 'address', 'contact_type', 'tag', 'role', 'is_active', 'password_hash', 'password_reset_token', 'password_reset_expires'];
        
        Object.entries(updates).forEach(([key, value]) => {
            if (allowedFields.includes(key) && value !== undefined) {
                fields.push(`${key} = $${paramCount}`);
                values.push(key === 'email' ? value.toLowerCase() : value);
                paramCount++;
            }
        });
        
        if (fields.length === 0) return this.findById(id);
        
        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        
        const result = await client.query(
            `UPDATE contacts SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );
        return result.rows[0];
    }
    
    async delete(id) {
        const result = await db.query(
            'DELETE FROM contacts WHERE id = $1 RETURNING *',
            [id]
        );
        return result.rows[0];
    }
}

module.exports = new ContactRepository();
