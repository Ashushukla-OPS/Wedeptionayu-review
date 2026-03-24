import { supabase } from '../../lib/supabase_server'
import { verifyFirebaseTokenFromHeader } from '../../lib/firebase_server'
export default async function handler(req,res){
  if(req.method !== 'POST') return res.status(405).end()
  try {
    const userId = await verifyFirebaseTokenFromHeader(req)
    // find vendor id
    const { data: vendor } = await supabase.from('vendors').select('*').eq('user_id', userId).single()
    if(!vendor) return res.status(400).json({ error: 'vendor not found' })
    
    // Check subscription and portfolio limits
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('vendor_id', vendor.id)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    const isPremium = subscription && subscription.status === 'active'
    const maxPortfolio = isPremium ? 999999 : 10 // Unlimited for premium
    
    // Get current month usage
    const currentMonth = new Date().toISOString().slice(0, 7)
    const { data: usage } = await supabase
      .from('vendor_usage_stats')
      .select('portfolio_count')
      .eq('vendor_id', vendor.id)
      .eq('month_year', currentMonth)
      .single()
    
    const currentPortfolio = usage?.portfolio_count || 0
    
    if (currentPortfolio >= maxPortfolio) {
      return res.status(403).json({ 
        error: `Portfolio limit reached. ${isPremium ? 'Premium' : 'Free'} plan allows ${maxPortfolio === 999999 ? 'unlimited' : maxPortfolio} portfolio items. Upgrade to premium for unlimited portfolio.` 
      })
    }
    
    const { media_url, media_type, caption } = req.body
    
    // Auto-approve if vendor is verified, otherwise require admin approval
    const isApproved = vendor.verified === true
    
    const { data, error } = await supabase
      .from('vendor_portfolio')
      .insert([{ 
        vendor_id: vendor.id, 
        media_url, 
        media_type, 
        caption, 
        approved: isApproved 
      }])
      .select()
      .single()
    if(error) return res.status(500).json({ error: error.message })
    
    // Update usage stats
    if (usage) {
      await supabase
        .from('vendor_usage_stats')
        .update({ portfolio_count: currentPortfolio + 1 })
        .eq('vendor_id', vendor.id)
        .eq('month_year', currentMonth)
    } else {
      await supabase
        .from('vendor_usage_stats')
        .insert([{
          vendor_id: vendor.id,
          month_year: currentMonth,
          portfolio_count: 1
        }])
    }
    
    return res.json({ ok:true, post: data })
  } catch(e){
    return res.status(401).json({ error: e.message })
  }
}
