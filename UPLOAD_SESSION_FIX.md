# Fix "Session Expired" / "Failed to Upload Images" (Firebase)

Uploads use **Firebase Storage** and **Firebase Auth** only (data is stored in Firebase, not Supabase).  
If you see "Session expired", "Invalid JWT Signature", or "Failed to upload" when uploading (portfolio or inspiration feed), the cause is **Firebase** (token or Storage config), not Supabase tables or code. Do the following.

## 1. Use the same Firebase project everywhere

- **Client (browser):** The config in `lib/config.js` or `.env` (e.g. `NEXT_PUBLIC_FIREBASE_*`) must be for **one** Firebase project.
- **Server (API):** The file `firebase-service-account.json` (or the path in `FIREBASE_SERVICE_ACCOUNT_PATH`) must be a **service account key from that same project**.

If the client uses Project A and the service account is from Project B, token verification will fail and you'll get session/JWT errors.

**What to do:** In [Firebase Console](https://console.firebase.google.com) → Project Settings → Service accounts → "Generate new private key". Save it as `firebase-service-account.json` in the **project root** (or set `FIREBASE_SERVICE_ACCOUNT_PATH` to its path).

## 2. Set Firebase Storage bucket

- In Firebase Console → Storage, copy the bucket name (e.g. `your-project-id.appspot.com`).
- Set it in `.env`:  
  `FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com`  
  or in `lib/config.js` as `storageBucket`.

Without this, the server cannot upload and may return "Upload service unavailable" or similar.

## 3. Sign out and sign in again

Expired or invalid tokens cause "Session expired" or "Invalid JWT Signature".

**What to do:** In the app, sign out completely, then sign in again. Then try uploading. The app will request a fresh Firebase ID token.

## 4. Check the service account file

- File must exist at the path the server uses (default: `./firebase-service-account.json` in project root).
- It must be valid JSON with keys like `project_id`, `private_key`, `client_email`.
- Do not commit this file to public repos; use env vars or a secure secret store in production.

## Summary checklist

- [ ] Client and server use the **same** Firebase project.
- [ ] `firebase-service-account.json` is in project root (or `FIREBASE_SERVICE_ACCOUNT_PATH` set).
- [ ] `FIREBASE_STORAGE_BUCKET` (or `storageBucket` in config) is set.
- [ ] User has signed out and signed in again before uploading.
- [ ] No firewall/proxy stripping the `Authorization` header on `/api/upload-file`.

After these, uploads are stored in **Firebase Storage** only (no Supabase fallback).
