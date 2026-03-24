import { supabase } from '../../lib/supabase_server'
import { normalizeIndianPhone } from '../../lib/phone-utils'

export default async function handler(req,res){
  if(req.method !== 'POST') return res.status(405).end()
  const { vendor_id, name, contact_phone, event_date, budget, details, user_id, email, lead_type, from_post } = req.body
  
  const allowedTypes = ['contact_view', 'availability_check', 'message', 'inquiry', 'profile_view']
  const type = allowedTypes.includes(lead_type) ? lead_type : 'inquiry'
  const isProfileView = type === 'profile_view'
  const isAvailabilityCheck = type === 'availability_check'
  // profile_view: no auth or contact required — count every view (logged in or not)
  // availability_check: no OTP; only event_date required (name/phone optional for dashboard)

  if (!vendor_id) return res.status(400).json({ error: 'Missing required field: vendor_id' })
  const normalizedVendorId = String(vendor_id).trim()
  if (!normalizedVendorId) return res.status(400).json({ error: 'Invalid vendor_id' })

  // UUID format required for profile_views.vendor_id (references vendors.id)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const isValidUuid = uuidRegex.test(normalizedVendorId)

  // Profile views go to profile_views table only (separate from leads)
  if (isProfileView) {
    if (!isValidUuid) {
      console.error('[leads] profile_view invalid vendor_id (not UUID):', normalizedVendorId)
      return res.status(400).json({ error: 'Invalid vendor_id: must be a valid UUID' })
    }
    const insertPayload = { vendor_id: normalizedVendorId }
    if (from_post && uuidRegex.test(String(from_post).trim())) {
      insertPayload.referrer_post_id = String(from_post).trim()
    }
    const { data: pv, error: pvError } = await supabase
      .from('profile_views')
      .insert([insertPayload])
      .select()
      .single()
    if (pvError) {
      console.error('[leads] profile_view insert failed:', { vendor_id: normalizedVendorId, error: pvError.message, code: pvError.code })
      return res.status(500).json({ error: pvError.message })
    }
    return res.json({ ok: true, lead: pv })
  }

  // availability_check: only vendor_id + event_date required (no OTP, name/phone optional)
  if (isAvailabilityCheck && !event_date) {
    return res.status(400).json({ error: 'Missing required field: event_date for availability check' })
  }
  if (!isAvailabilityCheck && (!name || !contact_phone)) {
    return res.status(400).json({ error: 'Missing required fields: name, contact_phone' })
  }

  const normalizedPhone = contact_phone ? normalizeIndianPhone(contact_phone) : null
  if (!isAvailabilityCheck && !normalizedPhone) {
    return res.status(400).json({ error: 'Invalid phone number format' })
  }

  let finalUserId = user_id
  const leadName = name || (isAvailabilityCheck ? 'Guest' : null)
  const leadPhone = normalizedPhone || (isAvailabilityCheck ? null : null)
  if (leadName && leadPhone) {
    // Generate a user ID from phone if no user_id provided
    if (!finalUserId) {
      finalUserId = `user_${leadPhone.replace(/[^0-9]/g, '')}`
    }
    // Upsert user to users table (lead-only: not logged in, role = 'lead')
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: finalUserId,
        name: leadName,
        phone: leadPhone,
        email: email || null,
        role: 'lead'
      }, { onConflict: 'id' })

    if (userError) {
      console.error('Error syncing user:', userError)
    }
  }

  const detailsObj = typeof details === 'object' ? details : {}
  const leadData = {
    vendor_id: normalizedVendorId,
    name: leadName || null,
    contact_phone: leadPhone || null,
    event_date: event_date || null,
    budget_range: budget || null,
    details: { ...detailsObj, lead_type: type },
    lead_type: type
  }
  if (finalUserId) {
    leadData.user_id = finalUserId
  }
  try {
    const { data: insertData, error: insertError } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single()
    if (insertError) throw insertError
    return res.json({ ok: true, lead: insertData })
  } catch (firstErr) {
    if (firstErr?.message && firstErr.message.includes('lead_type')) {
      const { lead_type: _t, ...leadDataNoType } = leadData
      const { data: insertData, error: insertError } = await supabase
        .from('leads')
        .insert([leadDataNoType])
        .select()
        .single()
      if (insertError) return res.status(500).json({ error: insertError.message })
      return res.json({ ok: true, lead: insertData })
    }
    return res.status(500).json({ error: firstErr?.message || 'Insert failed' })
  }
}
