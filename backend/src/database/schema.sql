-- =====================================================
-- SHIV FURNITURE - BUDGET ACCOUNTING SYSTEM
-- PostgreSQL Database Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE user_role AS ENUM ('ADMIN', 'CUSTOMER');
CREATE TYPE contact_type AS ENUM ('CUSTOMER', 'VENDOR');
CREATE TYPE document_status AS ENUM ('DRAFT', 'POSTED', 'CANCELLED');
CREATE TYPE payment_status AS ENUM ('NOT_PAID', 'PARTIALLY_PAID', 'PAID');

-- =====================================================
-- USERS TABLE
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role user_role NOT NULL DEFAULT 'CUSTOMER',
    name VARCHAR(255) NOT NULL,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_reset_token ON users(password_reset_token);

-- =====================================================
-- MASTER DATA - CONTACTS (Customers & Vendors)
-- =====================================================

CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    contact_type contact_type NOT NULL,
    tag VARCHAR(100),
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_type ON contacts(contact_type);
CREATE INDEX idx_contacts_tag ON contacts(tag);
CREATE INDEX idx_contacts_user_id ON contacts(user_id);

-- =====================================================
-- MASTER DATA - PRODUCT CATEGORIES
-- =====================================================

CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- MASTER DATA - PRODUCTS
-- =====================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    description TEXT,
    unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    cost_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    category_id UUID REFERENCES product_categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);

-- =====================================================
-- MASTER DATA - ANALYTICAL ACCOUNTS (Cost Centers)
-- =====================================================

CREATE TABLE analytical_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytical_accounts_code ON analytical_accounts(code);

-- =====================================================
-- AUTO ANALYTICAL MODELS (Rule-based assignment)
-- =====================================================

