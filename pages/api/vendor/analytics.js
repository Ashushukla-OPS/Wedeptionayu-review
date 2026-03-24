import { supabase } from '../../../lib/supabase_server'
import { verifyFirebaseTokenFromHeader } from '../../../lib/firebase_server'

export default async function handler(req, res) {
  try {
    const userId = await verifyFirebaseTokenFromHeader(req)
    const { data: vendor } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (!vendor) return res.status(400).json({ error: 'vendor not found' })

    // Profile views: separate table (not leads). Use 0 if table not yet created.
    let totalViews = 0
    let profileViewsLast7Days = 0
    const monthlyProfileViews = []
    try {
      const { count } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendor.id)
      totalViews = count ?? 0

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const { count: count7d } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendor.id)
        .gte('created_at', sevenDaysAgo.toISOString())
      profileViewsLast7Days = count7d ?? 0

      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        const { count: monthCount } = await supabase
          .from('profile_views')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', vendor.id)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString())
        monthlyProfileViews.push({
          month: date.toLocaleString('default', { month: 'short' }),
          views: monthCount ?? 0
        })
      }
    } catch (_) {}

    // Leads only (contact_view, message, inquiry, availability_check)
    const { data: allLeads } = await supabase
      .from('leads')
      .select('*')
      .eq('vendor_id', vendor.id)
    
    const getLeadType = (l) => (l.details && l.details.lead_type) || l.lead_type || 'inquiry'
    const isProfileView = (l) => getLeadType(l) === 'profile_view'
    const realLeads = (allLeads || []).filter(l => !isProfileView(l))
    const totalLeads = realLeads.length

    const leadsByStatus = {
      new: realLeads.filter(l => l.status === 'new').length || 0,
      in_progress: realLeads.filter(l => l.status === 'in_progress').length || 0,
      booked: realLeads.filter(l => l.status === 'booked').length || 0,
      rejected: realLeads.filter(l => l.status === 'rejected').length || 0
    }
    
    const recentLeads = realLeads.slice(0, 5)
    const conversionRate = totalLeads > 0 
      ? ((leadsByStatus.booked / totalLeads) * 100).toFixed(1) 
      : 0

    // Lead source breakdown (real leads only; profile views are separate in totalViews)
    const leadSourceCounts = {}
    realLeads.forEach(l => {
      const type = getLeadType(l)
      leadSourceCounts[type] = (leadSourceCounts[type] || 0) + 1
    })
    const totalForBreakdown = Object.values(leadSourceCounts).reduce((a, b) => a + b, 0) || 1
    const leadSourceBreakdown = Object.entries(leadSourceCounts).map(([name, count]) => ({
      name: name === 'contact_view' ? 'Contact view' : name === 'message' ? 'Message' : name === 'availability_check' ? 'Availability check' : 'Inquiry',
      count,
      percent: Math.round((count / totalForBreakdown) * 100)
    }))

    // Reviews Statistics
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating, approved')
      .eq('vendor_id', vendor.id)
    
    const approvedReviews = reviews?.filter(r => r.approved) || []
    const pendingReviews = reviews?.filter(r => !r.approved).length || 0
    const avgRating = approvedReviews.length > 0
      ? (approvedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / approvedReviews.length).toFixed(1)
      : 0
    const totalReviews = approvedReviews.length

    // Portfolio Statistics
    const { data: portfolio } = await supabase
      .from('vendor_portfolio')
      .select('id, likes, approved')
      .eq('vendor_id', vendor.id)
    
    const totalLikes = portfolio?.reduce((s, v) => s + (v.likes || 0), 0) || 0
    const approvedPortfolio = portfolio?.filter(p => p.approved).length || 0
    const pendingPortfolio = portfolio?.filter(p => !p.approved).length || 0

    // Revenue/Subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    const subscriptionStatus = subscription?.status || 'none'
    const subscriptionPlan = subscription?.plan || 'free'

    // Recent Activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data: recentLeadsRaw } = await supabase
      .from('leads')
      .select('created_at, status, details, lead_type')
      .eq('vendor_id', vendor.id)
      .gte('created_at', sevenDaysAgo.toISOString())
    const recentLeadsActivity = (recentLeadsRaw || []).filter(l => {
      const t = (l.details && l.details.lead_type) || l.lead_type || 'inquiry'
      return t !== 'profile_view'
    })
    
    const { data: recentReviewsActivity } = await supabase
      .from('reviews')
      .select('created_at, rating')
      .eq('vendor_id', vendor.id)
      .gte('created_at', sevenDaysAgo.toISOString())

    // Monthly Trends (last 6 months) — real leads only, exclude profile_view
    const monthlyStats = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      const { data: monthLeadsData } = await supabase
        .from('leads')
        .select('id, details, lead_type')
        .eq('vendor_id', vendor.id)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())
      const monthRealLeads = (monthLeadsData || []).filter(l => {
        const t = (l.details && l.details.lead_type) || l.lead_type || 'inquiry'
        return t !== 'profile_view'
      }).length
      
      monthlyStats.push({
        month: date.toLocaleString('default', { month: 'short' }),
        leads: monthRealLeads
      })
    }

    return res.json({
      overview: {
        totalLeads,
        totalViews: totalViews ?? 0,
        profileViewsLast7Days: profileViewsLast7Days ?? 0,
        monthlyProfileViews,
        leadsByStatus,
        conversionRate: parseFloat(conversionRate),
        totalReviews,
        avgRating: parseFloat(avgRating),
        pendingReviews,
        totalLikes,
        approvedPortfolio,
        pendingPortfolio,
        subscriptionStatus,
        subscriptionPlan,
        leadSourceBreakdown
      },
      recentLeads: recentLeads.slice(0, 5),
      monthlyTrends: monthlyStats,
      monthlyProfileViews,
      recentActivity: {
        leads: recentLeadsActivity.length || 0,
        reviews: recentReviewsActivity?.length || 0,
        profileViews: profileViewsLast7Days ?? 0
      }
    })
  } catch (e) {
    return res.status(401).json({ error: e.message })
  }
}
