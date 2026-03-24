import { supabase } from '../../../lib/supabase_server'
import { verifyFirebaseTokenFromHeader } from '../../../lib/firebase_server'

/**
 * Submit or update a review. Login required.
 * One review per user per vendor (enforced by unique vendor_id + user_id).
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const userId = await verifyFirebaseTokenFromHeader(req)
    const { vendor_id, rating, review_text, customer_name } = req.body

    if (!vendor_id) return res.status(400).json({ error: 'vendor_id is required' })
    const ratingNum = parseInt(rating, 10)
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'rating must be 1 to 5' })
    }

    // Ensure user exists and has a name before allowing review.
    const { data: existingUser } = await supabase.from('users').select('id, name').eq('id', userId).maybeSingle()
    const trimmedName = customer_name ? String(customer_name).trim() : ''
    const currentName = existingUser?.name ? String(existingUser.name).trim() : ''

    if (!existingUser && !trimmedName) {
      return res.status(400).json({ error: 'Please set your name in Settings before submitting a review.' })
    }

    if (!existingUser) {
      await supabase.from('users').upsert([{ id: userId, name: trimmedName }], { onConflict: 'id' })
    } else if (!currentName && trimmedName) {
      await supabase.from('users').update({ name: trimmedName }).eq('id', userId)
    } else if (!currentName && !trimmedName) {
      return res.status(400).json({ error: 'Please set your name in Settings before submitting a review.' })
    }

    const payload = {
      vendor_id,
      user_id: userId,
      rating: ratingNum,
      review_text: (review_text && String(review_text).trim()) || null,
      approved: true
    }

    const { data: existing } = await supabase
      .from('reviews')
      .select('id, rating, review_text')
      .eq('vendor_id', vendor_id)
      .eq('user_id', userId)
      .single()

    let data
    if (existing) {
      const { data: updated, error: updateErr } = await supabase
        .from('reviews')
        .update({ rating: payload.rating, review_text: payload.review_text, approved: true })
        .eq('id', existing.id)
        .select()
        .single()
      if (updateErr) return res.status(500).json({ error: updateErr.message })
      data = updated
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from('reviews')
        .insert([payload])
        .select()
        .single()
      if (insertErr) {
        if (insertErr.code === '23505') return res.status(409).json({ error: 'You have already submitted a review for this vendor.' })
        return res.status(500).json({ error: insertErr.message })
      }
      data = inserted
    }

    return res.json({ ok: true, review: data })
  } catch (e) {
    const msg = e?.message || ''
    if (/invalid_grant|JWT|token|expired|signature/i.test(msg)) {
      return res.status(401).json({ error: 'Please sign in to submit a review.' })
    }
    return res.status(401).json({ error: e.message || 'Unauthorized' })
  }
}
