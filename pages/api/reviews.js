
import { supabase } from '../../lib/supabase_server'
export default async function handler(req,res){
  const vendor_id = req.query.vendor_id
  if(!vendor_id) return res.status(400).json({ error: 'vendor_id required' })
  const { data, error } = await supabase.from('reviews').select('*').eq('vendor_id', vendor_id).eq('approved', true).order('created_at', { ascending: false }).limit(50)
  if(error) return res.status(500).json({ error: error.message })
  return res.json({ reviews: data })
}
