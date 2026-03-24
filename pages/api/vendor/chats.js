import { supabase } from '../../../lib/supabase_server'
import { verifyFirebaseTokenFromHeader } from '../../../lib/firebase_server'

const periodToDate = (period) => {
  if (!period || period === 'lifetime') return null
  const now = new Date()
  switch (period) {
    case '7d': now.setDate(now.getDate() - 7); break
    case '30d': now.setDate(now.getDate() - 30); break
    case '6m': now.setMonth(now.getMonth() - 6); break
    case '1y': now.setFullYear(now.getFullYear() - 1); break
    default: return null
  }
  return now.toISOString()
}

export default async function handler(req, res) {
  try {
    const userId = await verifyFirebaseTokenFromHeader(req)
    const { data: vendor } = await supabase.from('vendors').select('*').eq('user_id', userId).single()
    if (!vendor) return res.json({ chats: [], leads: [] })

    const period = req.query.period || 'lifetime'
    const shortlistedOnly = req.query.shortlisted === 'true'

    let query = supabase
      .from('leads')
      .select('*')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })

    const since = periodToDate(period)
    if (since) query = query.gte('created_at', since)
    if (shortlistedOnly) query = query.eq('shortlisted', true)

    const { data: leads, error } = await query

    if (error) return res.status(500).json({ error: error.message })

    const getLeadType = (l) => (l.details && l.details.lead_type) || l.lead_type || 'inquiry'
    const isProfileView = (l) => getLeadType(l) === 'profile_view'
    const realLeads = (leads || []).filter(l => !isProfileView(l))
    // Full lead objects for CRM — profile views are separate (see Overview); only real leads here
    const leadList = realLeads.map((l) => ({
      id: l.id,
      name: l.name,
      user_name: l.name,
      contact_phone: l.contact_phone,
      email: l.details?.email || null,
      event_date: l.event_date,
      budget_range: l.budget_range,
      budget: l.budget_range,
      status: l.status || 'new',
      lead_type: getLeadType(l),
      shortlisted: !!l.shortlisted,
      details: l.details,
      last_message: l.details && JSON.stringify(l.details),
      created_at: l.created_at
    }))

    return res.json({ chats: leadList, leads: leadList })
  } catch (e) {
    return res.status(401).json({ error: e.message })
  }
}
