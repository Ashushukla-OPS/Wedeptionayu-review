# Setup steps (expanded)

1. Create Supabase project and run `supabase_schema.sql`.
2. Create Clerk app, add frontend origin and redirect URLs.
3. Create Firebase project and Storage bucket. Get config.
4. Create Razorpay account and get key_id, key_secret.
5. Copy `.env.example` to `.env.local` and fill values.
6. `cd wedeption-full && npm install && npm run dev`

Important: This starter uses server-side API routes that require service keys: SUPABASE_SERVICE_ROLE_KEY, RAZORPAY_KEY_SECRET, FIREBASE service account or usage for uploads.

