# Upload Error Fix - Summary

## Problem
The upload API was returning HTML error pages (`<!DOCTYPE html>`) instead of JSON, causing "Unexpected token '<'" errors in the frontend.

## Root Causes
1. **Firebase Storage initialization errors** were not being caught properly
2. **API route errors** were being caught by Next.js error handler, returning HTML
3. **Missing error handling** in bucket initialization

## Fixes Applied

### 1. Enhanced Firebase Initialization (`lib/firebase.js`)
- ✅ Added try-catch around entire initialization
- ✅ Check for existing apps before initializing
- ✅ Proper error handling for Storage bucket initialization
- ✅ Explicit bucket name specification
- ✅ Better logging for debugging

### 2. Improved API Error Handling (`pages/api/upload-url.js`)
- ✅ Set `Content-Type: application/json` header explicitly
- ✅ All errors now return JSON, never HTML
- ✅ Better error messages with development details
- ✅ Validate bucket exists before operations
- ✅ Separate error handling for signed URL generation

## Testing
1. ✅ Service account file validated (JSON is valid)
2. ✅ Project ID confirmed: `wedeption-a40a0`
3. ✅ Client email confirmed

## Next Steps
1. Restart the Next.js development server
2. Try uploading an image/video
3. Check server console for initialization logs
4. If errors persist, check:
   - Firebase Storage is enabled in Firebase Console
   - Storage bucket name matches in `.env.local`
   - Service account has Storage Admin permissions

## Environment Variables Needed
Make sure these are set in `.env.local`:
```
FIREBASE_STORAGE_BUCKET=wedeption-a40a0.firebasestorage.app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=wedeption-a40a0.firebasestorage.app
```

## Common Issues
- **"Bucket not configured"**: Check `.env.local` has `FIREBASE_STORAGE_BUCKET`
- **"Failed to generate signed URL"**: Check Firebase Storage is enabled and service account has permissions
- **Still getting HTML errors**: Restart the dev server to reload Firebase initialization

