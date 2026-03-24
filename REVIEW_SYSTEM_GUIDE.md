# Review System - Complete Guide

This document explains how the review system works in the Wedeption platform.

---

## 📋 Overview

The review system allows customers to rate and review vendors, but with important restrictions:
- ✅ Users can only review vendors they have contacted (created a lead)
- ✅ All reviews require admin approval before being displayed
- ✅ Reviews are linked to verified bookings/interactions
- ✅ Prevents fake or spam reviews

---

## 🗄️ Database Structure

### Reviews Table

```sql
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors(id),
  user_id text references users(id),
  rating int check (rating >= 1 and rating <= 5),
  review_text text,
  photos jsonb,
  verified_booking boolean default false,
  approved boolean default false,
  created_at timestamptz default now()
);
```

**Fields:**
- `id` - Unique review ID
- `vendor_id` - Which vendor is being reviewed
- `user_id` - Who wrote the review
- `rating` - Star rating (1-5)
- `review_text` - Review comment/text
- `photos` - Optional photos (JSON array)
- `verified_booking` - Whether user actually booked/contacted vendor
- `approved` - Whether admin has approved the review (default: false)
- `created_at` - When review was submitted

---

## 🔄 Review Flow

### Step 1: User Contacts Vendor (Creates Lead)

Before a user can review, they must:
1. View a vendor profile
2. Contact the vendor (creates a "lead" in the system)
3. The lead status can be: `new`, `in_progress`, or `booked`

**Lead Creation:**
- When user clicks "Contact" or "Enquire" on a vendor
- A record is created in the `leads` table
- This establishes the relationship between user and vendor

### Step 2: Check if User Can Review

**API Endpoint:** `GET /api/reviews/can-review?vendor_id={vendor_id}`

**How it works:**
```javascript
// Checks if user has any lead with this vendor
const { data } = await supabase
  .from('leads')
  .select('*')
  .eq('vendor_id', vendor_id)
  .eq('user_id', userId)
  .limit(1)

return { canReview: (data && data.length > 0) }
```

**Response:**
- `{ canReview: true }` - User can review (has a lead)
- `{ canReview: false }` - User cannot review (no lead exists)

### Step 3: User Submits Review

**API Endpoint:** `POST /api/reviews/submit`

**Request Body:**
```json
{
  "vendor_id": "uuid-of-vendor",
  "rating": 5,
  "comment": "Great service!",
  "photos": ["url1", "url2"] // optional
}
```

**Validation:**
1. ✅ User must be authenticated (Firebase token required)
2. ✅ User must have a lead with this vendor
3. ✅ Rating must be between 1-5
4. ✅ Review is saved with `approved: false`

**Code Flow:**
```javascript
// 1. Verify user authentication
const userId = await verifyFirebaseTokenFromHeader(req)

// 2. Check if user has a lead with this vendor
const { data: lead } = await supabase
  .from('leads')
  .select('*')
  .eq('vendor_id', vendor_id)
  .eq('user_id', userId)
  .limit(1)
  .single()

// 3. If no lead, reject review
if (!lead) {
  return res.status(403).json({ 
    error: 'You can review only after contacting/vendor interaction' 
  })
}

// 4. Create review (unapproved)
const { data, error } = await supabase
  .from('reviews')
  .insert([{
    vendor_id,
    user_id: userId,
    rating,
    comment,
    photos,
    approved: false  // ⚠️ Requires admin approval
  }])
  .select()
  .single()
```

**Response:**
```json
{
  "ok": true,
  "review": {
    "id": "review-uuid",
    "vendor_id": "vendor-uuid",
    "user_id": "user-id",
    "rating": 5,
    "review_text": "Great service!",
    "approved": false,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Step 4: Admin Reviews & Approves

**API Endpoint:** `POST /api/reviews/approve`

**Request Body:**
```json
{
  "review_id": "uuid-of-review"
}
```

**Admin Check:**
- Admin user ID must be in `ADMIN_UIDS` environment variable
- Format: `ADMIN_UIDS=user1,user2,user3`

**Code Flow:**
```javascript
// 1. Verify admin
const userId = await verifyFirebaseTokenFromHeader(req)
const admins = (process.env.ADMIN_UIDS || '').split(',')
if (!admins.includes(userId)) {
  return res.status(403).json({ error: 'not admin' })
}

// 2. Approve review
await supabase
  .from('reviews')
  .update({ approved: true })
  .eq('id', review_id)
