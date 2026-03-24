# Supabase Database Changes Required

## Summary
This document outlines the database schema changes needed to support the updated photo upload functionality and calendar availability fixes.

## No Schema Changes Required ✅

**Good News:** All the fixes made to the codebase are compatible with the existing Supabase schema. No database migrations are needed.

### Existing Tables (Already Compatible)

1. **`vendor_portfolio`** table
   - Already supports `media_url` (text) for storing image URLs
   - Already supports `media_type` (text) - set to 'image'
   - Already supports `caption` (text)
   - Already supports `approved` (boolean)
   - **No changes needed**

2. **`inspiration_feed`** table
   - Already supports `media_url` (text) for storing image URLs
   - Already supports `caption` (text)
   - Already supports `description` (text)
   - Already supports `category` (text)
   - Already supports `approved` (boolean)
   - **No changes needed**

3. **`vendor_availability`** table
   - Already supports `notes` (text) column
   - The API was updated to use `notes` instead of `note` to match the schema
   - **No changes needed**

4. **`vendors`** table
   - Already supports `profile_pic` (text) for profile picture URL
   - Already supports `banner` (text) for banner image URL
   - Already supports `logo` (text) for logo URL
   - **No changes needed**

## What Changed in the Code

### 1. Portfolio Upload
- **Before:** Button existed but had no functionality
- **After:** Full file upload workflow:
  1. User selects image file
  2. File is uploaded to Firebase Storage via `/api/upload-url`
  3. Public URL is saved to `vendor_portfolio.media_url`
  4. Entry is created in `vendor_portfolio` table

### 2. Inspiration Feed Upload
- **Before:** Required manual URL input
- **After:** Instagram-style file upload:
  1. User selects image file (with preview)
  2. File is uploaded to Firebase Storage via `/api/upload-url`
  3. Public URL is saved to `inspiration_feed.media_url`
  4. Entry is created in `inspiration_feed` table

### 3. Calendar Availability
- **Before:** API expected `note` (singular) but database has `notes` (plural)
- **After:** API now correctly uses `notes` to match database schema
- Frontend updated to send `notes` instead of `note`

### 4. Profile Photo Upload
- **Already Working:** Uses the same `/api/upload-url` endpoint
- No changes needed - functionality was already correct

## Storage Location

All uploaded images are stored in **Firebase Storage** at:
- Path: `uploads/{timestamp}-{filename}`
- Public URL format: `https://storage.googleapis.com/{BUCKET_NAME}/uploads/{timestamp}-{filename}`

The public URLs are then stored in the respective Supabase tables (`media_url`, `profile_pic`, `banner`, etc.).

## Verification Steps

To verify everything is working:

1. **Portfolio Upload:**
   - Go to Vendor Dashboard → Portfolio tab
   - Click "Add New Image"
   - Select an image file
   - Add optional caption
   - Click "Upload Image"
   - Verify image appears in portfolio grid

2. **Inspiration Feed Upload:**
   - Go to Vendor Dashboard → Inspiration Feed tab
   - Click "+ Upload Post"
   - Select an image file (preview should appear)
   - Add caption, description, and category
   - Click "Upload Post"
   - Verify post appears in feed

3. **Calendar Availability:**
   - Go to Vendor Dashboard → Availability tab
   - Click on a date
   - Set status (Available/Booked/Not Available)
   - Add notes
   - Click "Save"
   - Verify date is colored correctly and notes are saved

4. **Profile Photo:**
   - Go to Vendor Dashboard → Profile tab
   - Click "Choose File" under Profile Picture
   - Select an image
   - Verify upload completes and image updates

## Notes

- All uploads go through Firebase Storage (not Supabase Storage)
- Images require admin approval before appearing publicly (for portfolio and inspiration feed)
- The `vendor_usage_stats` table tracks monthly upload limits
- Premium vendors have higher limits (50 posts/month, unlimited portfolio)

