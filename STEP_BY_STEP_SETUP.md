# Step-by-Step Setup Guide: Supabase & Firebase

Complete visual guide showing exactly where to find and paste each credential.

---

## 📍 Part 1: Supabase Setup

### Step 1: Create Supabase Account & Project

1. **Go to Supabase**
   - Visit: https://supabase.com
   - Click **"Start your project"** or **"Sign in"**

2. **Create Account** (if new)
   - Click **"Sign up"**
   - Use GitHub, Google, or email
   - Verify your email if needed

3. **Create New Project**
   - Click **"New Project"** button (green button, top right)
   - Fill in the form:
     ```
     Organization: (select or create one)
     Name: wedeption (or your choice)
     Database Password: [Create a strong password - SAVE THIS!]
     Region: (choose closest to you, e.g., "Southeast Asia (Mumbai)")
     Pricing Plan: Free (for development)
     ```
   - Click **"Create new project"**
   - ⏳ Wait 1-2 minutes for project to initialize

### Step 2: Get Supabase Credentials

1. **Navigate to Project Settings**
   - In your Supabase dashboard, click on your project name
   - Look for **⚙️ Settings** icon in the left sidebar
   - Click **Settings** → **API**

2. **Copy Project URL**
   - Find **"Project URL"** section
   - You'll see something like: `https://xxxxxxxxxxxxx.supabase.co`
   - Click the **copy icon** 📋 next to it
   - **Paste this in `.env.local` as:**
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
     ```

3. **Copy Anon/Public Key**
   - Find **"Project API keys"** section
   - Look for **"anon"** or **"public"** key
   - It's a long string starting with `eyJ...`
   - Click the **copy icon** 📋 next to it
   - **Paste this in `.env.local` as:**
     ```env
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```

4. **Copy Service Role Key** ⚠️ SECRET!
   - In the same **"Project API keys"** section
   - Find **"service_role"** key (it's longer)
   - Click **"Reveal"** to show it
   - Click the **copy icon** 📋
   - **Paste this in `.env.local` as:**
     ```env
     SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```
   - ⚠️ **NEVER share this key publicly!**

### Step 3: Set Up Database Schema

1. **Open SQL Editor**
   - In left sidebar, click **"SQL Editor"** (icon looks like `</>`)
   - Click **"New query"** button (top right)

2. **Run the Schema**
   - Open the file `supabase_schema.sql` from your project
   - **Select ALL** the content (Ctrl+A / Cmd+A)
   - **Copy** it (Ctrl+C / Cmd+C)
   - **Paste** it into the SQL Editor in Supabase
   - Click **"Run"** button (or press Ctrl+Enter)
   - ⏳ Wait for it to complete (should see "Success" message)

3. **Verify Tables Created**
   - In left sidebar, click **"Table Editor"**
   - You should see these tables:
     - ✅ `users`
     - ✅ `vendors`
     - ✅ `cities` (should have 26 rows)
     - ✅ `categories` (should have 24 rows)
     - ✅ `reviews`
     - ✅ `leads`
     - ✅ `vendor_portfolio`
     - ✅ `subscriptions`
     - ✅ `vendor_availability`
     - ✅ `ai_plans`
     - ✅ `user_credits`

4. **Verify Cities Data**
   - Click on **"cities"** table
   - You should see 26 cities listed
   - If empty, run this in SQL Editor:
     ```sql
     SELECT COUNT(*) FROM cities;
     ```
     Should return: `26`

5. **Verify Categories Data**
   - Click on **"categories"** table
   - You should see 24 categories listed
   - If empty, run this in SQL Editor:
     ```sql
     SELECT COUNT(*) FROM categories;
     ```
     Should return: `24`

### Step 4: Set Up Row Level Security (RLS) - Optional for Development

1. **Go to SQL Editor**
   - Click **"SQL Editor"** → **"New query"**

2. **Run RLS Policies**
   - Copy and paste this code:
     ```sql
     -- Enable RLS on vendors
     ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
     CREATE POLICY "Public vendors are viewable by everyone" ON vendors
       FOR SELECT USING (verified = true);

     -- Enable RLS on cities
     ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
     CREATE POLICY "Cities are viewable by everyone" ON cities
       FOR SELECT USING (is_active = true);

     -- Enable RLS on categories
     ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
     CREATE POLICY "Categories are viewable by everyone" ON categories
       FOR SELECT USING (is_active = true);

     -- Enable RLS on reviews
     ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
     CREATE POLICY "Approved reviews are viewable by everyone" ON reviews
       FOR SELECT USING (approved = true);
     ```
   - Click **"Run"**
   - ✅ Should see "Success" message

---

## 🔥 Part 2: Firebase Setup

### Step 1: Create Firebase Account & Project

1. **Go to Firebase**
   - Visit: https://console.firebase.google.com
   - Sign in with Google account

2. **Create New Project**
   - Click **"Add project"** or **"Create a project"**
   - Enter project name: `wedeption` (or your choice)
   - Click **"Continue"**
   - **Google Analytics**: Choose "Not now" (or enable if you want)
   - Click **"Create project"**
   - ⏳ Wait 30-60 seconds
   - Click **"Continue"** when ready

### Step 2: Enable Authentication

1. **Go to Authentication**
   - In left sidebar, click **"Authentication"** (or 🔐 icon)
   - Click **"Get started"** button

2. **Enable Phone Authentication**
   - Click on **"Phone"** option
   - Toggle **"Enable"** switch to ON
   - Click **"Save"**

3. **Enable Google Authentication**
   - Click on **"Google"** option
   - Toggle **"Enable"** switch to ON
   - Enter **Project support email** (your email)
   - Click **"Save"**

### Step 3: Create Storage Bucket

1. **Go to Storage**
   - In left sidebar, click **"Storage"** (or 📦 icon)
   - Click **"Get started"** button

2. **Set Up Storage**
   - Choose **"Start in test mode"** (for development)
   - Click **"Next"**
   - Choose **Cloud Storage location** (closest to you)
   - Click **"Done"**
   - ✅ Storage bucket created!

### Step 4: Get Firebase Web App Credentials

1. **Go to Project Settings**
   - Click the **⚙️ gear icon** next to "Project Overview" (top left)
   - Click **"Project settings"**

2. **Add Web App**
   - Scroll down to **"Your apps"** section
   - Click the **"</>"** (Web) icon
   - Enter app nickname: `wedeption-web`
   - ✅ Check "Also set up Firebase Hosting" (optional)
   - Click **"Register app"**

3. **Copy Firebase Config**
   - You'll see a code block like this:
     ```javascript
     const firebaseConfig = {
       apiKey: "AIzaSyC...",
       authDomain: "wedeption.firebaseapp.com",
       projectId: "wedeption",
       storageBucket: "wedeption.appspot.com",
       messagingSenderId: "123456789",
       appId: "1:123456789:web:abcdef"
     };
     ```

4. **Copy Each Value to `.env.local`**
   - **apiKey** → Copy and paste as:
     ```env
     NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
     ```
   - **authDomain** → Copy and paste as:
     ```env
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=wedeption.firebaseapp.com
     ```
   - **projectId** → Copy and paste as:
     ```env
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=wedeption
     ```
   - **storageBucket** → Copy and paste as:
     ```env
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=wedeption.appspot.com
     ```

### Step 5: Generate Service Account Key

1. **Go to Service Accounts**
   - Still in **Project Settings**
   - Click **"Service accounts"** tab (top of the page)

2. **Generate Private Key**
   - Click **"Generate new private key"** button
   - A popup will appear
   - Click **"Generate key"**
   - ⚠️ A JSON file will download automatically

3. **Save the JSON File**
   - Find the downloaded file (usually in Downloads folder)
   - It's named something like: `wedeption-firebase-adminsdk-xxxxx.json`
   - **Rename it to:** `firebase-service-account.json`
   - **Move it to your project root folder** (same folder as `package.json`)
   - ✅ File should be at: `wedeption-app-router-v1-premium-ui-edited/firebase-service-account.json`

4. **Add to `.env.local`**
   - Add this line:
     ```env
     FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
     ```

---

## 📝 Part 3: Create `.env.local` File

### Step 1: Create the File

1. **In your project root folder**
   - Navigate to: `wedeption-app-router-v1-premium-ui-edited/`
   - Create a new file named: `.env.local`
   - ⚠️ Make sure it starts with a dot (`.`)

### Step 2: Fill in All Values

Copy this template and replace with YOUR actual values:

```env
# ============================================
# SUPABASE CONFIGURATION
# ============================================
# Get these from: Supabase Dashboard → Settings → API

NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NjE2MjQwMCwiZXhwIjoxOTYxNzM4NDAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eHgiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjQ2MTYyNDAwLCJleHAiOjE5NjE3Mzg0MDB9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ============================================
# FIREBASE CONFIGURATION
# ============================================
# Get these from: Firebase Console → Project Settings → Your apps → Web app

NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=wedeption.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=wedeption
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=wedeption.appspot.com
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# ============================================
# RAZORPAY CONFIGURATION (Optional)
# ============================================
# Get these from: Razorpay Dashboard → Settings → API Keys

# RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
# RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# ============================================
# APP CONFIGURATION
# ============================================

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Verify Your `.env.local` File

Your file should look like this (with YOUR actual values):

```
✅ NEXT_PUBLIC_SUPABASE_URL= (starts with https://)
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY= (long string starting with eyJ)
✅ SUPABASE_SERVICE_ROLE_KEY= (long string starting with eyJ)
✅ NEXT_PUBLIC_FIREBASE_API_KEY= (starts with AIza)
✅ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN= (ends with .firebaseapp.com)
✅ NEXT_PUBLIC_FIREBASE_PROJECT_ID= (your project name)
✅ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET= (ends with .appspot.com)
✅ FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

---

## ✅ Part 4: Verify Setup

### Step 1: Check Files Exist

In your project root, verify you have:
- ✅ `.env.local` file (with all values filled)
- ✅ `firebase-service-account.json` file (in root folder)
- ✅ `supabase_schema.sql` file (already exists)

### Step 2: Install Dependencies

Open terminal in your project folder and run:

```bash
npm install
```

Wait for installation to complete.

### Step 3: Test the Setup

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open browser:**
   - Go to: http://localhost:3000

3. **Check for errors:**
   - Open browser console (F12)
   - Look for any red errors
   - Check terminal for errors

### Step 4: Test Features

1. **Test Cities Dropdown:**
   - On home page, click the "Location" dropdown in search bar
   - Should show all 26 cities
   - ✅ If cities show, Supabase is working!

2. **Test Categories Dropdown:**
   - Click the "Category" dropdown
   - Should show all 24 categories
   - ✅ If categories show, Supabase is working!

3. **Test Vendors Page:**
   - Go to: http://localhost:3000/vendors
   - Should load without errors (may be empty if no vendors yet)
   - ✅ If page loads, everything is connected!

---

## 🔍 Troubleshooting

### Problem: Cities/Categories not showing

**Solution:**
1. Go to Supabase → SQL Editor
2. Run this query:
   ```sql
   SELECT COUNT(*) FROM cities;
   SELECT COUNT(*) FROM categories;
   ```
3. If both return 0, run `supabase_schema.sql` again
4. Check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Problem: "Cannot connect to Supabase"

**Solution:**
1. Check `.env.local` file exists in root folder
2. Verify `NEXT_PUBLIC_SUPABASE_URL` starts with `https://`
3. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
4. Restart dev server: Stop (Ctrl+C) and run `npm run dev` again

