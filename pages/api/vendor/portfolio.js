import { supabase } from '../../../lib/supabase_server'

export default async function handler(req, res) {
  try {
    const { vendor_id } = req.query
    
    if (!vendor_id) {
      return res.status(400).json({ error: 'vendor_id required' })
    }
    
    const { data, error } = await supabase
      .from('vendor_portfolio')
      .select('*')
      .eq('vendor_id', vendor_id)
      .eq('approved', true)
      .order('created_at', { ascending: false })
    
    if (error) {
      return res.status(500).json({ error: error.message })
    }
    
    return res.json({ portfolio: data || [] })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

