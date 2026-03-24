import { supabase } from '../../../lib/supabase_server'
import { verifyFirebaseTokenFromHeader } from '../../../lib/firebase_server'
export default async function handler(req,res){
  if(req.method !== 'POST') return res.status(405).end()
  try {
    const userId = await verifyFirebaseTokenFromHeader(req)
    const { lead_id, action, reply, amount_paid, payment_status, status: statusValue } = req.body
    // find vendor
    const { data: vendor } = await supabase.from('vendors').select('*').eq('user_id', userId).single()
    if(!vendor) return res.status(400).json({ error: 'vendor not found' })
    // ensure lead belongs to vendor
    const { data: lead } = await supabase.from('leads').select('*').eq('id', lead_id).single()
    if(!lead || lead.vendor_id !== vendor.id) return res.status(403).json({ error: 'not authorized' })
    const updates = {}
    if (action === 'accept' || action === 'in_progress') updates.status = 'in_progress'
    if (action === 'reject' || action === 'rejected') updates.status = 'rejected'
    if (action === 'booked') updates.status = 'booked'
    if (action === 'new') updates.status = 'new'
    if (['new', 'in_progress', 'booked', 'rejected'].includes(statusValue)) updates.status = statusValue
    if (action === 'shortlist') updates.shortlisted = true
    if (action === 'unshortlist') updates.shortlisted = false
    if (reply) updates.details = { ...(lead.details||{}), vendor_reply: reply }
    if (action === 'set_amount_paid' && typeof amount_paid === 'boolean') {
      updates.details = { ...(lead.details||{}), amount_paid }
    }
    if (action === 'set_payment_status' && ['none', '25', '50', 'full'].includes(payment_status)) {
      updates.details = { ...(lead.details||{}), payment_status }
    }
    await supabase.from('leads').update(updates).eq('id', lead_id)
    return res.json({ ok:true })
  } catch(e){
    return res.status(401).json({ error: e.message })
  }
}
