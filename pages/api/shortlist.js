import { supabase } from '../../lib/supabase_server'
import { verifyFirebaseTokenFromHeader } from '../../lib/firebase_server'

export default async function handler(req, res) {
  try {
    const userId = await verifyFirebaseTokenFromHeader(req)

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('vendor_shortlists')
        .select(`
          id,
          created_at,
          vendor_id,
          vendors:vendors (
            id,
            business_name,
            category,
            city,
            profile_pic,
            banner,
            logo,
            verified,
            subscription_level
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) return res.status(500).json({ error: error.message })
      return res.json({ items: data || [] })
    }

    if (req.method === 'POST') {
      const { vendor_id } = req.body || {}
      if (!vendor_id) return res.status(400).json({ error: 'vendor_id is required' })

      const { data, error } = await supabase
        .from('vendor_shortlists')
        .upsert([{ user_id: userId, vendor_id }], { onConflict: 'user_id,vendor_id' })
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      return res.json({ ok: true, item: data })
    }

    if (req.method === 'DELETE') {
      const { vendor_id } = req.body || {}
      if (!vendor_id) return res.status(400).json({ error: 'vendor_id is required' })
      const { error } = await supabase
        .from('vendor_shortlists')
        .delete()
        .eq('user_id', userId)
        .eq('vendor_id', vendor_id)
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized. Please sign in.' })
  }
}

