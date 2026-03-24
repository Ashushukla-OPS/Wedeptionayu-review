import { supabase } from '../../../lib/supabase_server'
import { verifyFirebaseTokenFromHeader } from '../../../lib/firebase_server'
export default async function handler(req,res){
  try {
    const userId = await verifyFirebaseTokenFromHeader(req)
    const { data: vendor } = await supabase.from('vendors').select('*').eq('user_id', userId).single()
    if(!vendor) return res.status(404).json({ error: 'vendor not found' })
    const { data: leadsRaw } = await supabase.from('leads').select('*').eq('vendor_id', vendor.id).order('created_at',{ascending:false})
    const getLeadType = (l) => (l?.details && l.details.lead_type) || l?.lead_type || 'inquiry'
    const leads = (leadsRaw || []).filter(l => getLeadType(l) !== 'profile_view')
    const { data: portfolio } = await supabase.from('vendor_portfolio').select('*').eq('vendor_id', vendor.id)
    const { data: subscription } = await supabase.from('subscriptions').select('*').eq('vendor_id', vendor.id).order('created_at',{ascending:false}).limit(1).single()
    return res.json({ vendor, leads, portfolio, subscription })
  } catch(e){
    return res.status(401).json({ error: e.message })
  }
}
