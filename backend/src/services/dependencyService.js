const db = require('../config/database');
const { ConflictError } = require('../utils/errors');

/**
 * Dependency Service (TASK 9)
 * 
 * Validates entities can be safely deleted by checking for dependencies.
 * This enforces data integrity by preventing deletion of entities that
 * are referenced elsewhere in the system.
 * 
 * BUSINESS RULES:
 * - Contacts: Cannot delete if used in invoices, bills, or orders
 * - Products: Cannot delete if used in any line items
 * - Analytical Accounts: Cannot delete if used in budgets, lines, or rules
 * - Product Categories: Cannot delete if used in products or rules
 */
class DependencyService {
    /**
     * Check contact dependencies before delete
     * 
     * A contact cannot be deleted if it has:
     * - Customer invoices
     * - Vendor bills
     * - Purchase orders
     * - Sales orders
     * - Auto analytical model references
     * 
     * @param {string} contactId - Contact UUID
     * @throws {ConflictError} - If dependencies exist
     */
    async validateContactDelete(contactId) {
        const result = await db.query(
            `SELECT * FROM check_contact_dependencies($1) WHERE dependency_count > 0`,
            [contactId]
        );
        
        if (result.rows.length > 0) {
            const dependencies = result.rows
                .map(r => `${r.dependency_type}: ${r.dependency_count}`)
                .join(', ');
            
            throw new ConflictError(
                `Cannot delete contact: entity is referenced by other records. Dependencies: ${dependencies}`
            );
        }
    }

    /**
     * Check product dependencies before delete
     * 
     * A product cannot be deleted if it has:
     * - Customer invoice lines
     * - Vendor bill lines
     * - Sales order lines
     * - Purchase order lines
     * - Auto analytical model references
     * 
     * @param {string} productId - Product UUID
     * @throws {ConflictError} - If dependencies exist
     */
    async validateProductDelete(productId) {
        const result = await db.query(
            `SELECT * FROM check_product_dependencies($1) WHERE dependency_count > 0`,
            [productId]
        );
        
        if (result.rows.length > 0) {
            const dependencies = result.rows
                .map(r => `${r.dependency_type}: ${r.dependency_count}`)
                .join(', ');
            
            throw new ConflictError(
                `Cannot delete product: entity is referenced by other records. Dependencies: ${dependencies}`
            );
        }
    }

    /**
     * Check analytical account dependencies before delete
     * 
     * An analytical account cannot be deleted if it has:
     * - Budgets
     * - Customer invoice lines
     * - Vendor bill lines
     * - Sales order lines
     * - Purchase order lines
     * - Auto analytical model references
     * 
     * @param {string} analyticalAccountId - Analytical account UUID
     * @throws {ConflictError} - If dependencies exist
     */
    async validateAnalyticalAccountDelete(analyticalAccountId) {
        const result = await db.query(
            `SELECT * FROM check_analytical_account_dependencies($1) WHERE dependency_count > 0`,
            [analyticalAccountId]
        );
        
        if (result.rows.length > 0) {
            const dependencies = result.rows
                .map(r => `${r.dependency_type}: ${r.dependency_count}`)
                .join(', ');
            
            throw new ConflictError(
                `Cannot delete analytical account: entity is referenced by other records. Dependencies: ${dependencies}`
            );
        }
    }

    /**
     * Check product category dependencies before delete
     * 
     * A category cannot be deleted if it has:
     * - Products
     * - Auto analytical model references
     * 
     * @param {string} categoryId - Product category UUID
     * @throws {ConflictError} - If dependencies exist
     */
    async validateProductCategoryDelete(categoryId) {
        const result = await db.query(
            `SELECT * FROM check_product_category_dependencies($1) WHERE dependency_count > 0`,
            [categoryId]
        );
        
        if (result.rows.length > 0) {
            const dependencies = result.rows
                .map(r => `${r.dependency_type}: ${r.dependency_count}`)
                .join(', ');
            
            throw new ConflictError(
                `Cannot delete product category: entity is referenced by other records. Dependencies: ${dependencies}`
            );
        }
    }

