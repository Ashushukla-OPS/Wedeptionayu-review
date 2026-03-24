import { supabase } from '../../../lib/supabase_server'
export default async function handler(req,res){
  const vendor_id = req.query.vendor_id
  const { data } = await supabase.from('vendor_availability').select('*').eq('vendor_id', vendor_id).order('date',{ascending:true})
  return res.json({ availability: data })
}