```

**Alternative Endpoint:** `GET /api/admin/approve-review?review_id={review_id}`
- Simpler version without admin check (for development)

### Step 5: Display Approved Reviews

**API Endpoint:** `GET /api/reviews/list?vendor_id={vendor_id}`

**How it works:**
```javascript
// Only fetch approved reviews
const { data } = await supabase
  .from('reviews')
  .select('*, users:users(id, name)')
  .eq('vendor_id', vendor_id)
  .eq('approved', true)  // ⚠️ Only approved reviews
  .order('created_at', { ascending: false })
```

**Response:**
```json
{
  "reviews": [
    {
      "id": "review-uuid",
      "vendor_id": "vendor-uuid",
      "user_id": "user-id",
      "rating": 5,
      "review_text": "Great service!",
      "photos": null,
      "approved": true,
      "created_at": "2024-01-15T10:30:00Z",
      "users": {
        "id": "user-id",
        "name": "John Doe"
      }
    }
  ]
}
```

---

## 🎯 Key Features

### 1. Lead-Based Review System

**Why?**
- Prevents fake reviews
- Ensures only real customers can review
- Builds trust in the platform

**How it works:**
- User must create a "lead" (inquiry) with vendor first
- Lead can be in status: `new`, `in_progress`, or `booked`
- Only then can user submit a review

### 2. Admin Moderation

**Why?**
- Prevents spam and inappropriate content
- Ensures quality reviews
- Protects vendors from fake negative reviews

**How it works:**
- All reviews start with `approved: false`
- Admin reviews each submission
- Only approved reviews are displayed publicly

### 3. Rating Calculation

**How ratings are calculated:**
```javascript
// Fetch all approved reviews for a vendor
const { data: reviews } = await supabase
  .from('reviews')
  .select('rating')
  .eq('vendor_id', vendor.id)
  .eq('approved', true)

// Calculate average
const review_count = reviews?.length || 0
const avg_rating = review_count > 0
  ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / review_count
  : null
```

**Display:**
- Average rating shown on vendor cards
- Review count displayed
- Individual reviews shown on vendor detail page

---

## 📡 API Endpoints Summary

### Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reviews/list` | GET | Get approved reviews for a vendor |
| `/api/reviews/can-review` | GET | Check if user can review (requires auth) |

### Protected Endpoints (Requires Authentication)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reviews/submit` | POST | Submit a new review |
| `/api/reviews/approve` | POST | Approve a review (admin only) |

### Admin Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/review-queue` | GET | Get pending reviews for approval |
| `/api/admin/approve-review` | GET | Approve a review (simpler version) |
| `/api/admin/reviews` | GET | Get all reviews (admin view) |

---

## 💻 Frontend Implementation

### ReviewsSection Component

Located in: `components/ReviewsSection.js`

**Features:**
- Displays approved reviews
- Shows review form if user can review
- Handles review submission

**Usage:**
```jsx
<ReviewsSection 
  vendorId={vendor.id} 
  userId={currentUser.id} 
  token={firebaseToken} 
/>
```

**What it does:**
1. Fetches approved reviews for the vendor
2. Checks if current user can review
3. Shows review form if user has a lead
4. Submits review on form submission

---

## 🔐 Security & Validation

### Authentication Required
- All review submissions require Firebase authentication
- User ID is extracted from Firebase token
- Prevents anonymous reviews

### Lead Verification
- System checks for existing lead before allowing review
- Prevents users from reviewing vendors they haven't contacted
- Ensures review authenticity

### Admin Protection
- Only users in `ADMIN_UIDS` can approve reviews
- Admin check happens server-side
- Prevents unauthorized approvals

### Data Validation
- Rating must be 1-5 (enforced by database constraint)
- Review text is optional but recommended
- Photos are optional (stored as JSON array)

---

## 📊 Review Statistics

### How Ratings Are Used

1. **Vendor Cards**
   - Average rating displayed (e.g., "4.8 ⭐")
   - Review count shown (e.g., "(124 reviews)")

2. **Vendor Detail Page**
   - Full review list
   - Average rating prominently displayed
   - Individual reviews with user names

3. **Sorting & Filtering**
   - Vendors can be sorted by rating
   - Higher-rated vendors appear first

---

## 🛠️ Admin Workflow

### Step 1: View Pending Reviews

**Endpoint:** `GET /api/admin/review-queue`

Returns all reviews where `approved = false`

### Step 2: Review Content

Admin should check:
- ✅ Is the review appropriate?
- ✅ Does the user have a valid lead?
- ✅ Is the rating reasonable?
- ✅ Are photos appropriate (if any)?

### Step 3: Approve or Reject

