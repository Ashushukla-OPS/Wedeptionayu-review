import { supabase } from '../../../lib/supabase_server'
import { verifyFirebaseTokenFromHeader } from '../../../lib/firebase_server'

// POST - Update post caption/description
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const userId = await verifyFirebaseTokenFromHeader(req)
    const { post_id, caption, description, category } = req.body

    if (!post_id) {
      return res.status(400).json({ error: 'post_id is required' })
    }

    // Verify vendor owns this post
    const { data: post, error: postError } = await supabase
      .from('inspiration_feed')
      .select('id, vendor_id, vendors!inner(user_id)')
      .eq('id', post_id)
      .single()

    if (postError || !post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    // Check if user is the vendor owner
    const { data: vendor } = await supabase
      .from('vendors')
      .select('user_id')
      .eq('id', post.vendor_id)
      .single()

    if (!vendor || vendor.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this post' })
    }

    // Update post (caption, description, category)
    const updateData = {}
    if (caption !== undefined) updateData.caption = caption
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category

    const { data: updatedPost, error: updateError } = await supabase
      .from('inspiration_feed')
      .update(updateData)
      .eq('id', post_id)
      .select()
      .single()

    if (updateError) {
      return res.status(500).json({ error: updateError.message })
    }

    return res.json({ post: updatedPost })
  } catch (error) {
    console.error('Error updating post:', error)
    return res.status(401).json({ error: error.message })
  }
}

