-- Vendor Registration Complete Schema
-- This file documents all fields required for vendor registration
-- Based on the vendors table structure

-- ============================================
-- VENDORS TABLE STRUCTURE
-- ============================================

-- Core vendor table with all registration fields
CREATE TABLE IF NOT EXISTS vendors (
  -- Primary Key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User Reference
  user_id text REFERENCES users(id),
  
  -- ============================================
  -- BASIC INFORMATION (Required Fields)
  -- ============================================
  business_name text NOT NULL,              -- Business/Company Name (Required)
  contact_person text NOT NULL,             -- Contact Person Full Name (Required)
  email text NOT NULL,                      -- Business Email (Required, type: email)
  phone text NOT NULL,                      -- Primary Phone Number (Required, type: tel)
  whatsapp text,                            -- WhatsApp Number (Optional, type: tel)
  
  -- ============================================
  -- LOCATION & CATEGORY (Required Fields)
  -- ============================================
  city text NOT NULL,                       -- City (Required, dropdown from cities table)
  category text NOT NULL,                   -- Category (Required, dropdown from categories table)
  
  -- ============================================
  -- ADDRESS INFORMATION
  -- ============================================
  business_address text,                    -- Complete Business Address (Optional, type: textarea)
  
  -- ============================================
  -- EXPERIENCE & SERVICES
  -- ============================================
  years_experience int,                     -- Years of Experience (Optional, type: number, min: 0)
  services jsonb,                           -- Services Offered (Array of category names, type: multi-select checkbox)
  other_services text,                      -- Other Services not in categories list (Optional, type: text)
  
  -- ============================================
  -- PRICING INFORMATION
  -- ============================================
  price_range jsonb,                        -- Price Range: {min: number, max: number} (Optional)
  -- Example: {"min": 10000, "max": 100000}
  
  -- ============================================
  -- BUSINESS DESCRIPTION
  -- ============================================
  brand_description text,                   -- Brand/Business Description (Optional, type: textarea)
  why_choose text,                          -- Why Choose Us (Optional, type: textarea)
  deals text,                               -- Current Deals & Offers (Optional, type: textarea)
  
  -- ============================================
  -- ONLINE PRESENCE (Social Media & Website)
  -- ============================================
  website text,                             -- Website URL (Optional, type: url)
  instagram text,                           -- Instagram Handle/URL (Optional, type: text/url)
  facebook text,                            -- Facebook Page URL (Optional, type: url)
  youtube text,                             -- YouTube Channel URL (Optional, type: url)
  
  -- ============================================
  -- LEGAL INFORMATION
  -- ============================================
  gst_number text,                          -- GST Number (15 digits, Optional, type: text, maxLength: 15)
  pan_number text,                          -- PAN Number (10 characters, Optional, type: text, maxLength: 10)
  
  -- ============================================
  -- VERIFICATION & STATUS
  -- ============================================
  verified boolean DEFAULT false,           -- Admin Verification Status
  identity_verified boolean DEFAULT false,   -- Identity Document Verification
  identity_doc_url text,                     -- Identity Document URL (for verification)
  
  -- ============================================
  -- SUBSCRIPTION & RANKING
  -- ============================================
  subscription_level text,                  -- Subscription Level (free, basic, pro, premium)
  priority_rank int DEFAULT 0,             -- Priority Ranking for search results
  
  -- ============================================
  -- METADATA
  -- ============================================
  short_desc text,                          -- Short Description (for listings)
  created_at timestamptz DEFAULT now()      -- Registration Timestamp
);

-- ============================================
-- RELATED TABLES
-- ============================================

-- Cities Table (for City Dropdown)
CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  state text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Categories Table (for Category Dropdown)
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  icon text,
  is_active boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- FIELD DATA TYPES SUMMARY
-- ============================================
/*
REQUIRED FIELDS (marked with *):
- business_name: text (input type: text)
- contact_person: text (input type: text)
- email: text (input type: email)
- phone: text (input type: tel)
- city: text (input type: select/dropdown from cities table)
- category: text (input type: select/dropdown from categories table)

OPTIONAL FIELDS:
- whatsapp: text (input type: tel)
- business_address: text (input type: textarea)
- years_experience: integer (input type: number, min: 0)
- services: jsonb array (input type: multi-select checkbox from categories)
- other_services: text (input type: text)
- price_min: number (input type: number, stored in price_range.min)
- price_max: number (input type: number, stored in price_range.max)
- brand_description: text (input type: textarea)
- why_choose: text (input type: textarea)
- deals: text (input type: textarea)
- website: text (input type: url)
- instagram: text (input type: text)
- facebook: text (input type: url)
- youtube: text (input type: url)
- gst_number: text (input type: text, maxLength: 15)
- pan_number: text (input type: text, maxLength: 10, uppercase)
*/

