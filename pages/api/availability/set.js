import { supabase } from '../../../lib/supabase_server'
import { verifyFirebaseTokenFromHeader } from '../../../lib/firebase_server'
export default async function handler(req,res){
  if(req.method !== 'POST') return res.status(405).end()
  try {
    const userId = await verifyFirebaseTokenFromHeader(req)
    const { vendor_id, date, status, note, notes } = req.body
    // ensure vendor belongs to user
    const { data: vendor } = await supabase.from('vendors').select('*').eq('user_id', userId).single()
    if(!vendor || vendor.id !== vendor_id) return res.status(403).json({ error: 'not authorized' })
    // Use notes (from DB schema) or note (from frontend) - support both for compatibility
    const notesValue = notes || note || ''
    const { data, error } = await supabase.from('vendor_availability').upsert([{ vendor_id, date, status, notes: notesValue }], { onConflict: 'vendor_id,date' })
    if(error) return res.status(500).json({ error: error.message })
    return res.json({ ok:true })
  } catch(e){ return res.status(401).json({ error: e.message }) }
}