**Approve:**
```javascript
POST /api/reviews/approve
{
  "review_id": "review-uuid"
}
```

**Reject:**
- Currently, rejected reviews remain in database with `approved: false`
- They are simply not displayed
- Future: Could add `rejected: true` flag

---

## 🔄 Complete Review Lifecycle

```
1. User views vendor profile
   ↓
2. User contacts vendor (creates lead)
   ↓
3. User checks if they can review
   GET /api/reviews/can-review
   ↓
4. User submits review
   POST /api/reviews/submit
   ↓
5. Review saved with approved: false
   ↓
6. Admin views pending reviews
   GET /api/admin/review-queue
   ↓
7. Admin approves review
   POST /api/reviews/approve
   ↓
8. Review appears publicly
   GET /api/reviews/list (now includes this review)
   ↓
9. Rating recalculated for vendor
```

---

## 🐛 Troubleshooting

### Issue: "You can review only after contacting/vendor interaction"

**Cause:** User hasn't created a lead with this vendor

**Solution:**
1. User must first contact the vendor
2. This creates a lead in the `leads` table
3. Then user can submit review

### Issue: Review not showing after submission

**Cause:** Review is pending admin approval

**Solution:**
1. Check admin panel for pending reviews
2. Admin needs to approve the review
3. Once approved, it will appear publicly

### Issue: Cannot approve review (403 error)

**Cause:** User ID not in `ADMIN_UIDS`

**Solution:**
1. Add user ID to `.env.local`:
   ```
   ADMIN_UIDS=your-user-id,another-admin-id
   ```
2. Restart server
3. Try approving again

### Issue: Reviews not loading

**Cause:** RLS policies blocking access

**Solution:**
1. Check Supabase RLS policies
2. Ensure public can read approved reviews:
   ```sql
   CREATE POLICY "Approved reviews are viewable by everyone" 
   ON reviews FOR SELECT 
   USING (approved = true);
   ```

---

## 📝 Example Usage

### Submitting a Review (Frontend)

```javascript
// 1. Check if user can review
const canReviewRes = await fetch(
  `/api/reviews/can-review?vendor_id=${vendorId}`,
  {
    headers: {
      Authorization: `Bearer ${firebaseToken}`
    }
  }
)
const { canReview } = await canReviewRes.json()

if (!canReview) {
  alert('You must contact this vendor first before reviewing')
  return
}

// 2. Submit review
const submitRes = await fetch('/api/reviews/submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${firebaseToken}`
  },
  body: JSON.stringify({
    vendor_id: vendorId,
    rating: 5,
    comment: 'Excellent service! Highly recommended.',
    photos: [] // optional
  })
})

const data = await submitRes.json()
if (data.ok) {
  alert('Review submitted! Waiting for admin approval.')
}
```

### Displaying Reviews (Frontend)

```javascript
// Fetch approved reviews
const reviewsRes = await fetch(
  `/api/reviews/list?vendor_id=${vendorId}`
)
const { reviews } = await reviewsRes.json()

// Display reviews
reviews.forEach(review => {
  console.log(`${review.users.name}: ${review.rating} stars`)
  console.log(review.review_text)
})
```

---

## 🎯 Best Practices

1. **Always verify lead exists** before allowing review submission
2. **Moderate all reviews** before making them public
3. **Calculate ratings** from approved reviews only
4. **Store review photos** in Firebase Storage, not database
5. **Rate limit** review submissions (prevent spam)
6. **Allow users to edit** their own reviews (future feature)
7. **Show review helpfulness** votes (future feature)

---

## 🔮 Future Enhancements

Potential improvements:
- [ ] Allow users to edit their reviews
- [ ] Add "Helpful" voting on reviews
- [ ] Reply feature for vendors
- [ ] Review photos upload
- [ ] Review filtering (by rating, date)
- [ ] Review reporting system
- [ ] Automated spam detection
- [ ] Review analytics dashboard

---

## 📚 Related Files

- **Database Schema:** `supabase_schema.sql` (lines 103-114)
- **Submit Review:** `pages/api/reviews/submit.js`
- **List Reviews:** `pages/api/reviews/list.js`
- **Can Review:** `pages/api/reviews/can-review.js`
- **Approve Review:** `pages/api/reviews/approve.js`
- **Review Queue:** `pages/api/admin/review-queue.js`
- **Component:** `components/ReviewsSection.js`

---

**Need Help?**
- Check the troubleshooting section above
- Review the API endpoints
- Verify database schema is correct
- Check RLS policies in Supabase

