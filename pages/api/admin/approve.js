
import { supabase } from '../../../lib/supabase_server'
export default async function handler(req,res){
  const vid = req.query.vendor_id
  if(!vid) return res.status(400).json({ error: 'vendor_id required' })
  const identity_doc = req.query.identity_doc || null
  const updates = { verified:true }
  if(identity_doc) { updates.identity_verified = true; updates.identity_doc_url = identity_doc }
  await supabase.from('vendors').update(updates).eq('id', vid)
  return res.json({ ok:true })
}
