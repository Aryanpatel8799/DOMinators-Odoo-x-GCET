-- Migration: Add analytical_account_id to purchase_order_lines
-- This ensures the column exists for budget tracking

-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_order_lines' 
        AND column_name = 'analytical_account_id'
    ) THEN
        ALTER TABLE purchase_order_lines 
        ADD COLUMN analytical_account_id UUID REFERENCES analytical_accounts(id);
        
        RAISE NOTICE 'Added analytical_account_id column to purchase_order_lines';
    ELSE
        RAISE NOTICE 'Column analytical_account_id already exists in purchase_order_lines';
    END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_pol_analytical 
ON purchase_order_lines(analytical_account_id);
