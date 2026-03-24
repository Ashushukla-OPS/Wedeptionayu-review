import { supabase } from '../../../lib/supabase_server'

export default async function handler(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 10
    
    // Fetch latest approved reviews
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      return res.status(500).json({ error: error.message })
    }
    
    // Fetch vendor and user details separately
    const vendorIds = [...new Set((reviews || []).map(r => r.vendor_id).filter(Boolean))]
    const userIds = [...new Set((reviews || []).map(r => r.user_id).filter(Boolean))]
    
    let vendors = []
    let users = []
    
    if (vendorIds.length > 0) {
      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('id, business_name, category, profile_pic, banner, logo')
        .in('id', vendorIds)
      vendors = vendorsData || []
    }
    
    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name')
        .in('id', userIds)
      users = usersData || []
    }
    
    const vendorsMap = new Map(vendors.map(v => [v.id, v]))
    const usersMap = new Map(users.map(u => [u.id, u]))
    
    // Map the data to include vendor and user names
    const reviewsWithDetails = (reviews || []).map(review => {
      const vendor = vendorsMap.get(review.vendor_id)
      const user = usersMap.get(review.user_id)
      return {
        id: review.id,
        rating: review.rating,
        review_text: review.review_text,
        created_at: review.created_at,
        vendor_id: review.vendor_id,
        vendor_name: vendor?.business_name || 'Unknown Vendor',
        vendor_category: vendor?.category || '',
        vendor_image: vendor?.profile_pic || vendor?.logo || vendor?.banner || null,
        user_name: user?.name || 'Anonymous',
        user_id: review.user_id
      }
    })
    
    return res.json({ reviews: reviewsWithDetails })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

