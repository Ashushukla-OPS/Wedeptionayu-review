# Chat System & Lead Generation - Complete Guide

This document explains how the chat system and lead generation work in the Wedeption platform.

---

## 📋 Overview

The platform uses a **lead-based communication system** where:
- Users contact vendors by creating "leads" (inquiries)
- Leads serve as the foundation for communication
- Vendors can view and manage leads through a chat-like interface
- Leads can be accepted, rejected, or moved to different statuses

---

## 🗄️ Database Structure

### Leads Table

```sql
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors(id),
  user_id text references users(id),
  contact_phone text,
  name text,
  event_date date,
  budget_range text,
  details jsonb,
  status text default 'new',
  created_at timestamptz default now()
);
```

**Fields:**
- `id` - Unique lead ID
- `vendor_id` - Which vendor received the lead
- `user_id` - Who created the lead (customer)
- `contact_phone` - Customer's phone number
- `name` - Customer's name
- `event_date` - Wedding/event date
- `budget_range` - Customer's budget
- `details` - Additional information (JSON object)
- `status` - Lead status: `new`, `in_progress`, `booked`, `rejected`
- `created_at` - When lead was created

---

## 🔄 Lead Generation Flow

### Step 1: User Views Vendor Profile

User browses vendors and finds one they're interested in.

### Step 2: User Creates Lead (Inquiry)

**API Endpoint:** `POST /api/leads`

**Request Body:**
```json
{
  "vendor_id": "uuid-of-vendor",
  "name": "John Doe",
  "contact_phone": "+919876543210",
  "event_date": "2024-12-15",
  "budget": "5,00,000",
  "details": {
    "guests": 300,
    "venue": "Hotel ABC",
    "notes": "Looking for decorator for wedding"
  }
}
```

**How it works:**
```javascript
// Create lead in database
const { data, error } = await supabase
  .from('leads')
  .insert([{
    vendor_id,
    user_id: currentUser.id,  // From Firebase auth
    name,
    contact_phone,
    event_date,
    budget_range: budget,
    details,
    status: 'new'  // Default status
  }])
  .select()
  .single()

// In production: Notify vendor via email/push notification
// return res.json({ ok: true, lead: data })
```

**Response:**
```json
{
  "ok": true,
  "lead": {
    "id": "lead-uuid",
    "vendor_id": "vendor-uuid",
    "user_id": "user-id",
    "name": "John Doe",
    "contact_phone": "+919876543210",
    "event_date": "2024-12-15",
    "budget_range": "5,00,000",
    "status": "new",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Step 3: Lead Appears in Vendor Dashboard

Vendor can see the lead in their dashboard/chats section.

---

## 💬 Chat System

### How It Works

The chat system is **lead-based**, meaning:
- Each "chat" is actually a lead
- Vendors see leads as chat conversations
- Communication happens through lead details and status updates

### Vendor Chat View

**API Endpoint:** `GET /api/vendor/chats`

**How it works:**
```javascript
// 1. Verify vendor authentication
const userId = await verifyFirebaseTokenFromHeader(req)

// 2. Get vendor record
const { data: vendor } = await supabase
  .from('vendors')
  .select('*')
  .eq('user_id', userId)
  .single()

if (!vendor) return res.json({ chats: [] })

// 3. Fetch all leads for this vendor (these are the "chats")
const { data: leads } = await supabase
  .from('leads')
  .select('*')
  .eq('vendor_id', vendor.id)
  .order('created_at', { ascending: false })

// 4. Convert leads to chat format
const chats = leads.map(lead => ({
  id: lead.id,
  user_name: lead.name,
  contact_phone: lead.contact_phone,
  last_message: lead.details ? JSON.stringify(lead.details) : null,
  status: lead.status,
  event_date: lead.event_date,
  budget_range: lead.budget_range,
  created_at: lead.created_at
}))

