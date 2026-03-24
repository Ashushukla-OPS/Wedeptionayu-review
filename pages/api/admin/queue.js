import { supabase } from '../../../lib/supabase_server'
export default async function handler(req,res){
  const { data: vendors } = await supabase.from('vendors').select('*').eq('verified',false).limit(50)
  const { data: posts } = await supabase.from('vendor_portfolio').select('*').eq('approved',false).limit(50)
  return res.json({ vendors, posts })
}
