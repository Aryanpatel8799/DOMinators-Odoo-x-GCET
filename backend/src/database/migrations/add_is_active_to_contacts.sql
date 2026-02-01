-- Migration: Add is_active column to contacts table for vendor activation status
-- Date: 2024

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create index for faster queries filtering by is_active
CREATE INDEX IF NOT EXISTS idx_contacts_is_active ON contacts(is_active);

-- Update comment
COMMENT ON COLUMN contacts.is_active IS 'Activation status for vendors (defaults to true)';