return res.json({ chats })
```

**Response:**
```json
{
  "chats": [
    {
      "id": "lead-uuid-1",
      "user_name": "John Doe",
      "contact_phone": "+919876543210",
      "last_message": "{\"notes\":\"Looking for decorator\"}",
      "status": "new",
      "event_date": "2024-12-15",
      "budget_range": "5,00,000",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "lead-uuid-2",
      "user_name": "Jane Smith",
      "contact_phone": "+919876543211",
      "last_message": "{\"guests\":200}",
      "status": "in_progress",
      "event_date": "2024-11-20",
      "budget_range": "3,00,000",
      "created_at": "2024-01-14T09:20:00Z"
    }
  ]
}
```

### Lead Status Management

**API Endpoint:** `POST /api/vendor/lead-action`

Vendors can update lead status and add replies.

**Request Body:**
```json
{
  "lead_id": "lead-uuid",
  "action": "accept",  // or "reject"
  "reply": "Thank you for your inquiry. We'd love to help with your wedding!"
}
```

**How it works:**
```javascript
// 1. Verify vendor authentication
const userId = await verifyFirebaseTokenFromHeader(req)
const { lead_id, action, reply } = req.body

// 2. Get vendor record
const { data: vendor } = await supabase
  .from('vendors')
  .select('*')
  .eq('user_id', userId)
  .single()

if (!vendor) return res.status(400).json({ error: 'vendor not found' })

// 3. Verify lead belongs to this vendor
const { data: lead } = await supabase
  .from('leads')
  .select('*')
  .eq('id', lead_id)
  .single()

if (!lead || lead.vendor_id !== vendor.id) {
  return res.status(403).json({ error: 'not authorized' })
}

// 4. Update lead based on action
const updates = {}
if (action === 'accept') {
  updates.status = 'in_progress'
}
if (action === 'reject') {
  updates.status = 'rejected'
}
if (reply) {
  // Add vendor reply to details
  updates.details = {
    ...(lead.details || {}),
    vendor_reply: reply
  }
}

// 5. Save updates
await supabase
  .from('leads')
  .update(updates)
  .eq('id', lead_id)

return res.json({ ok: true })
```

**Lead Status Values:**
- `new` - Just received, not yet reviewed
- `in_progress` - Vendor accepted, working on it
- `booked` - Customer confirmed booking
- `rejected` - Vendor rejected the lead

---

## 🔄 Complete Lead Lifecycle

```
1. User views vendor profile
   ↓
2. User clicks "Contact" or "Enquire"
   ↓
3. User fills inquiry form:
   - Name
   - Phone number
   - Event date
   - Budget
   - Additional details
   ↓
4. Lead created (POST /api/leads)
   - Status: "new"
   - Saved to database
   - Vendor notified (in production)
   ↓
5. Vendor views lead in dashboard
   GET /api/vendor/chats
   ↓
6. Vendor reviews lead details
   ↓
7. Vendor takes action:
   - Accept → Status: "in_progress"
   - Reject → Status: "rejected"
   - Add reply → Stored in details.vendor_reply
   ↓
8. Customer can now review vendor
   (Because lead exists)
   ↓
9. If booking confirmed:
   - Status: "booked"
   - Customer can leave review
```

---

## 📡 API Endpoints Summary

### Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/leads` | POST | Create a new lead (inquiry) |

### Vendor Endpoints (Requires Authentication)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/vendor/chats` | GET | Get all leads (chats) for vendor |
| `/api/vendor/lead-action` | POST | Update lead status or add reply |
| `/api/vendor/me` | GET | Get vendor dashboard data (includes leads) |

---

## 💻 Frontend Implementation

### Creating a Lead (User Side)

```javascript
// When user clicks "Contact Vendor"
const createLead = async (vendorId) => {
  const response = await fetch('/api/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      vendor_id: vendorId,
      name: formData.name,
      contact_phone: formData.phone,
      event_date: formData.eventDate,
      budget: formData.budget,
      details: {
        guests: formData.guests,
        venue: formData.venue,
        notes: formData.notes
      }
    })
  })
  
  const data = await response.json()
  if (data.ok) {
    alert('Inquiry sent! Vendor will contact you soon.')
  }
}
```

### Viewing Chats (Vendor Side)

