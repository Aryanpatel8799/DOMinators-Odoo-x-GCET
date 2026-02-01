-- Migration: Add vendor_id column to products table
-- This allows products to be associated with specific vendors

ALTER TABLE products ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES contacts(id);

-- Create index for faster queries filtering by vendor
CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);

-- Update comment
COMMENT ON COLUMN products.vendor_id IS 'Optional vendor association for the product';
