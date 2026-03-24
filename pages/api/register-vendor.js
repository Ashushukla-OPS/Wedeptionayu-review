
import { supabase } from '../../lib/supabase_server'
import { verifyFirebaseTokenFromHeader } from '../../lib/firebase_server'
import { normalizeIndianPhone } from '../../lib/phone-utils'

export default async function handler(req,res){
  if(req.method !== 'POST') return res.status(405).end()
  try {
    const userId = await verifyFirebaseTokenFromHeader(req)
    const body = req.body
    const normalizedPhone = normalizeIndianPhone(body.phone)

    if (!normalizedPhone) {
      return res.status(400).json({ error: 'Valid Indian phone number required (+91, 10 digits)' })
    }

    // Required fields for registration
    const required = ['business_name', 'contact_person', 'email', 'city', 'category']
    for (const field of required) {
      if (!body[field]) {
        return res.status(400).json({ error: `${field} is required` })
      }
    }

    const startingPrice = body.starting_price ?? body.price_min ?? null

    // Normalize service areas (comma-separated string or array)
    const serviceAreas = (() => {
      if (Array.isArray(body.service_areas)) return body.service_areas.filter(Boolean)
      if (typeof body.service_areas === 'string') return body.service_areas.split(',').map(s => s.trim()).filter(Boolean)
      return []
    })()

    const serviceDetails = body.service_details && typeof body.service_details === 'object' ? body.service_details : {}
    const servicePricing = body.service_pricing && typeof body.service_pricing === 'object' ? body.service_pricing : {}

    // Keep backward compatibility: some parts of the app expect `services` to be an array containing the category.
    const services = body.category ? [body.category] : []

    const price_range = { min: startingPrice || null, max: null }
    const vendorRow = {
      user_id: userId,
      name: body.name || body.contact_person || null,  // Vendor name (auto-filled from phone login)
      business_name: body.business_name,
      contact_person: body.contact_person,
      email: body.email,
      phone: normalizedPhone,
      whatsapp: body.whatsapp,
      business_address: body.business_address,
      city: body.city,
      category: body.category,
      years_experience: body.years_experience ? parseInt(body.years_experience) : null,
      services: services,
      price_range: price_range,
      service_areas: serviceAreas,
      outstation_events: body.outstation_events === true,
      service_details: serviceDetails,
      service_pricing: servicePricing,
      website: body.website,
      instagram: body.instagram,
      facebook: body.facebook,
      youtube: body.youtube,
      brand_description: body.brand_description,
      why_choose: body.why_choose,
      deals: body.deals,
      other_services: body.other_services || null,
      profile_pic: body.profile_photo_url || null,
      // Vendors are automatically verified on registration (no manual admin step).
      verified: true
    }
    const { data, error } = await supabase.from('vendors').insert([vendorRow]).select().single()
    if(error) return res.status(500).json({ error: error.message })
    // Set user role to vendor in users table
    await supabase.from('users').upsert(
      { id: userId, role: 'vendor' },
      { onConflict: 'id' }
    )
    // store portfolio links if provided
    if(body.portfolio_urls && Array.isArray(body.portfolio_urls)){
      const posts = body.portfolio_urls.map(url=> ({
        vendor_id: data.id,
        media_url: url,
        media_type: 'image',
        caption: 'Portfolio upload',
        // Mark portfolio as approved immediately since the vendor is verified.
        approved: true
      }))
      await supabase.from('vendor_portfolio').insert(posts)
    }
    return res.json({ ok:true, vendor: data })
  } catch(e){
    return res.status(401).json({ error: e.message })
  }
}