```javascript
// Fetch vendor's chats (leads)
const fetchChats = async () => {
  const response = await fetch('/api/vendor/chats', {
    headers: {
      Authorization: `Bearer ${firebaseToken}`
    }
  })
  
  const { chats } = await response.json()
  // Display chats in UI
  setChats(chats)
}
```

### Updating Lead Status (Vendor Side)

```javascript
// Accept a lead
const acceptLead = async (leadId, reply) => {
  const response = await fetch('/api/vendor/lead-action', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${firebaseToken}`
    },
    body: JSON.stringify({
      lead_id: leadId,
      action: 'accept',
      reply: reply
    })
  })
  
  const data = await response.json()
  if (data.ok) {
    alert('Lead accepted!')
    // Refresh chats
    fetchChats()
  }
}

// Reject a lead
const rejectLead = async (leadId) => {
  const response = await fetch('/api/vendor/lead-action', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${firebaseToken}`
    },
    body: JSON.stringify({
      lead_id: leadId,
      action: 'reject'
    })
  })
}
```

---

## 🔐 Security & Validation

### Authentication
- Lead creation: No authentication required (public)
- Chat viewing: Vendor authentication required
- Lead actions: Vendor authentication required

### Authorization
- Vendors can only see their own leads
- Vendors can only update their own leads
- System verifies `vendor_id` matches authenticated vendor

### Data Validation
- `vendor_id` must exist in vendors table
- `event_date` should be a valid date
- `contact_phone` should be valid format
- `status` must be one of: `new`, `in_progress`, `booked`, `rejected`

---

## 🔗 Connection to Review System

**Important:** Leads are required for reviews!

1. **User creates lead** → Establishes relationship with vendor
2. **Lead exists** → User can now submit review
3. **Review system checks** → `GET /api/reviews/can-review` checks for lead
4. **If lead exists** → User can review
5. **If no lead** → Review rejected

**Code Connection:**
```javascript
// In review submission
const { data: lead } = await supabase
  .from('leads')
  .select('*')
  .eq('vendor_id', vendor_id)
  .eq('user_id', userId)
  .limit(1)
  .single()

if (!lead) {
  return res.status(403).json({ 
    error: 'You can review only after contacting/vendor interaction' 
  })
}
```

---

## 📊 Lead Statistics

### Vendor Dashboard

Vendors can see:
- Total leads received
- Leads by status (new, in_progress, booked, rejected)
- Recent leads
- Lead conversion rate

**API Endpoint:** `GET /api/vendor/analytics`

### Lead Status Breakdown

- **New Leads** - Need vendor attention
- **In Progress** - Vendor accepted, working on it
- **Booked** - Confirmed bookings
- **Rejected** - Vendor declined

---

## 🛠️ Advanced Features

### Lead Notifications (Future)

Currently, leads are created but vendors aren't notified. In production:

```javascript
// After creating lead
// 1. Send email notification
await sendEmail({
  to: vendor.email,
  subject: 'New Lead Received',
  body: `You have a new inquiry from ${name}`
})

// 2. Send push notification (FCM)
await sendPushNotification({
  token: vendor.fcm_token,
  title: 'New Lead',
  body: `${name} is interested in your services`
})
```

### Real-time Chat (Future)

Currently, communication is through lead details. Future enhancement:

- Use Firebase Realtime Database or Supabase Realtime
- Create separate `messages` table
- Enable real-time messaging between user and vendor

### Lead Filtering

Vendors can filter leads by:
- Status (new, in_progress, booked, rejected)
- Date range
- Budget range
- Event date

---

## 🐛 Troubleshooting

### Issue: Lead not appearing in vendor dashboard

**Causes:**
1. Vendor not authenticated
2. Lead `vendor_id` doesn't match vendor
3. RLS policies blocking access

**Solution:**
1. Verify vendor is logged in
2. Check `vendor_id` in lead matches vendor's ID
3. Check Supabase RLS policies

### Issue: Cannot create lead

**Causes:**
1. Invalid `vendor_id`
2. Missing required fields
3. Database connection issue

**Solution:**
1. Verify vendor exists
2. Check all required fields are provided
3. Check Supabase connection

### Issue: Cannot update lead status

**Causes:**
1. Not authenticated as vendor
2. Lead doesn't belong to vendor
3. Invalid action value

**Solution:**
1. Verify Firebase token
2. Check lead `vendor_id` matches vendor
3. Use valid action: `accept` or `reject`

---

## 📝 Example Usage

### Complete Lead Creation Flow

```javascript
// 1. User views vendor
const vendor = { id: 'vendor-uuid', business_name: 'Royal Decor' }

// 2. User clicks "Contact Vendor"
// Opens inquiry form

// 3. User submits form
const formData = {
  name: 'John Doe',
  phone: '+919876543210',
  eventDate: '2024-12-15',
  budget: '5,00,000',
  guests: 300,
  notes: 'Looking for wedding decor'
}

// 4. Create lead
const response = await fetch('/api/leads', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    vendor_id: vendor.id,
    name: formData.name,
    contact_phone: formData.phone,
    event_date: formData.eventDate,
    budget: formData.budget,
    details: {
      guests: formData.guests,
      notes: formData.notes
    }
  })
})

const { ok, lead } = await response.json()
if (ok) {
  console.log('Lead created:', lead.id)
  // Show success message
}
```

### Vendor Managing Leads

```javascript
// 1. Vendor logs in
const vendorToken = await getFirebaseToken()

// 2. Fetch all leads (chats)
const chatsRes = await fetch('/api/vendor/chats', {
  headers: { Authorization: `Bearer ${vendorToken}` }
})
const { chats } = await chatsRes.json()

// 3. Display leads
chats.forEach(chat => {
  console.log(`${chat.user_name} - ${chat.status}`)
  console.log(`Event: ${chat.event_date}`)
  console.log(`Budget: ${chat.budget_range}`)
})

// 4. Accept a lead
const acceptRes = await fetch('/api/vendor/lead-action', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${vendorToken}`
  },
  body: JSON.stringify({
    lead_id: chats[0].id,
    action: 'accept',
    reply: 'Thank you! We\'d love to help with your wedding.'
  })
})

