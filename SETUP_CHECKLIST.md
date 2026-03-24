# Quick Setup Checklist

Use this checklist to ensure you've completed all setup steps.

## ✅ Prerequisites
- [ ] Node.js v18+ installed
- [ ] npm/yarn installed
- [ ] Git installed

## ✅ Supabase Setup
- [ ] Created Supabase project
- [ ] Copied Project URL to `.env.local`
- [ ] Copied Anon Key to `.env.local`
- [ ] Copied Service Role Key to `.env.local`
- [ ] Ran `supabase_schema.sql` in SQL Editor
- [ ] Verified cities table has 26 cities
- [ ] Verified categories table has 24 categories
- [ ] Set up RLS policies (optional for dev)

## ✅ Firebase Setup
- [ ] Created Firebase project
- [ ] Enabled Phone authentication
- [ ] Enabled Google authentication
- [ ] Created Storage bucket
- [ ] Copied API Key to `.env.local`
- [ ] Copied Auth Domain to `.env.local`
- [ ] Copied Project ID to `.env.local`
- [ ] Copied Storage Bucket to `.env.local`
- [ ] Downloaded service account JSON
- [ ] Saved as `firebase-service-account.json` in root

## ✅ Razorpay Setup (Optional)
- [ ] Created Razorpay account
- [ ] Generated test API keys
- [ ] Copied Key ID to `.env.local`
- [ ] Copied Key Secret to `.env.local`
- [ ] Set up webhook (if using subscriptions)

## ✅ Project Setup
- [ ] Cloned/downloaded repository
- [ ] Created `.env.local` file
- [ ] Filled all environment variables
- [ ] Ran `npm install`
- [ ] Started dev server with `npm run dev`

## ✅ Verification
- [ ] Application loads at `http://localhost:3000`
- [ ] Home page displays correctly
- [ ] Cities dropdown works in Hero section
- [ ] Categories dropdown works in Hero section
- [ ] Vendors page loads (may be empty initially)
- [ ] No console errors in browser
- [ ] No errors in terminal

## 🎉 Ready to Go!
Once all items are checked, you're ready to start developing!