    /**
     * Validate contact delete with manual check (fallback if DB function doesn't exist)
     */
    async validateContactDeleteManual(contactId) {
        const checks = [
            { table: 'customer_invoices', column: 'customer_id', name: 'customer invoices' },
            { table: 'vendor_bills', column: 'vendor_id', name: 'vendor bills' },
            { table: 'purchase_orders', column: 'vendor_id', name: 'purchase orders' },
            { table: 'sales_orders', column: 'customer_id', name: 'sales orders' },
            { table: 'auto_analytical_models', column: 'partner_id', name: 'auto analytical models' },
        ];
        
        const dependencies = [];
        
        for (const check of checks) {
            const result = await db.query(
                `SELECT COUNT(*) FROM ${check.table} WHERE ${check.column} = $1`,
                [contactId]
            );
            const count = parseInt(result.rows[0].count, 10);
            if (count > 0) {
                dependencies.push(`${check.name}: ${count}`);
            }
        }
        
        if (dependencies.length > 0) {
            throw new ConflictError(
                `Cannot delete contact: entity is referenced by other records. Dependencies: ${dependencies.join(', ')}`
            );
        }
    }

    /**
     * Validate product delete with manual check (fallback)
     */
    async validateProductDeleteManual(productId) {
        const checks = [
            { table: 'customer_invoice_lines', column: 'product_id', name: 'invoice lines' },
            { table: 'vendor_bill_lines', column: 'product_id', name: 'bill lines' },
            { table: 'sales_order_lines', column: 'product_id', name: 'sales order lines' },
            { table: 'purchase_order_lines', column: 'product_id', name: 'purchase order lines' },
            { table: 'auto_analytical_models', column: 'product_id', name: 'auto analytical models' },
        ];
        
        const dependencies = [];
        
        for (const check of checks) {
            const result = await db.query(
                `SELECT COUNT(*) FROM ${check.table} WHERE ${check.column} = $1`,
                [productId]
            );
            const count = parseInt(result.rows[0].count, 10);
            if (count > 0) {
                dependencies.push(`${check.name}: ${count}`);
            }
        }
        
        if (dependencies.length > 0) {
            throw new ConflictError(
                `Cannot delete product: entity is referenced by other records. Dependencies: ${dependencies.join(', ')}`
            );
        }
    }

    /**
     * Validate analytical account delete with manual check (fallback)
     */
    async validateAnalyticalAccountDeleteManual(analyticalAccountId) {
        const checks = [
            { table: 'budgets', column: 'analytical_account_id', name: 'budgets' },
            { table: 'customer_invoice_lines', column: 'analytical_account_id', name: 'invoice lines' },
            { table: 'vendor_bill_lines', column: 'analytical_account_id', name: 'bill lines' },
            { table: 'sales_order_lines', column: 'analytical_account_id', name: 'sales order lines' },
            { table: 'purchase_order_lines', column: 'analytical_account_id', name: 'purchase order lines' },
            { table: 'auto_analytical_models', column: 'analytical_account_id', name: 'auto analytical models' },
        ];
        
        const dependencies = [];
        
        for (const check of checks) {
            const result = await db.query(
                `SELECT COUNT(*) FROM ${check.table} WHERE ${check.column} = $1`,
                [analyticalAccountId]
            );
            const count = parseInt(result.rows[0].count, 10);
            if (count > 0) {
                dependencies.push(`${check.name}: ${count}`);
            }
        }
        
        if (dependencies.length > 0) {
            throw new ConflictError(
                `Cannot delete analytical account: entity is referenced by other records. Dependencies: ${dependencies.join(', ')}`
            );
        }
    }

    /**
     * Validate product category delete with manual check (fallback)
     */
    async validateProductCategoryDeleteManual(categoryId) {
        const checks = [
            { table: 'products', column: 'category_id', name: 'products' },
            { table: 'auto_analytical_models', column: 'product_category_id', name: 'auto analytical models' },
        ];
        
        const dependencies = [];
        
        for (const check of checks) {
            const result = await db.query(
                `SELECT COUNT(*) FROM ${check.table} WHERE ${check.column} = $1`,
                [categoryId]
            );
            const count = parseInt(result.rows[0].count, 10);
            if (count > 0) {
                dependencies.push(`${check.name}: ${count}`);
            }
        }
        
        if (dependencies.length > 0) {
            throw new ConflictError(
                `Cannot delete product category: entity is referenced by other records. Dependencies: ${dependencies.join(', ')}`
            );
        }
    }
}

module.exports = new DependencyService();