const { ok } = await acceptRes.json()
if (ok) {
  console.log('Lead accepted!')
}
```

---

## 🎯 Best Practices

1. **Always validate vendor_id** before creating lead
2. **Require authentication** for vendor actions
3. **Notify vendors** when new leads arrive (production)
4. **Track lead sources** (which page, search term, etc.)
5. **Set lead expiration** (auto-reject after X days)
6. **Enable lead follow-up** reminders
7. **Track conversion rates** (leads → bookings)
8. **Allow lead notes** for vendor internal use

---

## 🔮 Future Enhancements

Potential improvements:
- [ ] Real-time messaging system
- [ ] Lead notifications (email/push)
- [ ] Lead analytics dashboard
- [ ] Lead templates for common inquiries
- [ ] Automated follow-up emails
- [ ] Lead scoring system
- [ ] Integration with calendar
- [ ] Lead export functionality
- [ ] Bulk lead actions
- [ ] Lead assignment to team members

---

## 📚 Related Files

- **Database Schema:** `supabase_schema.sql` (lines 42-53)
- **Create Lead:** `pages/api/leads.js`
- **Vendor Chats:** `pages/api/vendor/chats.js`
- **Lead Actions:** `pages/api/vendor/lead-action.js`
- **Vendor Dashboard:** `pages/api/vendor/me.js`
- **Review Check:** `pages/api/reviews/can-review.js` (uses leads)

---

## 🔄 Relationship Diagram

```
User
  ↓ (creates)
Lead
  ↓ (belongs to)
Vendor
  ↓ (manages)
Lead Status Updates
  ↓ (enables)
Review Submission
```

**Key Points:**
- Lead connects User and Vendor
- Lead status tracks progress
- Lead existence enables reviews
- Chat system uses leads as conversations

---

**Need Help?**
- Check the troubleshooting section above
- Review the API endpoints
- Verify database schema is correct
- Check RLS policies in Supabase

