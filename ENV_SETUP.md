# Environment Variables Setup Guide

## Quick Setup

1. **Create `.env.local` file** in the root directory of your project
2. **Copy the following content** into `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://asnvudnxpjrirfpmalym.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzbnZ1ZG54cGpyaXJmcG1hbHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDk5MTMsImV4cCI6MjA4MDY4NTkxM30.uNDr-H7W7S4ZH7TOcorfxK3OwP8a2TYRMmsIrDhDguc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzbnZ1ZG54cGpyaXJmcG1hbHltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTEwOTkxMywiZXhwIjoyMDgwNjg1OTEzfQ.I3jRxEhiy7bRSTfTEsr0-DtxYphsd7bT0snpotV9y5w

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA5mbNhlinSBJn3_EoyWNg-HYarQOrp034
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=wedeption-21093.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=wedeption-21093
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=wedeption-21093.firebasestorage.app
FIREBASE_STORAGE_BUCKET=wedeption-21093.firebasestorage.app
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Razorpay Configuration (Add your Razorpay keys here)
# Get these from your Razorpay Dashboard: https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

3. **Add your Razorpay keys** (if you have them):
   - Go to [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys)
   - Copy your Key ID and Key Secret
   - Replace `your_razorpay_key_id` and `your_razorpay_key_secret` in `.env.local`

4. **Restart your development server** after creating/updating `.env.local`

## Credentials Summary

### Supabase
- **Project URL**: https://asnvudnxpjrirfpmalym.supabase.co
- **Project ID**: asnvudnxpjrirfpmalym
- **Anon Key**: Already configured above
- **Service Role Key**: Already configured above

### Firebase
- **Project ID**: wedeption-21093
- **API Key**: Already configured above
- **Auth Domain**: wedeption-21093.firebaseapp.com
- **Storage Bucket**: wedeption-21093.firebasestorage.app
- **Service Account**: Already configured in `firebase-service-account.json`

### Razorpay
- **Key ID**: Add from Razorpay Dashboard
- **Key Secret**: Add from Razorpay Dashboard
- **Public Key ID**: Same as Key ID (for client-side)

## File Locations

- **Environment Variables**: `.env.local` (create this file)
- **Firebase Service Account**: `firebase-service-account.json` (already exists)
- **Supabase Config**: `lib/supabase.js` and `lib/supabase_server.js`
- **Firebase Config**: `lib/firebase_client.js` and `lib/firebase_admin.js`

## Verification

After setting up, verify your configuration:

1. **Check Supabase connection**: Visit `/api/vendors` endpoint
2. **Check Firebase connection**: Try logging in
3. **Check Razorpay**: Test subscription flow (if keys are added)

## Important Notes

- `.env.local` is already in `.gitignore` - your secrets are safe
- Never commit `.env.local` to git
- Use `.env.example` as a template for team members
- Restart the dev server after changing environment variables

