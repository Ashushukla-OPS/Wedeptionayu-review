# Upload "Failed to Fetch" - Debugging Guide

## ✅ Good News
Your API route is working! The test at `http://localhost:3000/api/upload-url` shows:
- Route exists ✅
- Returns JSON (not HTML) ✅
- Error handling works ✅

## 🔍 Debugging Steps

### 1. Check Browser Console
When you try to upload, open DevTools (F12) → Console tab and look for:
- Any error messages
- Network errors
- JavaScript errors

### 2. Check Network Tab
1. Open DevTools (F12) → Network tab
2. Try uploading a file
3. Look for the `/api/upload-url` request
4. Click on it and check:
   - **Status Code**: Should be 200 (success) or 4xx/5xx (error)
   - **Response**: Should be JSON with `uploadUrl` and `publicUrl`
   - **Request Payload**: Should have `filename` and `contentType`

### 3. Check Server Console
Look at the terminal where `npm run dev` is running for:
- Firebase initialization messages
- Any error logs
- API request logs

### 4. Common Issues & Solutions

#### Issue: "Failed to fetch" with no details
**Cause:** Network error, server not running, or CORS issue
**Solution:**
1. Make sure dev server is running: `npm run dev`
2. Check you're on `localhost:3000` (not a different port)
3. Try refreshing the page

#### Issue: Error 500 from API
**Cause:** Firebase Storage not configured
**Solution:**
1. Check server console for Firebase errors
2. Verify `firebase-service-account.json` exists
3. Check `.env.local` has `FIREBASE_STORAGE_BUCKET`

#### Issue: Error 405 "Method not allowed"
**Cause:** Wrong HTTP method
**Solution:** This shouldn't happen - the code uses POST correctly

#### Issue: CORS error
**Cause:** Cross-origin request blocked
**Solution:** This shouldn't happen with Next.js API routes, but if it does:
- Check `next.config.js` for CORS settings
- Verify you're accessing from the same origin

## 🧪 Test the Upload Flow

1. **Open Browser Console** (F12)
2. **Go to Network tab**
3. **Try uploading a small image** (< 1MB)
4. **Watch for these requests:**
   - `POST /api/upload-url` - Should return 200 with JSON
   - `PUT https://storage.googleapis.com/...` - Should return 200

## 📋 What to Share if Still Failing

If it still doesn't work, share:
1. **Browser Console errors** (F12 → Console)
2. **Network tab details** (F12 → Network → click on failed request)
3. **Server console logs** (terminal where `npm run dev` runs)
4. **Exact error message** you see

## ✅ Quick Test

Try this in browser console (F12 → Console):
```javascript
fetch('/api/upload-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ filename: 'test.jpg', contentType: 'image/jpeg' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

This should return:
```json
{
  "uploadUrl": "https://storage.googleapis.com/...",
  "publicUrl": "https://storage.googleapis.com/...",
  "filePath": "uploads/images/..."
}
```

If this works, the API is fine and the issue is in the file upload process.