### Problem: Firebase authentication not working

**Solution:**
1. Check `.env.local` has all Firebase variables
2. Verify `firebase-service-account.json` exists in root folder
3. Check Firebase Console → Authentication → Sign-in method
4. Ensure Phone and Google are enabled

### Problem: Images not uploading

**Solution:**
1. Check Firebase Storage bucket exists
2. Verify `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` is correct
3. Check `firebase-service-account.json` file is valid JSON
4. Verify Storage rules allow uploads (in Firebase Console)

### Problem: Environment variables not loading

**Solution:**
1. Make sure file is named `.env.local` (not `.env` or `.env.local.txt`)
2. Restart dev server after changing `.env.local`
3. Check for typos in variable names
4. Ensure no spaces around `=` sign

---

## 📋 Quick Reference: Where to Find Each Credential

### Supabase Credentials
| Variable | Where to Find |
|----------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role key |

### Firebase Credentials
| Variable | Where to Find |
|----------|---------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project Settings → Your apps → Web app → apiKey |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Console → Project Settings → Your apps → Web app → authDomain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Console → Project Settings → Your apps → Web app → projectId |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Console → Project Settings → Your apps → Web app → storageBucket |
| `firebase-service-account.json` | Firebase Console → Project Settings → Service accounts → Generate new private key |

---

## ✅ Final Checklist

Before running the app, verify:

- [ ] Supabase project created
- [ ] Supabase credentials copied to `.env.local`
- [ ] Database schema run successfully
- [ ] Cities table has 26 rows
- [ ] Categories table has 24 rows
- [ ] Firebase project created
- [ ] Phone authentication enabled
- [ ] Google authentication enabled
- [ ] Storage bucket created
- [ ] Firebase credentials copied to `.env.local`
- [ ] `firebase-service-account.json` downloaded and renamed
- [ ] `firebase-service-account.json` moved to project root
- [ ] `.env.local` file created with all values
- [ ] `npm install` completed successfully
- [ ] `npm run dev` runs without errors
- [ ] Home page loads at http://localhost:3000
- [ ] Cities dropdown shows 26 cities
- [ ] Categories dropdown shows 24 categories

---

## 🎉 You're All Set!

Once all checkboxes are ✅, your backend is fully configured and ready to use!

**Next Steps:**
1. Start adding vendors through the registration flow
2. Test the search and filter functionality
3. Upload images to test Firebase Storage
4. Test authentication (phone/Google login)

---

**Need Help?**
- Check the troubleshooting section above
- Review browser console for errors
- Check terminal for server errors
- Verify all credentials are correct