-- ============================================
-- SAMPLE DATA INSERTION
-- ============================================

-- Insert sample cities (if not exists)
INSERT INTO cities (name, state) VALUES
  ('Gwalior', 'Madhya Pradesh'),
  ('Jabalpur', 'Madhya Pradesh'),
  ('Ujjain', 'Madhya Pradesh'),
  ('Sagar', 'Madhya Pradesh'),
  ('Rewa', 'Madhya Pradesh'),
  ('Satna', 'Madhya Pradesh'),
  ('Ratlam', 'Madhya Pradesh'),
  ('Dewas', 'Madhya Pradesh'),
  ('Chhindwara', 'Madhya Pradesh'),
  ('Khandwa', 'Madhya Pradesh'),
  ('Khargone', 'Madhya Pradesh'),
  ('Morena', 'Madhya Pradesh'),
  ('Bhind', 'Madhya Pradesh'),
  ('Shivpuri', 'Madhya Pradesh'),
  ('Vidisha', 'Madhya Pradesh'),
  ('Mandsaur', 'Madhya Pradesh'),
  ('Neemuch', 'Madhya Pradesh'),
  ('Shahdol', 'Madhya Pradesh'),
  ('Singrauli', 'Madhya Pradesh'),
  ('Burhanpur', 'Madhya Pradesh'),
  ('Betul', 'Madhya Pradesh'),
  ('Sehore', 'Madhya Pradesh'),
  ('Hoshangabad', 'Madhya Pradesh'),
  ('Katni', 'Madhya Pradesh'),
  ('Indore', 'Madhya Pradesh'),
  ('Bhopal', 'Madhya Pradesh')
ON CONFLICT (name) DO NOTHING;

-- Insert sample categories (if not exists)
INSERT INTO categories (name, display_order) VALUES
  ('Venues', 1),
  ('Decorators', 2),
  ('Photographers', 3),
  ('Videographers', 4),
  ('Makeup Artists', 5),
  ('Mehendi Artists', 6),
  ('DJs', 7),
  ('Bands', 8),
  ('Music & Entertainment', 9),
  ('Choreographers', 10),
  ('Caterers', 11),
  ('Cake Artists', 12),
  ('Bartenders', 13),
  ('Invitation Designers', 14),
  ('Gifts & Favours', 15),
  ('Bridal Wear', 16),
  ('Groom Wear', 17),
  ('Clothes Designers', 18),
  ('Jewellery', 19),
  ('Accessories', 20),
  ('Pandits/Priests', 21),
  ('Transportation', 22),
  ('Honeymoon Packages', 23),
  ('Entertainment Artists', 24)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- EXAMPLE VENDOR REGISTRATION DATA
-- ============================================
/*
Example JSON payload for vendor registration:

{
  "business_name": "Royal Decorations",
  "contact_person": "John Doe",
  "email": "contact@royaldecors.com",
  "phone": "+919876543210",
  "whatsapp": "+919876543210",
  "city": "Bhopal",
  "category": "Decorators",
  "business_address": "123 Main Street, Bhopal, MP 462001",
  "years_experience": "5",
  "services": ["Decorators", "Venues"],
  "other_services": "Custom stage design, lighting",
  "price_min": "50000",
  "price_max": "500000",
  "brand_description": "We specialize in elegant wedding decorations...",
  "why_choose": "10+ years experience, award-winning designs",
  "deals": "20% off on bookings before March 2024",
  "website": "https://www.royaldecors.com",
  "instagram": "@royaldecors",
  "facebook": "https://facebook.com/royaldecors",
  "youtube": "https://youtube.com/@royaldecors",
  "gst_number": "23ABCDE1234F1Z5",
  "pan_number": "ABCDE1234F"
}
*/

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_vendors_city ON vendors(city);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_verified ON vendors(verified);
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- ============================================
-- NOTES
-- ============================================
/*
1. All text fields can be NULL except required fields (business_name, contact_person, email, phone, city, category)
2. Services field stores an array of category names as JSONB
3. Price range is stored as JSONB object: {"min": number, "max": number}
4. City and Category should be selected from dropdowns populated from cities and categories tables
5. Services can be multiple selections from categories table
6. PAN number should be stored in uppercase
7. GST number is 15 characters
8. PAN number is 10 characters
9. Phone numbers should include country code (e.g., +91 for India)
10. All URL fields should be validated for proper URL format
*/

