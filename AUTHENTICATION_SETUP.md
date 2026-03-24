# Complete Authentication Setup Guide

## ✅ What Has Been Fixed

### 1. Firebase ↔ Supabase Integration
- **`pages/api/sync-user.js`**: Completely rewritten to properly sync Firebase auth users to Supabase
  - Accepts both token-based and body-based requests
  - Properly extracts user data from Firebase
  - Creates/updates user in Supabase `users` table
  - Handles errors gracefully

### 2. Authentication Flow
- **Login Page** (`app/login/page.js`):
  - ✅ Google Sign-In with Supabase sync
  - ✅ Phone Sign-In with verification code
  - ✅ Name collection for phone auth
  - ✅ Automatic redirect after auth

- **Register Vendor** (`app/register-vendor/page.js`):
  - ✅ Two-step process: Auth → Vendor Details
  - ✅ Google and Phone authentication
  - ✅ Proper user sync to Supabase
  - ✅ Vendor registration form

### 3. Protected Routes
- **Vendor Dashboard** (`app/vendor/dashboard/page.js`):
  - ✅ Auth state checking
  - ✅ Automatic user sync
  - ✅ Redirect to login if not authenticated
  - ✅ Loading states

### 4. Auth Utilities
- **`lib/withAuthFirebase.js`**: Updated HOC for route protection
- **`lib/auth-utils.js`**: New utility functions for auth operations

### 5. API Endpoints
All API endpoints now properly:
- ✅ Use `verifyFirebaseTokenFromHeader` for authentication
- ✅ Handle errors gracefully
- ✅ Return proper status codes

### 6. Configuration
- **`lib/config.js`**: Contains all keys as fallbacks
- All lib files use environment variables with config fallbacks

## 🔐 Authentication Flow

### User Sign-In Process

1. **User clicks "Login" or "Become a Vendor"**
2. **Chooses authentication method:**
   - **Google**: One-click sign-in
   - **Phone**: Enter name + phone → Receive code → Verify

3. **After Authentication:**
   - Firebase creates/authenticates user
   - User data synced to Supabase `users` table
   - Token stored in browser
   - User redirected to appropriate page

### Data Flow

```
Firebase Auth → Get User Data → Sync to Supabase → Store in users table
     ↓
User ID (uid) becomes primary key in Supabase users table
     ↓
All vendor/lead data linked via user_id
```

## 📋 User Data Structure in Supabase

```sql
users table:
- id (text, primary key) = Firebase UID
- name (text)
- email (text)
- phone (text)
- profile_pic (text)
- role (text) = 'user' or 'vendor'
- created_at (timestamp)
```

## 🔄 Verification Code Flow

### Phone Authentication Steps:

1. User enters **Name** and **Phone Number**
2. System sends verification code via Firebase
3. User enters **6-digit code**
4. Code verified → User authenticated
5. User data synced to Supabase
6. Redirect to dashboard/home

### reCAPTCHA Setup:
- Uses invisible reCAPTCHA
- Automatically handled by Firebase
- Container created dynamically if needed

## 🛡️ Protected Routes

Routes that require authentication:
- `/vendor/dashboard` - Vendor dashboard
- `/register-vendor` (step 2) - Vendor registration form

### How Protection Works:

```javascript
// Using withAuthFirebase HOC
import withAuthFirebase from '@/lib/withAuthFirebase'

export default withAuthFirebase(MyComponent)
```

Or manually:
```javascript
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (!user) router.push('/login')
    else syncUserToSupabase()
  })
  return () => unsubscribe()
}, [])
```

## 🔌 API Authentication

All protected API endpoints use:

```javascript
import { verifyFirebaseTokenFromHeader } from '../../lib/firebase_server'

export default async function handler(req, res) {
  try {
    const userId = await verifyFirebaseTokenFromHeader(req)
    // userId is the Firebase UID
    // Use it to query Supabase: .eq('user_id', userId)
  } catch (e) {
    return res.status(401).json({ error: e.message })
  }
}
```

## 📝 Key Files

### Client-Side:
- `lib/firebase_client.js` - Firebase client config
- `lib/auth-utils.js` - Auth utility functions
- `lib/withAuthFirebase.js` - Route protection HOC
- `app/login/page.js` - Login page
- `app/register-vendor/page.js` - Vendor registration

### Server-Side:
- `lib/firebase_admin.js` - Firebase admin SDK
- `lib/firebase_server.js` - Server auth utilities
- `pages/api/sync-user.js` - User sync endpoint
- `pages/api/supabase-session.js` - Session verification

## ✅ Testing Checklist

- [ ] Google sign-in works
- [ ] Phone sign-in works (verification code received)
- [ ] Verification code works
- [ ] User data appears in Supabase `users` table
- [ ] Vendor dashboard requires auth
- [ ] API endpoints require auth tokens
- [ ] Logout works (if implemented)
- [ ] Auth state persists on page refresh

## 🐛 Common Issues & Fixes

### Issue: "User not syncing to Supabase"
**Fix**: Check that `pages/api/sync-user.js` is working and Firebase admin is initialized

### Issue: "Verification code not received"
**Fix**: 
- Check Firebase project has Phone Auth enabled
- Verify reCAPTCHA is set up
- Check phone number format (+91XXXXXXXXXX)

### Issue: "Token verification failing"
**Fix**: 
- Ensure `firebase-service-account.json` exists
- Check service account has proper permissions
- Verify environment variables are set

## 🚀 Next Steps

1. **Enable Phone Auth in Firebase Console:**
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable "Phone" provider
   - Add reCAPTCHA domains

2. **Test Authentication:**
   - Test Google sign-in
   - Test phone sign-in with real number
   - Verify data in Supabase

3. **Add Logout Functionality:**
   ```javascript
   import { signOut } from 'firebase/auth'
   import { auth } from '@/lib/firebase_client'
   
   await signOut(auth)
   ```

## 📚 Additional Resources

- Firebase Auth Docs: https://firebase.google.com/docs/auth
- Supabase Docs: https://supabase.com/docs
- Next.js Auth: https://nextjs.org/docs/authentication

