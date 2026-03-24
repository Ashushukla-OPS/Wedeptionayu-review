import { supabase } from '../../../lib/supabase_server'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  const { vendor_id } = req.query
  
  if (!vendor_id) {
    return res.status(400).json({ error: 'vendor_id is required' })
  }
  
  try {
    // Get active subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('vendor_id', vendor_id)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    // Get current month usage
    const currentMonth = new Date().toISOString().slice(0, 7)
    const { data: usage } = await supabase
      .from('vendor_usage_stats')
      .select('posts_count, portfolio_count, leads_count')
      .eq('vendor_id', vendor_id)
      .eq('month_year', currentMonth)
      .single()
    
    const isPremium = subscription && subscription.status === 'active'
    const subscriptionLevel = isPremium ? (subscription.subscription_level || 'premium') : 'free'
    
    const limits = {
      posts: isPremium ? 50 : 10,
      portfolio: isPremium ? 999999 : 10, // Unlimited for premium, 10 for free
      leads: isPremium ? { min: 5, max: 10 } : { min: 3, max: 5 }
    }
    
    const current = {
      posts: usage?.posts_count || 0,
      portfolio: usage?.portfolio_count || 0,
      leads: usage?.leads_count || 0
    }
    
    return res.json({
      subscription: subscription || null,
      subscription_level: subscriptionLevel,
      is_premium: isPremium,
      limits,
      current,
      remaining: {
        posts: Math.max(0, limits.posts - current.posts),
        portfolio: Math.max(0, limits.portfolio - current.portfolio)
      }
    })
  } catch (error) {
    console.error('Error checking subscription:', error)
    return res.status(500).json({ error: error.message })
  }
}

