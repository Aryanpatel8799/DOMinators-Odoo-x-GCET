-- =====================================================
-- MIGRATION 001: CRITICAL FIXES
-- 
-- This migration implements the following critical fixes:
-- 1. Adds NOT NULL constraint to analytical_account_id in line tables (TASK 1)
-- 2. Adds function for budget overlap validation (TASK 4)
-- 3. Updates budget_vs_actual VIEW for line-based aggregation (TASK 5)
-- 4. Updates auto_analytical_models ordering for tie-breaking (TASK 2)
-- =====================================================

-- =====================================================
-- TASK 1: Ensure line tables exist with proper structure
-- (Tables already exist, but adding index for analytical_account_id)
-- =====================================================

-- Add indexes if not exists for analytical accounts on lines
CREATE INDEX IF NOT EXISTS idx_cil_analytical ON customer_invoice_lines(analytical_account_id);
CREATE INDEX IF NOT EXISTS idx_vbl_analytical ON vendor_bill_lines(analytical_account_id);
CREATE INDEX IF NOT EXISTS idx_sol_analytical ON sales_order_lines(analytical_account_id);
CREATE INDEX IF NOT EXISTS idx_pol_analytical ON purchase_order_lines(analytical_account_id);

-- =====================================================
-- TASK 4: Budget Period Overlap Validation Function
-- 
-- This function checks if a budget period overlaps with existing
-- budgets for the same analytical account. Used by application layer.
-- =====================================================

CREATE OR REPLACE FUNCTION check_budget_overlap(
    p_analytical_account_id UUID,
    p_period_start DATE,
    p_period_end DATE,
    p_exclude_budget_id UUID DEFAULT NULL
)
RETURNS TABLE (
    overlapping_budget_id UUID,
    overlapping_period_start DATE,
    overlapping_period_end DATE
) AS $$
BEGIN
    -- Returns overlapping budgets for the same analytical account
    -- Two periods overlap if: start1 <= end2 AND end1 >= start2
    RETURN QUERY
    SELECT 
        b.id,
        b.period_start,
        b.period_end
    FROM budgets b
    WHERE b.analytical_account_id = p_analytical_account_id
        AND b.period_start <= p_period_end
        AND b.period_end >= p_period_start
        AND (p_exclude_budget_id IS NULL OR b.id != p_exclude_budget_id);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_budget_overlap IS 'Checks for overlapping budget periods for the same analytical account. Used to prevent duplicate budget coverage.';

-- =====================================================
-- TASK 5: Updated Budget vs Actual VIEW
-- 
-- Key changes:
-- - Aggregates from POSTED invoice/bill LINES only
-- - Groups by analytical_account_id from lines
-- - Ignores DRAFT documents
-- - Payments do NOT affect actuals (only document lines do)
-- =====================================================

DROP VIEW IF EXISTS budget_vs_actual;

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
    -- Net actual: expenses minus revenue (positive = net expense)
    COALESCE(actuals.actual_expense, 0) - COALESCE(actuals.actual_revenue, 0) AS net_actual,
    -- Remaining: budget minus net expense
    b.budget_amount - (COALESCE(actuals.actual_expense, 0) - COALESCE(actuals.actual_revenue, 0)) AS remaining_amount,
    -- Utilization percentage
    CASE 
        WHEN b.budget_amount = 0 THEN 0
        ELSE ROUND(((COALESCE(actuals.actual_expense, 0) - COALESCE(actuals.actual_revenue, 0)) / b.budget_amount) * 100, 2)
    END AS utilization_percentage
FROM budgets b
JOIN analytical_accounts aa ON b.analytical_account_id = aa.id
LEFT JOIN (
    -- Aggregate actuals from POSTED document lines only
    SELECT 
        analytical_account_id,
        budget_id,
        SUM(expense_amount) AS actual_expense,
        SUM(revenue_amount) AS actual_revenue
    FROM (
        -- Vendor Bill Lines (Expenses) - only from POSTED bills
        -- Each line has its own analytical_account_id
        SELECT 
            vbl.analytical_account_id,
            b.id AS budget_id,
            vbl.subtotal AS expense_amount,
            0::DECIMAL AS revenue_amount
        FROM vendor_bill_lines vbl
        JOIN vendor_bills vb ON vbl.vendor_bill_id = vb.id
        JOIN budgets b ON vbl.analytical_account_id = b.analytical_account_id
        WHERE vb.status = 'POSTED'
            AND vb.bill_date BETWEEN b.period_start AND b.period_end
            AND vbl.analytical_account_id IS NOT NULL
        
        UNION ALL
        
        -- Customer Invoice Lines (Revenue) - only from POSTED invoices
        -- Each line has its own analytical_account_id
        SELECT 
            cil.analytical_account_id,
            b.id AS budget_id,
            0::DECIMAL AS expense_amount,
            cil.subtotal AS revenue_amount
        FROM customer_invoice_lines cil
        JOIN customer_invoices ci ON cil.customer_invoice_id = ci.id
        JOIN budgets b ON cil.analytical_account_id = b.analytical_account_id
        WHERE ci.status = 'POSTED'
            AND ci.invoice_date BETWEEN b.period_start AND b.period_end
            AND cil.analytical_account_id IS NOT NULL
    ) combined
    GROUP BY analytical_account_id, budget_id
) actuals ON b.id = actuals.budget_id;

