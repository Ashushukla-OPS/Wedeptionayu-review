import { supabase } from '../../../lib/supabase_server'

// POST - Track a post view
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { post_id } = req.body
    const user_id = req.headers.authorization ? 
      (await import('../../../lib/firebase_server')).verifyFirebaseTokenFromHeader(req).catch(() => null) : 
      null

    if (!post_id) {
      return res.status(400).json({ error: 'post_id is required' })
    }

    // Get IP address
    const ip_address = req.headers['x-forwarded-for'] || 
                      req.headers['x-real-ip'] || 
                      req.connection?.remoteAddress || 
                      null

    // Track view using function
    const { error } = await supabase.rpc('track_inspiration_post_view', {
      p_post_id: post_id,
      p_user_id: user_id,
      p_ip_address: ip_address
    })

    if (error) {
      console.error('Error tracking view:', error)
      // Don't fail the request if tracking fails
    }

    return res.json({ success: true })
  } catch (error) {
    console.error('Error in track-view:', error)
    // Still return success to not break the frontend
    return res.json({ success: true })
  }
}

