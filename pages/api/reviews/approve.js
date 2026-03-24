import { supabase } from '../../../lib/supabase_server'
import { verifyFirebaseTokenFromHeader } from '../../../lib/firebase_server'

// Admin approves a review
export default async function handler(req,res){
  try {
    const userId = await verifyFirebaseTokenFromHeader(req)
    // In production check if userId is admin. For demo assume any verified admin uid set in env ADMIN_UIDS comma separated.
    const admins = (process.env.ADMIN_UIDS || '').split(',')
    if(!admins.includes(userId)) return res.status(403).json({ error: 'not admin' })
    const { review_id } = req.body
    await supabase.from('reviews').update({ approved: true }).eq('id', review_id)
    return res.json({ ok:true })
  } catch(e){
    return res.status(401).json({ error: e.message })
  }
}