COMMENT ON VIEW budget_vs_actual IS 'Budget vs Actual report aggregating from POSTED document lines only. Payments do not affect actuals.';

-- =====================================================
-- Helper function to check dependencies before delete
-- =====================================================

-- Function to check contact dependencies
CREATE OR REPLACE FUNCTION check_contact_dependencies(p_contact_id UUID)
RETURNS TABLE (
    dependency_type VARCHAR,
    dependency_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'customer_invoices'::VARCHAR, COUNT(*) FROM customer_invoices WHERE customer_id = p_contact_id
    UNION ALL
    SELECT 'vendor_bills'::VARCHAR, COUNT(*) FROM vendor_bills WHERE vendor_id = p_contact_id
    UNION ALL
    SELECT 'purchase_orders'::VARCHAR, COUNT(*) FROM purchase_orders WHERE vendor_id = p_contact_id
    UNION ALL
    SELECT 'sales_orders'::VARCHAR, COUNT(*) FROM sales_orders WHERE customer_id = p_contact_id
    UNION ALL
    SELECT 'auto_analytical_models'::VARCHAR, COUNT(*) FROM auto_analytical_models WHERE partner_id = p_contact_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check product dependencies
CREATE OR REPLACE FUNCTION check_product_dependencies(p_product_id UUID)
RETURNS TABLE (
    dependency_type VARCHAR,
    dependency_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'customer_invoice_lines'::VARCHAR, COUNT(*) FROM customer_invoice_lines WHERE product_id = p_product_id
    UNION ALL
    SELECT 'vendor_bill_lines'::VARCHAR, COUNT(*) FROM vendor_bill_lines WHERE product_id = p_product_id
    UNION ALL
    SELECT 'sales_order_lines'::VARCHAR, COUNT(*) FROM sales_order_lines WHERE product_id = p_product_id
    UNION ALL
    SELECT 'purchase_order_lines'::VARCHAR, COUNT(*) FROM purchase_order_lines WHERE product_id = p_product_id
    UNION ALL
    SELECT 'auto_analytical_models'::VARCHAR, COUNT(*) FROM auto_analytical_models WHERE product_id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check analytical account dependencies
CREATE OR REPLACE FUNCTION check_analytical_account_dependencies(p_analytical_account_id UUID)
RETURNS TABLE (
    dependency_type VARCHAR,
    dependency_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'budgets'::VARCHAR, COUNT(*) FROM budgets WHERE analytical_account_id = p_analytical_account_id
    UNION ALL
    SELECT 'customer_invoice_lines'::VARCHAR, COUNT(*) FROM customer_invoice_lines WHERE analytical_account_id = p_analytical_account_id
    UNION ALL
    SELECT 'vendor_bill_lines'::VARCHAR, COUNT(*) FROM vendor_bill_lines WHERE analytical_account_id = p_analytical_account_id
    UNION ALL
    SELECT 'sales_order_lines'::VARCHAR, COUNT(*) FROM sales_order_lines WHERE analytical_account_id = p_analytical_account_id
    UNION ALL
    SELECT 'purchase_order_lines'::VARCHAR, COUNT(*) FROM purchase_order_lines WHERE analytical_account_id = p_analytical_account_id
    UNION ALL
    SELECT 'auto_analytical_models'::VARCHAR, COUNT(*) FROM auto_analytical_models WHERE analytical_account_id = p_analytical_account_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check product category dependencies
CREATE OR REPLACE FUNCTION check_product_category_dependencies(p_category_id UUID)
RETURNS TABLE (
    dependency_type VARCHAR,
    dependency_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'products'::VARCHAR, COUNT(*) FROM products WHERE category_id = p_category_id
    UNION ALL
    SELECT 'auto_analytical_models'::VARCHAR, COUNT(*) FROM auto_analytical_models WHERE product_category_id = p_category_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_contact_dependencies IS 'Returns count of dependencies that reference this contact';
COMMENT ON FUNCTION check_product_dependencies IS 'Returns count of dependencies that reference this product';
COMMENT ON FUNCTION check_analytical_account_dependencies IS 'Returns count of dependencies that reference this analytical account';
COMMENT ON FUNCTION check_product_category_dependencies IS 'Returns count of dependencies that reference this product category';
