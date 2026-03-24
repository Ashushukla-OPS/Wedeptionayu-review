import { supabase } from '../../../lib/supabase_server'
export default async function handler(req, res) {
  const vendor_id = req.query.vendor_id
  if (!vendor_id) return res.status(400).json({ error: 'vendor_id required' })
  const { data, error } = await supabase
    .from('reviews')
    .select('*, users:users(id, name)')
    .eq('vendor_id', vendor_id)
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) return res.status(500).json({ error: error.message })
  const reviews = (data || []).map((r) => ({
    ...r,
    user_name: r.users?.name || 'Anonymous'
  }))
  return res.json({ reviews })
}
