-- Add banner, logo, and profile_pic columns to vendors table
-- These columns store image URLs for vendor branding

-- Add banner column (for vendor banner image)
ALTER TABLE IF EXISTS vendors
  ADD COLUMN IF NOT EXISTS banner text;

-- Add logo column (for vendor logo image)
ALTER TABLE IF EXISTS vendors
  ADD COLUMN IF NOT EXISTS logo text;

-- Add profile_pic column (for vendor profile picture)
ALTER TABLE IF EXISTS vendors
  ADD COLUMN IF NOT EXISTS profile_pic text;

-- Add comments for documentation
COMMENT ON COLUMN vendors.banner IS 'Vendor banner image URL (displayed at top of vendor profile)';
COMMENT ON COLUMN vendors.logo IS 'Vendor logo image URL';
COMMENT ON COLUMN vendors.profile_pic IS 'Vendor profile picture image URL';

