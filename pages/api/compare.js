import { supabase } from '../../lib/supabase_server'

export default async function handler(req, res) {
  try {
    const ids = (req.query.ids || '').split(',').map(s => s.trim()).filter(Boolean)
    if (ids.length === 0) {
      return res.json({ vendors: [] })
    }
    
    // Use vendors table directly (more reliable)
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .in('id', ids)
      .eq('verified', true)
    
    if (error) {
      console.error('Error fetching vendors for comparison:', error)
      return res.status(500).json({ error: error.message })
    }
    
    return res.json({ vendors: data || [] })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
