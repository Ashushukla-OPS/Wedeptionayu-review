import { supabase } from '../../../lib/supabase_server'
import { verifyFirebaseTokenFromHeader } from '../../../lib/firebase_server'

// GET - Fetch comments for a post
export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { post_id, limit = 50 } = req.query

      if (!post_id) {
        return res.status(400).json({ error: 'post_id is required' })
      }

      const { data: comments, error } = await supabase
        .from('inspiration_feed_comments')
        .select(`
          *,
          users!inspiration_feed_comments_user_id_fkey (
            id,
            name,
            profile_pic
          )
        `)
        .eq('post_id', post_id)
        .order('created_at', { ascending: true })
        .limit(parseInt(limit))

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.json({ comments: comments || [] })
    } catch (error) {
      console.error('Error fetching comments:', error)
      return res.status(500).json({ error: error.message })
    }
  }

  // POST - Add a comment
  if (req.method === 'POST') {
    try {
      const userId = await verifyFirebaseTokenFromHeader(req)
      const { post_id, comment_text } = req.body

      if (!post_id || !comment_text || !comment_text.trim()) {
        return res.status(400).json({ error: 'post_id and comment_text are required' })
      }

      // Verify post exists
      const { data: post, error: postError } = await supabase
        .from('inspiration_feed')
        .select('id')
        .eq('id', post_id)
        .single()

      if (postError || !post) {
        return res.status(404).json({ error: 'Post not found' })
      }

      // Insert comment
      const { data: comment, error: insertError } = await supabase
        .from('inspiration_feed_comments')
        .insert([{
          post_id,
          user_id: userId,
          comment_text: comment_text.trim()
        }])
        .select(`
          *,
          users!inspiration_feed_comments_user_id_fkey (
            id,
            name,
            profile_pic
          )
        `)
        .single()

      if (insertError) {
        return res.status(500).json({ error: insertError.message })
      }

      return res.json({ comment })
    } catch (error) {
      console.error('Error adding comment:', error)
      return res.status(401).json({ error: error.message })
    }
  }

  // DELETE - Delete a comment (optional, for future use)
  if (req.method === 'DELETE') {
    try {
      const userId = await verifyFirebaseTokenFromHeader(req)
      const { comment_id } = req.body

      if (!comment_id) {
        return res.status(400).json({ error: 'comment_id is required' })
      }

      // Only allow deleting own comments
      const { error: deleteError } = await supabase
        .from('inspiration_feed_comments')
        .delete()
        .eq('id', comment_id)
        .eq('user_id', userId)

      if (deleteError) {
        return res.status(500).json({ error: deleteError.message })
      }

      return res.json({ success: true })
    } catch (error) {
      console.error('Error deleting comment:', error)
      return res.status(401).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}


