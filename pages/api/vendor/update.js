import { supabase } from '../../../lib/supabase_server'
import { verifyFirebaseTokenFromHeader } from '../../../lib/firebase_server'
import { normalizeIndianPhone } from '../../../lib/phone-utils'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const userId = await verifyFirebaseTokenFromHeader(req)
    const body = req.body

    // Get vendor
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, user_id, phone')
      .eq('user_id', userId)
      .single()

    if (vendorError || !vendor) {
      return res.status(404).json({ error: 'Vendor not found' })
    }

    // Prepare update data (exclude PAN and GST)
    const updateData = {}

    const phoneChanged = body.phone && body.phone !== vendor.phone
    if (phoneChanged && !body.phone_verified) {
      return res.status(400).json({ error: 'Phone verification required for phone change' })
    }
    if (phoneChanged) {
      const normalizedPhone = normalizeIndianPhone(body.phone)
      if (!normalizedPhone) {
        return res.status(400).json({ error: 'Valid Indian phone number required (+91, 10 digits)' })
      }
      updateData.phone = normalizedPhone
    }

    // Allowed fields to update
    const allowedFields = [
      'business_name',
      'contact_person',
      'email',
      'phone',
      'whatsapp',
      'business_address',
      'city',
      'category',
      'service_areas',
      'outstation_events',
      'years_experience',
      'brand_description',
      'why_choose',
      'deals',
      'website',
      'instagram',
      'facebook',
      'youtube',
      'other_services',
      'service_details',
      'service_pricing',
      'logo',
      'profile_pic'
    ]

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        if (field === 'phone' && phoneChanged) return
        updateData[field] = body[field]
      }
    })

    if (updateData.profile_pic !== undefined) {
      updateData.banner = updateData.profile_pic || null
    }

    // Handle services array
    if (body.services !== undefined) {
      updateData.services = Array.isArray(body.services) ? body.services : (body.services ? body.services.split(',') : [])
    }

    // Handle price range
    if (body.price_min !== undefined || body.price_max !== undefined) {
      updateData.price_range = {
        min: body.price_min || null,
        max: body.price_max || null
      }
    }

    // Update vendor
    const { data: updatedVendor, error: updateError } = await supabase
      .from('vendors')
      .update(updateData)
      .eq('id', vendor.id)
      .select()
      .single()

    if (updateError) {
      return res.status(500).json({ error: updateError.message })
    }

    return res.json({ ok: true, vendor: updatedVendor })
  } catch (e) {
    return res.status(401).json({ error: e.message })
  }
}

