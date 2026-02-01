require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const { pool } = require('../../config/database');

async function run() {
    console.log('Updating payment status triggers...');
    
    // Fix customer invoice payment status trigger
    await pool.query(`
        CREATE OR REPLACE FUNCTION update_customer_invoice_payment_status()
        RETURNS TRIGGER AS $$
        DECLARE
            invoice_total DECIMAL(15, 2);
            total_paid DECIMAL(15, 2);
        BEGIN
            SELECT total_amount INTO invoice_total FROM customer_invoices WHERE id = COALESCE(NEW.customer_invoice_id, OLD.customer_invoice_id);
            
            SELECT COALESCE(SUM(amount), 0) INTO total_paid 
            FROM invoice_payments 
            WHERE customer_invoice_id = COALESCE(NEW.customer_invoice_id, OLD.customer_invoice_id);
            
            UPDATE customer_invoices 
            SET 
                paid_amount = total_paid,
                payment_status = CASE 
                    WHEN total_paid = 0 THEN 'NOT_PAID'::payment_status
                    WHEN total_paid >= invoice_total THEN 'PAID'::payment_status
                    ELSE 'PARTIALLY_PAID'::payment_status
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = COALESCE(NEW.customer_invoice_id, OLD.customer_invoice_id);
            
            RETURN COALESCE(NEW, OLD);
        END;
        $$ LANGUAGE plpgsql;
    `);
    console.log('✓ Customer invoice payment trigger updated');
    
    // Fix vendor bill payment status trigger
    await pool.query(`
        CREATE OR REPLACE FUNCTION update_vendor_bill_payment_status()
        RETURNS TRIGGER AS $$
        DECLARE
            bill_total DECIMAL(15, 2);
            total_paid DECIMAL(15, 2);
        BEGIN
            SELECT total_amount INTO bill_total FROM vendor_bills WHERE id = COALESCE(NEW.vendor_bill_id, OLD.vendor_bill_id);
            
            SELECT COALESCE(SUM(amount), 0) INTO total_paid 
            FROM bill_payments 
            WHERE vendor_bill_id = COALESCE(NEW.vendor_bill_id, OLD.vendor_bill_id);
            
            UPDATE vendor_bills 
            SET 
                paid_amount = total_paid,
                payment_status = CASE 
                    WHEN total_paid = 0 THEN 'NOT_PAID'::payment_status
                    WHEN total_paid >= bill_total THEN 'PAID'::payment_status
                    ELSE 'PARTIALLY_PAID'::payment_status
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = COALESCE(NEW.vendor_bill_id, OLD.vendor_bill_id);
            
            RETURN COALESCE(NEW, OLD);
        END;
        $$ LANGUAGE plpgsql;
    `);
    console.log('✓ Vendor bill payment trigger updated');
    
    console.log('\nAll triggers updated successfully!');
    process.exit(0);
}

run().catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
});
