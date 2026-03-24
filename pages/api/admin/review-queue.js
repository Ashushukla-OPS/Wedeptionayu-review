import { supabase } from '../../../lib/supabase_server'
export default async function handler(req,res){
  const { data } = await supabase.from('reviews').select('*').eq('approved', false).order('created_at',{ascending:false}).limit(200)
  return res.json({ reviews: data })
}
