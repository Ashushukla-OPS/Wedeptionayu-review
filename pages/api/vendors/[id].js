import { supabase } from '../../../lib/supabase_server'
export default async function handler(req,res){
  const { id } = req.query
  const { data, error } = await supabase.from('vendors').select('*').eq('id', id).single()
  if(error) return res.status(404).json({ error: error.message })
  return res.json({ vendor: data })
}
