# Wedeption - Backend Setup Guide

Complete guide to set up the backend infrastructure for the Wedeption wedding planning platform.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Supabase Setup](#supabase-setup)
4. [Firebase Setup](#firebase-setup)
5. [Razorpay Setup (Optional)](#razorpay-setup-optional)
6. [Installation & Running](#installation--running)
7. [Database Schema Setup](#database-schema-setup)
8. [API Endpoints Overview](#api-endpoints-overview)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Supabase account** (free tier works)
- **Firebase account** (free tier works)
- **Razorpay account** (optional, for payments)
- **Git** (for cloning the repository)

---

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Razorpay Configuration (Optional)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Supabase Setup

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Fill in:
   - **Project Name**: `wedeption` (or your preferred name)
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
5. Click **"Create new project"**
6. Wait for project to be created (takes 1-2 minutes)

### Step 2: Get Supabase Credentials

1. Go to **Settings** → **API**
2. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

### Step 3: Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **"New Query"**
3. Copy the entire contents of `supabase_schema.sql` file
4. Paste it into the SQL Editor
5. Click **"Run"** or press `Ctrl+Enter`
6. Wait for all tables to be created

**What this creates:**
- ✅ `users` table
- ✅ `vendors` table
- ✅ `vendor_portfolio` table
- ✅ `leads` table
- ✅ `subscriptions` table
- ✅ `reviews` table
- ✅ `vendor_availability` table
- ✅ `cities` table (pre-populated with 26 cities)
- ✅ `categories` table (pre-populated with 24 categories)
- ✅ `ai_plans` table
- ✅ `user_credits` table

### Step 4: Enable Row Level Security (RLS)

1. Go to **Authentication** → **Policies**
2. For each table, you may want to set up policies. For now, you can:
   - **Disable RLS** for development (not recommended for production)
   - Or set up policies based on your requirements

**Basic RLS Policies** (add in SQL Editor):

```sql
-- Allow public read access to vendors
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public vendors are viewable by everyone" ON vendors
  FOR SELECT USING (verified = true);

-- Allow public read access to cities
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cities are viewable by everyone" ON cities
  FOR SELECT USING (is_active = true);

-- Allow public read access to categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (is_active = true);

-- Allow public read access to reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved reviews are viewable by everyone" ON reviews
  FOR SELECT USING (approved = true);
```

### Step 5: Verify Data

1. Go to **Table Editor**
2. Check that `cities` table has 26 cities
3. Check that `categories` table has 24 categories
4. Verify all tables are created successfully

---

## Firebase Setup

### Step 1: Create Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"**
3. Enter project name: `wedeption` (or your preferred name)
4. Disable Google Analytics (optional)
5. Click **"Create project"**

### Step 2: Enable Authentication

1. Go to **Authentication** → **Sign-in method**
2. Enable **Phone** authentication
3. Enable **Google** authentication:
   - Add your domain to authorized domains
   - Save the OAuth client ID

### Step 3: Create Storage Bucket

1. Go to **Storage** → **Get started**
2. Start in **test mode** (for development)
3. Choose a location for your bucket
4. Click **"Done"**

### Step 4: Get Firebase Credentials

1. Go to **Project Settings** (gear icon)
2. Scroll to **"Your apps"**
3. Click **Web** icon (`</>`)
4. Register app with nickname: `wedeption-web`
5. Copy the config values:
   ```javascript
   apiKey: "..." → NEXT_PUBLIC_FIREBASE_API_KEY
   authDomain: "..." → NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   projectId: "..." → NEXT_PUBLIC_FIREBASE_PROJECT_ID
   storageBucket: "..." → NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   ```

### Step 5: Generate Service Account Key

1. Go to **Project Settings** → **Service accounts**
2. Click **"Generate new private key"**
3. Download the JSON file
4. Save it as `firebase-service-account.json` in the project root
5. Add to `.gitignore` (already included)

**⚠️ Important:** Never commit this file to Git!

---

## Razorpay Setup (Optional)

Only needed if you want payment/subscription features.

### Step 1: Create Razorpay Account

1. Go to [https://razorpay.com](https://razorpay.com)
2. Sign up for an account
3. Complete KYC verification

### Step 2: Get API Keys

1. Go to **Settings** → **API Keys**
2. Generate **Test Keys** (for development)
3. Copy:
   - **Key ID** → `RAZORPAY_KEY_ID`
   - **Key Secret** → `RAZORPAY_KEY_SECRET`

### Step 3: Set Up Webhook (For Subscriptions)

1. Go to **Settings** → **Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/razorpay-webhook`
3. Select events: `subscription.charged`, `payment.captured`
4. Save webhook secret

---

## Installation & Running

### Step 1: Install Dependencies

```bash
npm install
# or
yarn install
```

### Step 2: Set Up Environment Variables

1. Copy `.env.example` to `.env.local` (if exists)
2. Or create `.env.local` manually
3. Fill in all the values from the sections above

### Step 3: Run Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

### Step 4: Build for Production

```bash
npm run build
npm start
```

---

## Database Schema Setup

The `supabase_schema.sql` file includes:

### Core Tables

- **users**: User accounts and profiles
- **vendors**: Vendor business information
- **vendor_portfolio**: Vendor images and media
- **leads**: Customer inquiries/leads
- **reviews**: Customer reviews and ratings
- **subscriptions**: Vendor subscription plans

### Reference Tables

- **cities**: Pre-populated with 26 cities in Madhya Pradesh
- **categories**: Pre-populated with 24 service categories

### Feature Tables

- **vendor_availability**: Calendar for vendor availability
- **ai_plans**: AI-generated wedding plans
- **user_credits**: User credit system

### Running the Schema

**Option 1: Via Supabase Dashboard**
1. Go to SQL Editor
2. Paste entire `supabase_schema.sql`
3. Click Run

**Option 2: Via Supabase CLI** (if installed)
```bash
supabase db push
```

**Option 3: Via psql** (if you have direct database access)
```bash
psql -h your-db-host -U postgres -d postgres -f supabase_schema.sql
```

---

## API Endpoints Overview

### Public Endpoints

- `GET /api/vendors` - List vendors (supports city, category, sort filters)
- `GET /api/vendors/[id]` - Get vendor details
- `GET /api/cities` - List all cities
- `GET /api/categories` - List all categories
- `GET /api/feed` - Get inspiration feed
- `GET /api/compare` - Compare vendors

### Authentication Required

- `POST /api/sync-user` - Sync Firebase user to Supabase
- `POST /api/leads` - Create a lead/inquiry
- `POST /api/reviews/submit` - Submit a review
- `GET /api/vendor/me` - Get vendor dashboard data

### Vendor Endpoints

- `POST /api/register-vendor` - Register new vendor
- `GET /api/vendor/analytics` - Vendor analytics
- `GET /api/vendor/chats` - Vendor chats
- `POST /api/vendor/lead-action` - Update lead status

### Admin Endpoints

- `POST /api/admin/approve` - Approve vendor
- `GET /api/admin/queue` - Get approval queue
- `POST /api/admin/approve-review` - Approve review

---

## Troubleshooting

### Issue: "Cannot connect to Supabase"

**Solution:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check if Supabase project is active
- Verify network connectivity

### Issue: "Firebase authentication not working"

**Solution:**
- Check Firebase credentials in `.env.local`
- Verify Firebase project is active
- Check if phone/Google auth is enabled in Firebase console
- Verify `firebase-service-account.json` exists and is valid

### Issue: "Cities/Categories not showing"

**Solution:**
- Run `supabase_schema.sql` again
- Check if `cities` and `categories` tables exist
- Verify data was inserted (check Table Editor)
- Check RLS policies allow public read access

### Issue: "Vendors not loading"

**Solution:**
- Check if vendors table has data
- Verify `verified = true` for vendors you want to show
- Check browser console for errors
- Verify API endpoint is working: `http://localhost:3000/api/vendors`

### Issue: "Images not uploading"

**Solution:**
- Verify Firebase Storage bucket exists
- Check `firebase-service-account.json` has correct permissions
- Verify `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` is correct
- Check Firebase Storage rules allow uploads

### Issue: "Environment variables not loading"

**Solution:**
- Ensure file is named `.env.local` (not `.env`)
- Restart the development server after changing `.env.local`
- Check for typos in variable names
- Verify no extra spaces around `=` sign

---

## Next Steps

After setup is complete:

1. ✅ Test the application at `http://localhost:3000`
2. ✅ Verify cities and categories are loading
3. ✅ Test vendor registration
4. ✅ Test image uploads
5. ✅ Set up production environment variables
6. ✅ Configure proper RLS policies for production
7. ✅ Set up monitoring and error tracking

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Supabase and Firebase console logs
3. Check browser console for client-side errors
4. Review server logs in terminal

---

## Security Notes

⚠️ **Important Security Practices:**

1. **Never commit** `.env.local` or `firebase-service-account.json` to Git
2. **Never expose** `SUPABASE_SERVICE_ROLE_KEY` in client-side code
3. **Use RLS policies** in production to secure data
4. **Rotate keys** regularly
5. **Use environment-specific** credentials (dev/staging/prod)

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Razorpay Documentation](https://razorpay.com/docs)

---

**Happy Coding! 🎉**

