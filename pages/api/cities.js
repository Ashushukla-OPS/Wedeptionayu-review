import { supabase } from '../../lib/supabase_server'

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })
    
    if (error) {
      return res.status(500).json({ error: error.message })
    }
    
    return res.json({ cities: data || [] })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

