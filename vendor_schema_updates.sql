-- Vendor Schema Updates
-- Add Aadhar Card and Price Detail fields
-- Make phone number unique constraint

-- Add new columns to vendors table
ALTER TABLE IF EXISTS vendors
  ADD COLUMN IF NOT EXISTS aadhar_card text,
  ADD COLUMN IF NOT EXISTS price_detail text;

-- Add unique constraint on phone number to prevent duplicate registrations
-- Note: This will fail if there are existing duplicate phone numbers
-- You may need to clean up duplicates first
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'vendors_phone_unique'
  ) THEN
    -- Add unique constraint on phone
    ALTER TABLE vendors 
    ADD CONSTRAINT vendors_phone_unique UNIQUE (phone);
  END IF;
END $$;

-- Add index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendors_phone ON vendors(phone);

-- Add index on aadhar_card for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendors_aadhar ON vendors(aadhar_card);

-- Comments for documentation
COMMENT ON COLUMN vendors.aadhar_card IS 'Aadhar Card Number (12 digits, required)';
COMMENT ON COLUMN vendors.price_detail IS 'Detailed price information according to services (text field)';
COMMENT ON COLUMN vendors.phone IS 'Phone number - must be unique (one phone can only register once)';
COMMENT ON COLUMN vendors.gst_number IS 'GST Number (optional)';
COMMENT ON COLUMN vendors.pan_number IS 'PAN Number (required, 10 characters)';

-- Update existing vendors to set default values if needed
-- UPDATE vendors SET aadhar_card = NULL WHERE aadhar_card IS NULL;
-- UPDATE vendors SET price_detail = NULL WHERE price_detail IS NULL;




