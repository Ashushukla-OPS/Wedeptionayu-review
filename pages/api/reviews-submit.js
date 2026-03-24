
import { supabase } from '../../lib/supabase_server'
import { verifyFirebaseTokenFromHeader } from '../../lib/firebase_server'

export default async function handler(req,res){
  if(req.method !== 'POST') return res.status(405).end()
  try {
    const userId = await verifyFirebaseTokenFromHeader(req)
    const { vendor_id, rating, review_text, photos } = req.body
    // check if user has a qualifying lead for this vendor
    const { data: leads } = await supabase.from('leads').select('*').eq('vendor_id', vendor_id).eq('user_id', userId)
    const ok = (leads || []).some(l => ['in_progress','booked'].includes(l.status))
    if(!ok) return res.status(403).json({ error: 'You can only review after contacting/booked this vendor.' })
    const { data, error } = await supabase.from('reviews').insert([{ vendor_id, user_id: userId, rating, review_text, photos, verified_booking: true }]).select().single()
    if(error) return res.status(500).json({ error: error.message })
    return res.json({ ok:true, review: data })
  } catch(e){
    return res.status(401).json({ error: e.message })
  }
}
