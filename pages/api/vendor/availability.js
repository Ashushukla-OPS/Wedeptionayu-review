
import { supabase } from '../../../lib/supabase_server'
import { verifyFirebaseTokenFromHeader } from '../../../lib/firebase_server'

export default async function handler(req,res){
  if(req.method === 'GET'){
    const vendor_id = req.query.vendor_id
    const { data, error } = await supabase.from('vendor_availability').select('*').eq('vendor_id', vendor_id)
    if(error) return res.status(500).json({ error: error.message })
    return res.json({ availability: data })
  } else if(req.method === 'POST'){
    try {
      const userId = await verifyFirebaseTokenFromHeader(req)
      const { date, status, notes } = req.body
      // find vendor for this user
      const { data: vendor } = await supabase.from('vendors').select('*').eq('user_id', userId).single()
      if(!vendor) return res.status(400).json({ error: 'vendor not found' })
      const { data, error } = await supabase.from('vendor_availability').insert([{ vendor_id: vendor.id, date, status, notes }]).select().single()
      if(error) return res.status(500).json({ error: error.message })
      return res.json({ ok:true, entry: data })
    } catch(e){
      return res.status(401).json({ error: e.message })
    }
  } else {
    return res.status(405).end()
  }
}
