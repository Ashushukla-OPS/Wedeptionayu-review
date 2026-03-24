import { supabase } from '../../lib/supabase_server'

// GET - Fetch inspiration feed posts
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { page = 1, limit = 20, category, vendor_id } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)
    
    // Build query - fetch more posts than needed, then filter to show approved OR verified vendor posts
    let query = supabase
      .from('inspiration_feed')
      .select(`
        *,
        vendors!inspiration_feed_vendor_id_fkey (
          id,
          business_name,
          category,
          city,
          verified,
          subscription_level
        )
      `)
      // Include views_count and comments_count
      .order('created_at', { ascending: false })
      // Fetch more posts to account for filtering
      .range(offset, offset + parseInt(limit) * 2 - 1)
    
    if (vendor_id) {
      query = query.eq('vendor_id', vendor_id)
    }

    if (category && category !== 'All') {
      query = query.eq('category', category)
    }

    const { data: allPosts, error } = await query

    // Filter: show approved posts OR posts from verified vendors
    let data = (allPosts || []).filter(post => {
      const vendor = post.vendors || {}
      return post.approved === true || vendor.verified === true
    }).slice(0, parseInt(limit)) // Take only the requested limit

    // For vendor dashboard: attach profile visits from each post (when user landed on vendor profile via this post)
    if (vendor_id && data.length > 0) {
      try {
        const postIds = data.map(p => p.id)
        const { data: pvCounts } = await supabase
          .from('profile_views')
          .select('referrer_post_id')
          .in('referrer_post_id', postIds)
          .not('referrer_post_id', 'is', null)
        const countByPost = {}
        ;(pvCounts || []).forEach(row => {
          if (row.referrer_post_id) {
            countByPost[row.referrer_post_id] = (countByPost[row.referrer_post_id] || 0) + 1
          }
        })
        data = data.map(post => ({
          ...post,
          profile_visits_from_post: countByPost[post.id] || 0
        }))
      } catch (_) {
        data = data.map(post => ({ ...post, profile_visits_from_post: 0 }))
      }
    }

    // If join fails, fetch vendors separately
    if (error && error.message?.includes('relation')) {
      // Fallback query - fetch posts and vendors separately, then filter
      let fallbackQuery = supabase
        .from('inspiration_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1)
      
      if (vendor_id) {
        fallbackQuery = fallbackQuery.eq('vendor_id', vendor_id)
      }
      if (category && category !== 'All') {
        fallbackQuery = fallbackQuery.eq('category', category)
      }
      
      const { data: postsData, error: postsError } = await fallbackQuery
      
      if (postsError) {
        return res.status(500).json({ error: postsError.message })
      }
      
      // Fetch vendors separately
      const vendorIds = [...new Set(postsData.map(p => p.vendor_id))]
      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('id, business_name, category, city, verified, subscription_level')
        .in('id', vendorIds)
      
      const vendorsMap = {}
      vendorsData?.forEach(v => { vendorsMap[v.id] = v })
      
      // Filter: show approved posts OR posts from verified vendors
      const data = postsData
        .map(post => ({
          ...post,
          vendors: vendorsMap[post.vendor_id]
        }))
        .filter(post => {
          const vendor = post.vendors || {}
          return post.approved === true || vendor.verified === true
        })
      
      // Apply ranking
      let ranked = data
      if (!vendor_id) {
        ranked = data.map(post => {
          const vendor = post.vendors || {}
          const isPremium = vendor.subscription_level && vendor.subscription_level !== 'free'
          const ageInDays = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60 * 24)
          
          const score = 
            (isPremium ? 500 : 0) +
            (vendor.verified ? 100 : 0) +
            (Math.log(1 + (post.likes || 0)) * 30) +
            Math.max(0, 100 - (ageInDays / 30) * 100)
          
          return { ...post, _score: score }
        }).sort((a, b) => b._score - a._score)
      }
      
      return res.json({ posts: ranked, page: parseInt(page), limit: parseInt(limit) })
    }
    
    if (error) {
      return res.status(500).json({ error: error.message })
    }
    
    if (error) {
      return res.status(500).json({ error: error.message })
    }
    
    // Apply ranking algorithm (only if not vendor-specific)
    let ranked = data
    if (!vendor_id) {
      ranked = data.map(post => {
        const vendor = post.vendors || {}
        const isPremium = vendor.subscription_level && vendor.subscription_level !== 'free'
        const ageInDays = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60 * 24)
        
        // Calculate score
        const score = 
          (isPremium ? 500 : 0) + // Premium boost
          (vendor.verified ? 100 : 0) + // Verified boost
          (Math.log(1 + (post.likes || 0)) * 30) + // Engagement
          Math.max(0, 100 - (ageInDays / 30) * 100) // Recency decay
        
        return { ...post, _score: score }
      }).sort((a, b) => b._score - a._score)
    }
    
    return res.json({ posts: ranked, page: parseInt(page), limit: parseInt(limit) })
  }
  
  return res.status(405).json({ error: 'Method not allowed' })
}

