-- =====================================================
-- MIGRATION: Feature Additions
-- 1. Budget Revision Tracking
-- 2. Budget Achievement Reports
-- =====================================================

-- =====================================================
-- BUDGET REVISIONS TABLE
-- Tracks all changes to budget amounts
-- =====================================================

CREATE TABLE IF NOT EXISTS budget_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL,
    previous_amount DECIMAL(15, 2) NOT NULL,
    new_amount DECIMAL(15, 2) NOT NULL,
    change_amount DECIMAL(15, 2) NOT NULL,
    change_percentage DECIMAL(10, 2) NOT NULL,
    reason TEXT,
    revised_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_revision_number UNIQUE (budget_id, revision_number)
);

CREATE INDEX idx_budget_revisions_budget ON budget_revisions(budget_id);
CREATE INDEX idx_budget_revisions_date ON budget_revisions(created_at);

-- =====================================================
-- FUNCTION: Get next revision number for a budget
-- =====================================================

CREATE OR REPLACE FUNCTION get_next_revision_number(p_budget_id UUID)
RETURNS INTEGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(revision_number), 0) + 1
    INTO next_num
    FROM budget_revisions
    WHERE budget_id = p_budget_id;
    
    RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- BUDGET ACHIEVEMENT SUMMARY VIEW
-- Aggregated view for charts and dashboards
-- =====================================================

CREATE OR REPLACE VIEW budget_achievement_summary AS
SELECT 
    b.analytical_account_id,
    aa.code as analytical_account_code,
    aa.name as analytical_account_name,
    DATE_TRUNC('month', b.period_start) as month,
    EXTRACT(YEAR FROM b.period_start) as year,
    SUM(b.budget_amount) as total_budget,
    COALESCE(SUM(
        (SELECT COALESCE(SUM(vbl.subtotal), 0)
         FROM vendor_bill_lines vbl
         JOIN vendor_bills vb ON vbl.vendor_bill_id = vb.id
         WHERE vbl.analytical_account_id = b.analytical_account_id
         AND vb.status = 'POSTED'
         AND vb.bill_date BETWEEN b.period_start AND b.period_end)
    ), 0) as total_expense,
    COALESCE(SUM(
        (SELECT COALESCE(SUM(cil.subtotal), 0)
         FROM customer_invoice_lines cil
         JOIN customer_invoices ci ON cil.customer_invoice_id = ci.id
         WHERE cil.analytical_account_id = b.analytical_account_id
         AND ci.status = 'POSTED'
         AND ci.invoice_date BETWEEN b.period_start AND b.period_end)
    ), 0) as total_revenue,
    COUNT(DISTINCT b.id) as budget_count
FROM budgets b
JOIN analytical_accounts aa ON b.analytical_account_id = aa.id
GROUP BY b.analytical_account_id, aa.code, aa.name, DATE_TRUNC('month', b.period_start), EXTRACT(YEAR FROM b.period_start);

-- =====================================================
-- BUDGET TREND VIEW
-- For time-series charts showing budget trends
-- =====================================================

CREATE OR REPLACE VIEW budget_trend AS
WITH monthly_budgets AS (
    SELECT 
        DATE_TRUNC('month', period_start) as period_month,
        EXTRACT(YEAR FROM period_start)::INTEGER as period_year,
        SUM(budget_amount) as total_budget
    FROM budgets
    GROUP BY DATE_TRUNC('month', period_start), EXTRACT(YEAR FROM period_start)
),
monthly_expenses AS (
    SELECT 
        DATE_TRUNC('month', vb.bill_date) as period_month,
        EXTRACT(YEAR FROM vb.bill_date)::INTEGER as period_year,
        SUM(vbl.subtotal) as total_expense
    FROM vendor_bill_lines vbl
    JOIN vendor_bills vb ON vbl.vendor_bill_id = vb.id
    WHERE vb.status = 'POSTED'
    GROUP BY DATE_TRUNC('month', vb.bill_date), EXTRACT(YEAR FROM vb.bill_date)
),
monthly_revenue AS (
    SELECT 
        DATE_TRUNC('month', ci.invoice_date) as period_month,
        EXTRACT(YEAR FROM ci.invoice_date)::INTEGER as period_year,
        SUM(cil.subtotal) as total_revenue
    FROM customer_invoice_lines cil
    JOIN customer_invoices ci ON cil.customer_invoice_id = ci.id
    WHERE ci.status = 'POSTED'
    GROUP BY DATE_TRUNC('month', ci.invoice_date), EXTRACT(YEAR FROM ci.invoice_date)
)
SELECT 
    mb.period_month,
    mb.period_year,
    mb.total_budget,
    COALESCE(me.total_expense, 0) as total_expense,
    COALESCE(mr.total_revenue, 0) as total_revenue
FROM monthly_budgets mb
LEFT JOIN monthly_expenses me ON mb.period_month = me.period_month AND mb.period_year = me.period_year
LEFT JOIN monthly_revenue mr ON mb.period_month = mr.period_month AND mb.period_year = mr.period_year
ORDER BY mb.period_year, mb.period_month;

-- =====================================================
-- COST CENTER PERFORMANCE VIEW
-- Performance metrics by analytical account
-- =====================================================

CREATE OR REPLACE VIEW cost_center_performance AS
SELECT 
    aa.id as analytical_account_id,
    aa.code as analytical_account_code,
    aa.name as analytical_account_name,
    COALESCE(SUM(b.budget_amount), 0) as total_allocated_budget,
    (SELECT COALESCE(SUM(vbl.subtotal), 0)
     FROM vendor_bill_lines vbl
     JOIN vendor_bills vb ON vbl.vendor_bill_id = vb.id
     WHERE vbl.analytical_account_id = aa.id
     AND vb.status = 'POSTED'
    ) as total_expense,
    (SELECT COALESCE(SUM(cil.subtotal), 0)
     FROM customer_invoice_lines cil
     JOIN customer_invoices ci ON cil.customer_invoice_id = ci.id
     WHERE cil.analytical_account_id = aa.id
     AND ci.status = 'POSTED'
    ) as total_revenue,
    (SELECT COUNT(DISTINCT vb.id)
     FROM vendor_bill_lines vbl
     JOIN vendor_bills vb ON vbl.vendor_bill_id = vb.id
     WHERE vbl.analytical_account_id = aa.id
     AND vb.status = 'POSTED'
    ) as bill_count,
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

COMMENT ON TABLE budget_revisions IS 'Tracks all budget amount revisions with history';
COMMENT ON VIEW budget_achievement_summary IS 'Monthly aggregated budget achievement data for charts';
COMMENT ON VIEW budget_trend IS 'Time-series data for budget trend charts';
COMMENT ON VIEW cost_center_performance IS 'Performance metrics by cost center';
