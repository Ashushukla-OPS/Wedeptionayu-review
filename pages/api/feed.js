import { supabase } from '../../lib/supabase_server'
export default async function handler(req,res){
  const page = parseInt(req.query.page||'1')
  const limit = 8
  const offset = (page-1)*limit
  // Basic ranking: promoted first, then priority_rank, then likes, then recent
  const { data, error } = await supabase.rpc('get_ranked_feed', { p_limit: limit, p_offset: offset })
  if(error) return res.status(500).json({ error: error.message })
  return res.json({ posts: data })
}
