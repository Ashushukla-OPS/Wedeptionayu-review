# Firebase Phone Authentication Setup Guide

## 🔴 CRITICAL: Fix "400 Bad Request" Error

If you're seeing a `400 Bad Request` error when trying to send OTP, it means **Phone Authentication is NOT properly configured** in your Firebase project.

## Step-by-Step Fix

### 1. Enable Phone Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **wedeption-a40a0**
3. Navigate to: **Authentication** → **Sign-in method**
4. Find **"Phone"** in the list of providers
5. Click on **"Phone"**
6. Click **"Enable"** toggle (if disabled)
7. Click **"Save"**

### 2. Add Authorized Domains

1. Still in **Authentication** → **Sign-in method** → **Phone**
2. Scroll down to **"Authorized domains"**
3. Make sure these domains are listed:
   - `localhost`
   - `127.0.0.1`
   - Your production domain (if applicable)
4. If `localhost` is missing, click **"Add domain"** and add it
5. Click **"Save"**

### 3. Verify API Key Permissions

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **wedeption-a40a0**
3. Navigate to: **APIs & Services** → **Credentials**
4. Find your API key: `AIzaSyAdXfPbwZ2daDMdIx7vnCz9gnBf8lsXRks`
5. Click on the API key to edit it
6. Under **"API restrictions"**, make sure:
   - **"Identity Toolkit API"** is enabled
   - OR set to **"Don't restrict key"** (for development)
7. Under **"Application restrictions"**:
   - For development: Set to **"None"**
   - For production: Add your domain restrictions
8. Click **"Save"**

### 4. Enable Required APIs

1. In [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **APIs & Services** → **Library**
3. Search for and enable these APIs:
   - **Identity Toolkit API** ✅
   - **Firebase Authentication API** ✅

### 5. Verify Firebase Project Settings

1. In Firebase Console, go to: **Project Settings** (gear icon) → **General**
2. Verify:
   - **Project ID**: `wedeption-a40a0`
   - **Web API Key**: `AIzaSyAdXfPbwZ2daDMdIx7vnCz9gnBf8lsXRks`
   - **Auth Domain**: `wedeption-a40a0.firebaseapp.com`

### 6. Test Phone Numbers (Optional - for Development)

1. In Firebase Console: **Authentication** → **Sign-in method** → **Phone**
2. Scroll to **"Test phone numbers"**
3. Add test numbers (format: `+91XXXXXXXXXX`) to test without sending real SMS
4. Click **"Add phone number"**

## After Making Changes

1. **Wait 2-3 minutes** for changes to propagate
2. **Restart your development server**:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   npm run dev
   ```
3. **Clear browser cache** or use incognito mode
4. **Try again** - the error should be resolved

## Common Issues

### Issue: "auth/invalid-app-credential"
- **Fix**: Enable Phone Authentication in Firebase Console (Step 1)

### Issue: "auth/unauthorized-domain"
- **Fix**: Add `localhost` to authorized domains (Step 2)

### Issue: "400 Bad Request" from identitytoolkit.googleapis.com
- **Fix**: Enable Identity Toolkit API in Google Cloud Console (Step 4)

### Issue: API key restrictions blocking requests
- **Fix**: Check API key permissions (Step 3)

## Verification Checklist

- [ ] Phone Authentication is **Enabled** in Firebase Console
- [ ] `localhost` is in **Authorized domains**
- [ ] **Identity Toolkit API** is enabled in Google Cloud Console
- [ ] API key has correct permissions
- [ ] Development server has been **restarted** after changes
- [ ] Browser cache has been cleared

## Still Not Working?

1. Check browser console for detailed error messages
2. Verify Firebase config in `lib/config.js` matches your project
3. Check that your API key is not restricted incorrectly
4. Try using a test phone number from Firebase Console
5. Check Firebase Console → Authentication → Users to see if any attempts are logged

## Support Links

- [Firebase Phone Auth Docs](https://firebase.google.com/docs/auth/web/phone-auth)
- [Firebase Console](https://console.firebase.google.com/project/wedeption-a40a0/authentication/providers)
- [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=wedeption-a40a0)

