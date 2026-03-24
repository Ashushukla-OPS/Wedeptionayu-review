
import { supabase } from '../../../lib/supabase_server'
export default async function handler(req,res){
  const { data, error } = await supabase.from('reviews').select('*').eq('approved', false).limit(100)
  if(error) return res.status(500).json({ error: error.message })
  return res.json({ reviews: data })
}
