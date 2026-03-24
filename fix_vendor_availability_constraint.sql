-- Fix vendor_availability table: Add unique constraint for vendor_id + date
-- This allows upsert operations to work correctly with ON CONFLICT

-- Remove duplicate entries first (if any exist) - keep the most recent one
DELETE FROM vendor_availability a
USING vendor_availability b
WHERE a.id < b.id
  AND a.vendor_id = b.vendor_id
  AND a.date = b.date;

-- Drop constraint if it exists (to avoid errors on re-run)
ALTER TABLE vendor_availability 
DROP CONSTRAINT IF EXISTS vendor_availability_vendor_id_date_unique;

-- Add unique constraint on (vendor_id, date) combination
-- This ensures each vendor can only have one availability record per date
ALTER TABLE vendor_availability 
ADD CONSTRAINT vendor_availability_vendor_id_date_unique 
UNIQUE (vendor_id, date);

-- Add index for better query performance on vendor_id + date lookups
CREATE INDEX IF NOT EXISTS idx_vendor_availability_vendor_date 
ON vendor_availability(vendor_id, date);

-- Add comment for documentation
COMMENT ON CONSTRAINT vendor_availability_vendor_id_date_unique ON vendor_availability 
IS 'Ensures each vendor can only have one availability record per date';

