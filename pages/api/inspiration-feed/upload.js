import { supabase } from '../../../lib/supabase_server'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { vendor_id, media_url, caption, description, category, media_type } = req.body
    
    if (!vendor_id || !media_url) {
      return res.status(400).json({ error: 'vendor_id and media_url are required' })
    }
    
    // Detect media type from URL if not provided
    const detectedType = media_type || (media_url.match(/\.(mp4|webm|mov|avi|mpeg)$/i) ? 'video' : 'image')
    
    // Check subscription and post limits
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id, subscription_level, verified')
      .eq('id', vendor_id)
      .single()
    
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' })
    }
    
    // Get current month usage
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const { data: usage } = await supabase
      .from('vendor_usage_stats')
      .select('posts_count')
      .eq('vendor_id', vendor_id)
      .eq('month_year', currentMonth)
      .single()
    
    const currentPosts = usage?.posts_count || 0
    const isPremium = vendor.subscription_level && vendor.subscription_level !== 'free'
    const maxPosts = isPremium ? 50 : 10
    
    if (currentPosts >= maxPosts) {
      return res.status(403).json({ 
        error: `Post limit reached. ${isPremium ? 'Premium' : 'Free'} plan allows ${maxPosts} posts per month. Upgrade to premium for 50 posts/month.` 
      })
    }
    
    // Auto-approve if vendor is verified, otherwise require admin approval
    const isApproved = vendor.verified === true
    
    // Insert inspiration post
    const insertData = {
      vendor_id,
      media_url,
      caption,
      description,
      category: category || 'All',
      approved: isApproved // Auto-approved if vendor is verified
    }
    
    // Add media_type if column exists (for future compatibility)
    // The frontend will detect video from URL if media_type is not available
    if (media_type) {
      insertData.media_type = detectedType
    }
    
    const { data: post, error: insertError } = await supabase
      .from('inspiration_feed')
      .insert([insertData])
      .select()
      .single()
    
    if (insertError) {
      return res.status(500).json({ error: insertError.message })
    }
    
    // Update usage stats
    if (usage) {
      await supabase
        .from('vendor_usage_stats')
        .update({ posts_count: currentPosts + 1 })
        .eq('vendor_id', vendor_id)
        .eq('month_year', currentMonth)
    } else {
      await supabase
        .from('vendor_usage_stats')
        .insert([{
          vendor_id,
          month_year: currentMonth,
          posts_count: 1
        }])
    }
    
    const successMessage = isApproved 
      ? 'Inspiration post uploaded and approved successfully!' 
      : 'Inspiration post uploaded successfully. Pending admin approval.'
    
    return res.json({ post, message: successMessage })
  } catch (error) {
    console.error('Error uploading inspiration post:', error)
    return res.status(500).json({ error: error.message })
  }
}

