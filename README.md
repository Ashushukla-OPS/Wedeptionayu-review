# Wedeption - Full Starter (Expanded)

A premium wedding planning platform with luxury UI inspired by Wedmegood and Airbnb.

## 🚀 Quick Start

**⭐ NEW: [STEP_BY_STEP_SETUP.md](./STEP_BY_STEP_SETUP.md)** - Complete visual guide with exact steps and where to paste each credential

**For detailed backend setup, see [README_BACKEND_SETUP.md](./README_BACKEND_SETUP.md)**

**For a quick checklist, see [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)**

## 📦 Key Features

- **Premium UI/UX**: Luxury design inspired by Wedmegood and Airbnb
- **Vendor Management**: Complete vendor registration and management system
- **City & Category Filtering**: Filter vendors by 26 cities and 24 service categories
- **Reviews & Ratings**: Customer review system with admin moderation
- **Image Upload**: Firebase Storage integration for vendor portfolios
- **AI Wedding Planner**: AI-powered wedding planning recommendations
- **Vendor Comparison**: Side-by-side vendor comparison tool
- **Inspiration Feed**: Pinterest-style inspiration gallery
- **Lead Management**: Customer inquiry and lead tracking
- **Subscription System**: Razorpay integration for vendor subscriptions

## 🛠️ Tech Stack

- **Frontend**: Next.js 13 (App Router), React, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Firebase Auth (Phone + Google)
- **Storage**: Firebase Storage
- **Payments**: Razorpay (optional)

## 📋 Prerequisites

- Node.js v18+
- Supabase account
- Firebase account
- Razorpay account (optional)

## ⚡ Quick Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wedeption-app-router-v1-premium-ui-edited
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Create `.env.local` file
   - See [README_BACKEND_SETUP.md](./README_BACKEND_SETUP.md) for details

4. **Set up Supabase**
   - Create Supabase project
   - Run `supabase_schema.sql` in SQL Editor
   - Copy credentials to `.env.local`

5. **Set up Firebase**
   - Create Firebase project
   - Enable Phone & Google auth
   - Create Storage bucket
   - Download service account JSON
   - Copy credentials to `.env.local`

6. **Run development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see your application!

## 📚 Documentation

- **[README_BACKEND_SETUP.md](./README_BACKEND_SETUP.md)** - Complete backend setup guide
- **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** - Quick setup checklist
- **[README_SETUP.md](./README_SETUP.md)** - Original setup notes

## 🗄️ Database Schema

The application uses the following main tables:
- `users` - User accounts
- `vendors` - Vendor information
- `cities` - 26 pre-populated cities
- `categories` - 24 pre-populated service categories
- `reviews` - Customer reviews
- `leads` - Customer inquiries
- `vendor_portfolio` - Vendor images
- `subscriptions` - Vendor subscriptions

See `supabase_schema.sql` for complete schema.

## 🔌 API Endpoints

### Public
- `GET /api/vendors` - List vendors (with filters)
- `GET /api/cities` - List cities
- `GET /api/categories` - List categories
- `GET /api/feed` - Inspiration feed

### Protected
- `POST /api/leads` - Create lead
- `POST /api/reviews/submit` - Submit review
- `POST /api/register-vendor` - Register vendor

See [README_BACKEND_SETUP.md](./README_BACKEND_SETUP.md) for complete API documentation.

## 🎨 UI Features

- **Sticky Navigation**: Glassmorphism header with smooth scroll effects
- **Hero Section**: Large immersive banner with search functionality
- **Vendor Cards**: Image-first grid layout (Airbnb-style)
- **Masonry Grid**: Pinterest-style inspiration feed
- **Smooth Animations**: Framer Motion animations throughout
- **Responsive Design**: Mobile-first, fully responsive
- **Luxury Styling**: Premium color palette and typography

## 🔒 Security

- Row Level Security (RLS) policies in Supabase
- Firebase Authentication
- Service role keys kept server-side only
- Environment variables for sensitive data

## 📝 License

Private project - All rights reserved

---

**Need help?** Check [README_BACKEND_SETUP.md](./README_BACKEND_SETUP.md) for detailed setup instructions and troubleshooting.


Added modules:
- sync-user endpoint (Clerk -> Supabase upsert)
- upload-url endpoint for Firebase signed uploads
- Razorpay subscription create endpoint
- like RPC + API
- client demo pages for auth-sync and upload


UI/UX polish: combined Ultra-Modern Minimal + Elegant Wedding Theme applied. Design tokens in styles/design-tokens.css and new components in components/*.js


**Firebase Auth Migration**: This repo now uses Firebase Authentication (phone + Google). Configure Firebase service account and frontend keys in `.env.local`.


Vendor registration now collects extended business, professional, online presence, portfolio, business highlights, and identity verification fields. Admin can verify identity by providing identity document URL when approving vendor.


FEATURE UPDATE:
- Reviews: users can submit reviews only after they have a lead with the vendor in status 'in_progress' or 'booked'. Reviews are approved by admin before public.
- Availability Calendar: vendors can set monthly availability/booked dates via /vendor/calendar (protected).
- Vendor Comparison: public page /compare allows selecting up to 3 vendors (stored in localStorage) and comparing core fields without login.


Added Features:
- Reviews system (users can review only after creating a lead with vendor). Admin moderation required.
- Monthly vendor availability calendar (vendor can mark days as available/booked/partial).
- Public vendor comparison page using vendor_summary view.
