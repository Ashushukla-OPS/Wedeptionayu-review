
import { supabase } from '../../../lib/supabase_server'
export default async function handler(req,res){
  const id = req.query.review_id
  if(!id) return res.status(400).json({ error: 'review_id required' })
  await supabase.from('reviews').update({ approved: true }).eq('id', id)
  return res.json({ ok:true })
}
