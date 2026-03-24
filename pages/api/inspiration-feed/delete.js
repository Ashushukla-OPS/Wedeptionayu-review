import { supabase } from '../../../lib/supabase_server'
import { verifyFirebaseTokenFromHeader } from '../../../lib/firebase_server'

// POST - Delete an inspiration post (vendor owner only)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const userId = await verifyFirebaseTokenFromHeader(req)
    const { post_id } = req.body

    if (!post_id) {
      return res.status(400).json({ error: 'post_id is required' })
    }

    const { data: post, error: postError } = await supabase
      .from('inspiration_feed')
      .select('id, vendor_id')
      .eq('id', post_id)
      .single()

    if (postError || !post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    const { data: vendor } = await supabase
      .from('vendors')
      .select('user_id')
      .eq('id', post.vendor_id)
      .single()

    if (!vendor || vendor.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this post' })
    }

    const { error: deleteError } = await supabase
      .from('inspiration_feed')
      .delete()
      .eq('id', post_id)

    if (deleteError) {
      return res.status(500).json({ error: deleteError.message })
    }

    return res.json({ ok: true })
  } catch (error) {
    console.error('Error deleting post:', error)
    return res.status(401).json({ error: error.message })
  }
}