CREATE TABLE auto_analytical_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    partner_id UUID REFERENCES contacts(id),
    partner_tag VARCHAR(100),
    product_id UUID REFERENCES products(id),
    product_category_id UUID REFERENCES product_categories(id),
    analytical_account_id UUID NOT NULL REFERENCES analytical_accounts(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_aam_partner ON auto_analytical_models(partner_id);
CREATE INDEX idx_aam_partner_tag ON auto_analytical_models(partner_tag);
CREATE INDEX idx_aam_product ON auto_analytical_models(product_id);
CREATE INDEX idx_aam_product_category ON auto_analytical_models(product_category_id);
CREATE INDEX idx_aam_analytical_account ON auto_analytical_models(analytical_account_id);

-- =====================================================
-- BUDGETS
-- =====================================================

CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analytical_account_id UUID NOT NULL REFERENCES analytical_accounts(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    budget_amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT budget_period_check CHECK (period_end > period_start),
    CONSTRAINT budget_unique_period UNIQUE (analytical_account_id, period_start, period_end)
);

CREATE INDEX idx_budgets_analytical_account ON budgets(analytical_account_id);
CREATE INDEX idx_budgets_period ON budgets(period_start, period_end);

-- =====================================================
-- PURCHASE ORDERS
-- =====================================================

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    vendor_id UUID NOT NULL REFERENCES contacts(id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date DATE,
    status document_status NOT NULL DEFAULT 'DRAFT',
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_po_vendor ON purchase_orders(vendor_id);
CREATE INDEX idx_po_status ON purchase_orders(status);
CREATE INDEX idx_po_order_date ON purchase_orders(order_date);

CREATE TABLE purchase_order_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity DECIMAL(15, 3) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    subtotal DECIMAL(15, 2) NOT NULL,
    analytical_account_id UUID REFERENCES analytical_accounts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pol_po ON purchase_order_lines(purchase_order_id);
CREATE INDEX idx_pol_product ON purchase_order_lines(product_id);

-- =====================================================
-- VENDOR BILLS
-- =====================================================

CREATE TABLE vendor_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_number VARCHAR(50) NOT NULL UNIQUE,
    vendor_id UUID NOT NULL REFERENCES contacts(id),
    purchase_order_id UUID REFERENCES purchase_orders(id),
    bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    status document_status NOT NULL DEFAULT 'DRAFT',
    payment_status payment_status NOT NULL DEFAULT 'NOT_PAID',
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vb_vendor ON vendor_bills(vendor_id);
CREATE INDEX idx_vb_status ON vendor_bills(status);
CREATE INDEX idx_vb_payment_status ON vendor_bills(payment_status);
CREATE INDEX idx_vb_bill_date ON vendor_bills(bill_date);

CREATE TABLE vendor_bill_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_bill_id UUID NOT NULL REFERENCES vendor_bills(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity DECIMAL(15, 3) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    subtotal DECIMAL(15, 2) NOT NULL,
    analytical_account_id UUID REFERENCES analytical_accounts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vbl_bill ON vendor_bill_lines(vendor_bill_id);
CREATE INDEX idx_vbl_product ON vendor_bill_lines(product_id);
CREATE INDEX idx_vbl_analytical ON vendor_bill_lines(analytical_account_id);

-- =====================================================
-- SALES ORDERS
-- =====================================================

CREATE TABLE sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES contacts(id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date DATE,
    status document_status NOT NULL DEFAULT 'DRAFT',
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_so_customer ON sales_orders(customer_id);
CREATE INDEX idx_so_status ON sales_orders(status);
CREATE INDEX idx_so_order_date ON sales_orders(order_date);

CREATE TABLE sales_order_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity DECIMAL(15, 3) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    subtotal DECIMAL(15, 2) NOT NULL,
    analytical_account_id UUID REFERENCES analytical_accounts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sol_so ON sales_order_lines(sales_order_id);
CREATE INDEX idx_sol_product ON sales_order_lines(product_id);

-- =====================================================
-- CUSTOMER INVOICES
-- =====================================================

CREATE TABLE customer_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES contacts(id),
    sales_order_id UUID REFERENCES sales_orders(id),
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    status document_status NOT NULL DEFAULT 'DRAFT',
    payment_status payment_status NOT NULL DEFAULT 'NOT_PAID',
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ci_customer ON customer_invoices(customer_id);
CREATE INDEX idx_ci_status ON customer_invoices(status);
CREATE INDEX idx_ci_payment_status ON customer_invoices(payment_status);
CREATE INDEX idx_ci_invoice_date ON customer_invoices(invoice_date);

CREATE TABLE customer_invoice_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_invoice_id UUID NOT NULL REFERENCES customer_invoices(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity DECIMAL(15, 3) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    subtotal DECIMAL(15, 2) NOT NULL,
    analytical_account_id UUID REFERENCES analytical_accounts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cil_invoice ON customer_invoice_lines(customer_invoice_id);
CREATE INDEX idx_cil_product ON customer_invoice_lines(product_id);
CREATE INDEX idx_cil_analytical ON customer_invoice_lines(analytical_account_id);

-- =====================================================
-- BILL PAYMENTS (Vendor Bill Payments)
-- =====================================================

CREATE TABLE bill_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_number VARCHAR(50) NOT NULL UNIQUE,
    vendor_bill_id UUID NOT NULL REFERENCES vendor_bills(id),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bp_bill ON bill_payments(vendor_bill_id);
CREATE INDEX idx_bp_date ON bill_payments(payment_date);

-- =====================================================
-- INVOICE PAYMENTS (Customer Invoice Payments)
-- =====================================================

CREATE TABLE invoice_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_number VARCHAR(50) NOT NULL UNIQUE,
    customer_invoice_id UUID NOT NULL REFERENCES customer_invoices(id),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    reference VARCHAR(255),
    notes TEXT,
    paid_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ip_invoice ON invoice_payments(customer_invoice_id);
CREATE INDEX idx_ip_date ON invoice_payments(payment_date);
CREATE INDEX idx_ip_paid_by ON invoice_payments(paid_by_user_id);

-- =====================================================
-- SEQUENCES FOR DOCUMENT NUMBERS
-- =====================================================

CREATE SEQUENCE po_number_seq START 1;
CREATE SEQUENCE vb_number_seq START 1;
CREATE SEQUENCE so_number_seq START 1;
CREATE SEQUENCE ci_number_seq START 1;
CREATE SEQUENCE bp_number_seq START 1;
CREATE SEQUENCE ip_number_seq START 1;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to generate document numbers
CREATE OR REPLACE FUNCTION generate_document_number(prefix VARCHAR, seq_name VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    next_val INTEGER;
    result VARCHAR;
BEGIN
    EXECUTE format('SELECT nextval(%L)', seq_name) INTO next_val;
    result := prefix || '-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(next_val::TEXT, 6, '0');
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update payment status on vendor bills
CREATE OR REPLACE FUNCTION update_vendor_bill_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    bill_total DECIMAL(15, 2);
    total_paid DECIMAL(15, 2);
BEGIN
    -- Get bill total
    SELECT total_amount INTO bill_total FROM vendor_bills WHERE id = COALESCE(NEW.vendor_bill_id, OLD.vendor_bill_id);
    
    -- Calculate total paid
    SELECT COALESCE(SUM(amount), 0) INTO total_paid 
    FROM bill_payments 
    WHERE vendor_bill_id = COALESCE(NEW.vendor_bill_id, OLD.vendor_bill_id);
    
    -- Update bill payment status
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

-- Function to update payment status on customer invoices
CREATE OR REPLACE FUNCTION update_customer_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    invoice_total DECIMAL(15, 2);
    total_paid DECIMAL(15, 2);
BEGIN
    -- Get invoice total
    SELECT total_amount INTO invoice_total FROM customer_invoices WHERE id = COALESCE(NEW.customer_invoice_id, OLD.customer_invoice_id);
    
    -- Calculate total paid
    SELECT COALESCE(SUM(amount), 0) INTO total_paid 
    FROM invoice_payments 
    WHERE customer_invoice_id = COALESCE(NEW.customer_invoice_id, OLD.customer_invoice_id);
    
    -- Update invoice payment status
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

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER trg_bill_payment_status
AFTER INSERT OR UPDATE OR DELETE ON bill_payments
FOR EACH ROW
EXECUTE FUNCTION update_vendor_bill_payment_status();

CREATE TRIGGER trg_invoice_payment_status
AFTER INSERT OR UPDATE OR DELETE ON invoice_payments
FOR EACH ROW
EXECUTE FUNCTION update_customer_invoice_payment_status();

-- =====================================================
-- BUDGET VS ACTUAL VIEW
-- =====================================================

CREATE OR REPLACE VIEW budget_vs_actual AS
SELECT 
    b.id AS budget_id,
    b.analytical_account_id,
    aa.code AS analytical_account_code,
    aa.name AS analytical_account_name,
    b.period_start,
    b.period_end,
    b.budget_amount,
    COALESCE(actuals.actual_expense, 0) AS actual_expense,
    COALESCE(actuals.actual_revenue, 0) AS actual_revenue,
    COALESCE(actuals.actual_expense, 0) - COALESCE(actuals.actual_revenue, 0) AS net_actual,
    b.budget_amount - (COALESCE(actuals.actual_expense, 0) - COALESCE(actuals.actual_revenue, 0)) AS remaining_amount,
    CASE 
        WHEN b.budget_amount = 0 THEN 0
        ELSE ROUND(((COALESCE(actuals.actual_expense, 0) - COALESCE(actuals.actual_revenue, 0)) / b.budget_amount) * 100, 2)
    END AS utilization_percentage
FROM budgets b
JOIN analytical_accounts aa ON b.analytical_account_id = aa.id
LEFT JOIN (
    -- Calculate actuals from POSTED vendor bills (expenses) and POSTED customer invoices (revenue)
    SELECT 
        analytical_account_id,
        period_start,
        period_end,
        SUM(expense_amount) AS actual_expense,
        SUM(revenue_amount) AS actual_revenue
    FROM (
        -- Vendor Bill Lines (Expenses) - only from POSTED bills
        SELECT 
            vbl.analytical_account_id,
            b.period_start,
            b.period_end,
            vbl.subtotal AS expense_amount,
            0 AS revenue_amount
        FROM vendor_bill_lines vbl
        JOIN vendor_bills vb ON vbl.vendor_bill_id = vb.id
        JOIN budgets b ON vbl.analytical_account_id = b.analytical_account_id
        WHERE vb.status = 'POSTED'
            AND vb.bill_date BETWEEN b.period_start AND b.period_end
            AND vbl.analytical_account_id IS NOT NULL
        
        UNION ALL
        
        -- Customer Invoice Lines (Revenue) - only from POSTED invoices
        SELECT 
            cil.analytical_account_id,
            b.period_start,
            b.period_end,
            0 AS expense_amount,
            cil.subtotal AS revenue_amount
        FROM customer_invoice_lines cil
        JOIN customer_invoices ci ON cil.customer_invoice_id = ci.id
        JOIN budgets b ON cil.analytical_account_id = b.analytical_account_id
        WHERE ci.status = 'POSTED'
            AND ci.invoice_date BETWEEN b.period_start AND b.period_end
            AND cil.analytical_account_id IS NOT NULL
    ) combined
    GROUP BY analytical_account_id, period_start, period_end
) actuals ON b.analytical_account_id = actuals.analytical_account_id 
    AND b.period_start = actuals.period_start 
    AND b.period_end = actuals.period_end;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE users IS 'User accounts for authentication - created implicitly when invoices are generated for new customers';
COMMENT ON TABLE contacts IS 'Master data for customers and vendors';
COMMENT ON TABLE products IS 'Product master data with pricing';
COMMENT ON TABLE analytical_accounts IS 'Cost centers for budget tracking and analysis';
COMMENT ON TABLE auto_analytical_models IS 'Rules for automatic analytical account assignment';
COMMENT ON TABLE budgets IS 'Budget definitions per analytical account and time period';
COMMENT ON TABLE vendor_bills IS 'Bills received from vendors - affects budget actuals when POSTED';
COMMENT ON TABLE customer_invoices IS 'Invoices issued to customers - affects budget actuals when POSTED';
COMMENT ON VIEW budget_vs_actual IS 'Budget vs Actual report - compares budgeted amounts with actual expenses/revenue from POSTED documents';
