import { verifyFirebaseTokenFromHeader } from '../../../lib/firebase_server'
import { supabase } from '../../../lib/supabase_server'

/**
 * Check if the current user can review this vendor.
 * Login required. One review per user per vendor: canReview = true if not yet reviewed.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const userId = await verifyFirebaseTokenFromHeader(req)
    const { vendor_id } = req.query
    if (!vendor_id) return res.json({ canReview: false, alreadyReviewed: false })

    const { data: existing } = await supabase
      .from('reviews')
      .select('id, rating, review_text, created_at')
      .eq('vendor_id', vendor_id)
      .eq('user_id', userId)
      .maybeSingle()

    return res.json({
      canReview: true,
      alreadyReviewed: !!existing,
      myReview: existing ? { id: existing.id, rating: existing.rating, review_text: existing.review_text, created_at: existing.created_at } : null
    })
  } catch (e) {
    return res.json({ canReview: false, alreadyReviewed: false, myReview: null })
  }
}
