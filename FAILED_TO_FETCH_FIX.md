# "Failed to Fetch" Error - Troubleshooting Guide

## Problem
Getting "Failed to fetch" error when trying to upload files.

## Possible Causes & Solutions

### 1. **Server Not Running**
**Check:** Is your Next.js dev server running?
```bash
npm run dev
```
**Solution:** Start the server and try again.

### 2. **Firebase Initialization Error**
**Check:** Look at your server console (terminal where `npm run dev` is running)
- You should see: "Firebase Admin initialized successfully..."
- You should see: "Firebase Storage bucket initialized: ..."

**If you see errors:**
- Check `firebase-service-account.json` exists in project root
- Verify the file is valid JSON
- Check environment variables in `.env.local`

### 3. **Module Import Error**
**Check:** The API route might be crashing during import
**Solution:** 
1. Restart your dev server completely (stop and start again)
2. Check server console for any import errors

### 4. **Network/CORS Issue**
**Check:** Open browser DevTools → Network tab
- Look for the `/api/upload-url` request
- Check if it shows "Failed" or "CORS error"

**Solution:** This shouldn't happen with Next.js API routes, but if it does:
- Check `next.config.js` for CORS settings
- Verify you're accessing from `localhost:3000` (not a different port)

### 5. **Firebase Storage Not Enabled**
**Check:** Firebase Console → Storage
- Is Storage enabled?
- Is the bucket created?

**Solution:** 
1. Go to Firebase Console
2. Enable Storage if not enabled
3. Create a bucket if needed

### 6. **Service Account Permissions**
**Check:** Firebase Console → IAM & Admin → Service Accounts
- Does the service account have "Storage Admin" role?

**Solution:**
1. Go to Firebase Console
2. IAM & Admin → Service Accounts
3. Find your service account email
4. Ensure it has "Storage Admin" permissions

## Quick Diagnostic Steps

1. **Check Server Console:**
   ```bash
   # Look for these messages:
   Firebase Admin initialized successfully with storage bucket: ...
   Firebase Storage bucket initialized: ...
   ```

2. **Test API Route Directly:**
   Open browser and go to: `http://localhost:3000/api/upload-url`
   - Should return: `{"error":"Method not allowed"}` (because it's GET, not POST)
   - If you get HTML error page, the route is crashing

3. **Check Browser Console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for any JavaScript errors

4. **Check Network Tab:**
   - Open DevTools → Network
   - Try uploading
   - Click on the `/api/upload-url` request
   - Check Status code and Response

## Environment Variables Checklist

Make sure `.env.local` has:
```env
FIREBASE_STORAGE_BUCKET=wedeption-a40a0.firebasestorage.app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=wedeption-a40a0.firebasestorage.app
```

## Most Common Fix

**Restart the dev server:**
1. Stop the server (Ctrl+C)
2. Delete `.next` folder (optional, but helps)
3. Start again: `npm run dev`
4. Try uploading again

## Still Not Working?

1. Check server console for exact error messages
2. Verify `firebase-service-account.json` is in project root
3. Check Firebase Console → Storage is enabled
4. Verify service account has Storage Admin permissions

