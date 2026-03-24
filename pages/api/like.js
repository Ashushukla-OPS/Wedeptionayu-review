import { supabase } from '../../lib/supabase_server'
import { verifyFirebaseTokenFromHeader } from '../../lib/firebase_server'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  
  try {
    const { post_id, post_type = 'portfolio' } = req.body
    
    // Get user_id from auth token
    let userId = null
    try {
      userId = await verifyFirebaseTokenFromHeader(req)
    } catch (e) {
      // User not authenticated, can still like but without tracking
    }
    
    if (post_type === 'inspiration') {
      // Handle inspiration feed likes with new function
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required to like posts' })
      }
      
      const { data, error } = await supabase.rpc('toggle_inspiration_like', { 
        p_post_id: post_id, 
        p_user_id: userId 
      })
      
      if (error) return res.status(500).json({ error: error.message })
      return res.json(data)
    } else {
      // Handle portfolio/feed likes (existing function)
      const { data, error } = await supabase.rpc('increment_like', { 
        p_id: post_id, 
        p_user_id: userId 
      })
      if (error) return res.status(500).json({ error: error.message })
      return res.json(data)
    }
  } catch (error) {
    console.error('Like error:', error)
    return res.status(401).json({ error: error.message })
  }
}
