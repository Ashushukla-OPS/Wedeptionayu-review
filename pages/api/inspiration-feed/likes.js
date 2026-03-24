import { supabase } from '../../../lib/supabase_server'
import { verifyFirebaseTokenFromHeader } from '../../../lib/firebase_server'

// GET - Get users who liked a post
export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { post_id, limit = 50 } = req.query

      if (!post_id) {
        return res.status(400).json({ error: 'post_id is required' })
      }

      const { data: likes, error } = await supabase
        .from('inspiration_feed_likes')
        .select(`
          *,
          users!inspiration_feed_likes_user_id_fkey (
            id,
            name,
            profile_pic
          )
        `)
        .eq('post_id', post_id)
        .order('created_at', { ascending: false })
        .limit(parseInt(limit))

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.json({ likes: likes || [] })
    } catch (error) {
      console.error('Error fetching likes:', error)
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

