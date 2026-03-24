-- Add name column to vendors table for auto-filled vendor name from phone login
-- This column stores the vendor's personal name (from phone authentication)
-- while contact_person stores the business contact person name

ALTER TABLE IF EXISTS vendors
  ADD COLUMN IF NOT EXISTS name text;

-- Add comments for documentation
COMMENT ON COLUMN vendors.name IS 'Vendor personal name (auto-filled from phone login)';
COMMENT ON COLUMN vendors.phone IS 'Phone number (auto-filled from phone login)';

-- Note: The phone column already exists from previous migrations
-- This migration only adds the name column

