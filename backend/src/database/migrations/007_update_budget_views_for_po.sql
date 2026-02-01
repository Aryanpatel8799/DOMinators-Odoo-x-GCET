-- Migration: Update budget views to use Purchase Orders instead of Vendor Bills for expense tracking
-- Since Vendor Bills feature is removed from UI, we now track expenses via Purchase Orders

-- =====================================================
-- UPDATE BUDGET VS ACTUAL VIEW
-- =====================================================

DROP VIEW IF EXISTS budget_vs_actual CASCADE;

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
    -- Aggregate actuals from document lines
    SELECT 
        analytical_account_id,
        budget_id,
        SUM(expense_amount) AS actual_expense,
        SUM(revenue_amount) AS actual_revenue
    FROM (
        -- Purchase Order Lines (Expenses) - from CONFIRMED or POSTED orders
        SELECT 
            pol.analytical_account_id,
            b.id AS budget_id,
            pol.subtotal AS expense_amount,
            0::DECIMAL AS revenue_amount
        FROM purchase_order_lines pol
        JOIN purchase_orders po ON pol.purchase_order_id = po.id
        JOIN budgets b ON pol.analytical_account_id = b.analytical_account_id
        WHERE po.status IN ('CONFIRMED', 'POSTED')
            AND po.order_date BETWEEN b.period_start AND b.period_end
            AND pol.analytical_account_id IS NOT NULL
        
        UNION ALL
        
        -- Customer Invoice Lines (Revenue) - only from POSTED invoices
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

COMMENT ON VIEW budget_vs_actual IS 'Budget vs Actual report - uses Purchase Orders for expenses and Customer Invoices for revenue';

-- =====================================================
-- UPDATE COST CENTER PERFORMANCE VIEW
-- =====================================================

DROP VIEW IF EXISTS cost_center_performance CASCADE;

CREATE OR REPLACE VIEW cost_center_performance AS
SELECT 
    aa.id as analytical_account_id,
    aa.code as analytical_account_code,
    aa.name as cost_center_name,
    COALESCE(SUM(b.budget_amount), 0) as total_budget,
    (SELECT COALESCE(SUM(pol.subtotal), 0)
     FROM purchase_order_lines pol
     JOIN purchase_orders po ON pol.purchase_order_id = po.id
     WHERE pol.analytical_account_id = aa.id
     AND po.status IN ('CONFIRMED', 'POSTED')
    ) as total_expense,
    (SELECT COALESCE(SUM(cil.subtotal), 0)
     FROM customer_invoice_lines cil
     JOIN customer_invoices ci ON cil.customer_invoice_id = ci.id
     WHERE cil.analytical_account_id = aa.id
     AND ci.status = 'POSTED'
    ) as total_revenue,
    (SELECT COUNT(DISTINCT po.id)
     FROM purchase_order_lines pol
     JOIN purchase_orders po ON pol.purchase_order_id = po.id
     WHERE pol.analytical_account_id = aa.id
     AND po.status IN ('CONFIRMED', 'POSTED')
    ) as order_count,
    (SELECT COUNT(DISTINCT ci.id)
     FROM customer_invoice_lines cil
     JOIN customer_invoices ci ON cil.customer_invoice_id = ci.id
     WHERE cil.analytical_account_id = aa.id
     AND ci.status = 'POSTED'
    ) as invoice_count,
    (SELECT COUNT(*) FROM budget_revisions br 
     JOIN budgets b2 ON br.budget_id = b2.id 
     WHERE b2.analytical_account_id = aa.id
    ) as revision_count
FROM analytical_accounts aa
LEFT JOIN budgets b ON aa.id = b.analytical_account_id
WHERE aa.is_active = TRUE
GROUP BY aa.id, aa.code, aa.name;

COMMENT ON VIEW cost_center_performance IS 'Performance metrics by cost center - uses Purchase Orders for expenses';

-- =====================================================
-- UPDATE BUDGET ACHIEVEMENT SUMMARY VIEW (if exists)
-- =====================================================

DROP VIEW IF EXISTS budget_achievement_summary CASCADE;

CREATE OR REPLACE VIEW budget_achievement_summary AS
SELECT 
    b.id AS budget_id,
    aa.id AS analytical_account_id,
    aa.code AS account_code,
    aa.name AS account_name,
    b.period_start,
    b.period_end,
    EXTRACT(YEAR FROM b.period_start) AS period_year,
    EXTRACT(MONTH FROM b.period_start) AS period_month,
    b.budget_amount,
    COALESCE(po_totals.total_expense, 0) AS actual_expense,
    COALESCE(ci_totals.total_revenue, 0) AS actual_revenue,
    CASE 
        WHEN b.budget_amount = 0 THEN 0
        ELSE ROUND((COALESCE(po_totals.total_expense, 0) / b.budget_amount) * 100, 2)
    END AS achievement_percentage
FROM budgets b
JOIN analytical_accounts aa ON b.analytical_account_id = aa.id
LEFT JOIN (
    SELECT 
        pol.analytical_account_id,
        b.id AS budget_id,
        SUM(pol.subtotal) AS total_expense
    FROM purchase_order_lines pol
    JOIN purchase_orders po ON pol.purchase_order_id = po.id
    JOIN budgets b ON pol.analytical_account_id = b.analytical_account_id
        AND po.order_date BETWEEN b.period_start AND b.period_end
    WHERE po.status IN ('CONFIRMED', 'POSTED')
        AND pol.analytical_account_id IS NOT NULL
    GROUP BY pol.analytical_account_id, b.id
) po_totals ON b.id = po_totals.budget_id
LEFT JOIN (
    SELECT 
        cil.analytical_account_id,
        b.id AS budget_id,
        SUM(cil.subtotal) AS total_revenue
    FROM customer_invoice_lines cil
    JOIN customer_invoices ci ON cil.customer_invoice_id = ci.id
    JOIN budgets b ON cil.analytical_account_id = b.analytical_account_id
        AND ci.invoice_date BETWEEN b.period_start AND b.period_end
    WHERE ci.status = 'POSTED'
        AND cil.analytical_account_id IS NOT NULL
    GROUP BY cil.analytical_account_id, b.id
) ci_totals ON b.id = ci_totals.budget_id
ORDER BY aa.code, b.period_start;

COMMENT ON VIEW budget_achievement_summary IS 'Budget achievement summary for dashboard';
