import { supabase } from '../../../lib/supabase_server'

export default async function handler(req, res) {
  try {
    const { vendor_id } = req.query
    
    if (!vendor_id) {
      return res.status(400).json({ error: 'vendor_id required' })
    }
    
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        *,
        users:users(id, name)
      `)
      .eq('vendor_id', vendor_id)
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) {
      return res.status(500).json({ error: error.message })
    }
    
    // Map user data
    const reviewsWithUser = (reviews || []).map(review => ({
      ...review,
      user_name: review.users?.name || 'Anonymous'
    }))
    
    return res.json({ reviews: reviewsWithUser })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

