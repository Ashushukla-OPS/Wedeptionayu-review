import { supabase } from '../../lib/supabase_server'

export default async function handler(req, res) {
  try {
    const { city, category, sort_by = 'popular', limit = 50 } = req.query
    
    // Build base query
    let query = supabase
      .from('vendors')
      .select('*')
      .eq('verified', true)
    
    // Filter by city
    if (city && city !== 'All') {
      query = query.eq('city', city)
    }
    
    // Filter by category
    if (category && category !== 'All') {
      query = query.eq('category', category)
    }
    
    // Apply sorting (except rating which we'll do after fetching reviews)
    if (sort_by === 'price-low') {
      query = query.order('price_range', { ascending: true })
    } else if (sort_by === 'price-high') {
      query = query.order('price_range', { ascending: false })
    } else {
      // Default: popular (by priority_rank, then created_at)
      query = query.order('priority_rank', { ascending: false })
        .order('created_at', { ascending: false })
    }
    
    query = query.limit(parseInt(limit))
    
    const { data: vendors, error } = await query
    
    if (error) {
      return res.status(500).json({ error: error.message })
    }
    
    // Fetch reviews separately for each vendor to calculate ratings
    const vendorsWithRatings = await Promise.all((vendors || []).map(async (vendor) => {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('vendor_id', vendor.id)
        .eq('approved', true)
      
      const review_count = reviews?.length || 0
      const avg_rating = review_count > 0
        ? parseFloat((reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / review_count).toFixed(1))
        : null
      
      return {
        ...vendor,
        avg_rating,
        review_count
      }
    }))
    
    // Sort by rating if needed
    if (sort_by === 'rating') {
      vendorsWithRatings.sort((a, b) => {
        if (!a.avg_rating) return 1
        if (!b.avg_rating) return -1
        return b.avg_rating - a.avg_rating
      })
    }
    
    return res.json({ vendors: vendorsWithRatings })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

