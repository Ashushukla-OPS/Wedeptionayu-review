import { supabase } from '../../../lib/supabase_server'
export default async function handler(req,res){
  const pid = req.query.post_id
  if(!pid) return res.status(400).json({ error: 'post_id required' })
  await supabase.from('vendor_portfolio').update({ approved:true }).eq('id', pid)
  return res.json({ ok:true })
}
