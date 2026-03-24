'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function VendorCard({ v }) {
  const [isHovered, setIsHovered] = useState(false)

  if (!v || !v.id) return null

  const ratingStr = v.avg_rating ? parseFloat(v.avg_rating).toFixed(1) : null
  const reviewCount = v.review_count || 0

  const serviceDetails = v.service_details || {}
  const servicePricing = v.service_pricing || {}

  const formatINR = (n) => {
    const num = typeof n === 'string' ? Number(n) : n
    if (num === null || num === undefined || num === '' || Number.isNaN(num)) return null
    return num.toLocaleString('en-IN')
  }

  const fmtPrice = (n) => {
    const f = formatINR(n)
    return f ? `₹${f}` : null
  }

  let priceText = 'Price on request'
  const category = v.category || ''

  if (category && servicePricing) {
    if (category === 'Venues') {
      const dayPrice = servicePricing.price_per_day_event
      const platePrice = servicePricing.price_per_plate
      const offersCatering = serviceDetails.venue_offers_catering === true

      if (offersCatering && platePrice) {
        const p = fmtPrice(platePrice)
        if (p) priceText = `${p} per plate`
      } else if (dayPrice) {
        const p = fmtPrice(dayPrice)
        if (p) priceText = `${p} per day / per event`
      }
    }

    if (category === 'Decorators') {
      const p = fmtPrice(servicePricing.starting_decorator_price)
      if (p) priceText = `${p} per event (starting from)`
    }

    if (category === 'Photographers') {
      const pricingType = serviceDetails.photography_pricing_type
      const perFunctionPrice = servicePricing.price_per_function_day
      const packagePrice = servicePricing.package_price

      if (pricingType === 'Package' && packagePrice) {
        const p = fmtPrice(packagePrice)
        if (p) priceText = `${p} package`
      } else if (perFunctionPrice) {
        const p = fmtPrice(perFunctionPrice)
        if (p) priceText = `${p} per function / per day`
      }
    }

    if (category === 'Videographers') {
      const pricingType = serviceDetails.videography_pricing_type
      const perDayPrice = servicePricing.price_per_day_event
      const packagePrice = servicePricing.package_price

      if (pricingType === 'Package' && packagePrice) {
        const p = fmtPrice(packagePrice)
        if (p) priceText = `${p} package`
      } else if (perDayPrice) {
        const p = fmtPrice(perDayPrice)
        if (p) priceText = `${p} per day / per event`
      }
    }

    if (category === 'Makeup Artists') {
      const pricingType = serviceDetails.makeup_pricing_type
      const perPersonPrice = servicePricing.price_per_person
      const bridalPrice = servicePricing.bridal_package_price

      if (pricingType === 'Bridal package' && bridalPrice) {
        const p = fmtPrice(bridalPrice)
        if (p) priceText = `${p} bridal package`
      } else if (perPersonPrice) {
        const p = fmtPrice(perPersonPrice)
        if (p) priceText = `${p} per person`
      }
    }

    if (category === 'Mehendi Artists') {
      const pricingType = serviceDetails.mehendi_pricing_type
      const perHandPrice = servicePricing.price_per_hand
      const bridalPrice = servicePricing.bridal_mehendi_price

      if (pricingType === 'Bridal mehendi' && bridalPrice) {
        const p = fmtPrice(bridalPrice)
        if (p) priceText = `${p} bridal mehendi`
      } else if (perHandPrice) {
        const p = fmtPrice(perHandPrice)
        if (p) priceText = `${p} per hand / per person`
      }
    }

    if (category === 'DJs') {
      const p = fmtPrice(servicePricing.price_per_event_per_night)
      if (p) priceText = `${p} per event / per night`
    }

    if (category === 'Bands') {
      const pricingType = serviceDetails.bands_pricing_type
      const baraatPrice = servicePricing.price_per_baraat
      const eventPrice = servicePricing.price_per_event

      if (pricingType === 'Per baraat' && baraatPrice) {
        const p = fmtPrice(baraatPrice)
        if (p) priceText = `${p} per baraat / per event`
      } else if (eventPrice) {
        const p = fmtPrice(eventPrice)
        if (p) priceText = `${p} per event`
      }
    }

    if (category === 'Choreographers') {
      const pricingType = serviceDetails.choreo_pricing_type
      const songPrice = servicePricing.price_per_song
      const sessionPrice = servicePricing.price_per_session

      if (pricingType === 'Per song' && songPrice) {
        const p = fmtPrice(songPrice)
        if (p) priceText = `${p} per song`
      } else if (sessionPrice) {
        const p = fmtPrice(sessionPrice)
        if (p) priceText = `${p} per session`
      }
    }

    if (category === 'Caterers') {
      const foodType = serviceDetails.caterer_food_type
      const nonVegService = serviceDetails.non_veg_service_available
      const vegPrice = servicePricing.veg_price_per_plate
      const nonVegPrice = servicePricing.non_veg_price_per_plate

      const vegText = vegPrice ? fmtPrice(vegPrice) : null
      const nonVegText = nonVegPrice ? fmtPrice(nonVegPrice) : null

      if ((foodType === 'Both' || nonVegService === true) && vegText && nonVegText) {
        priceText = `${vegText} / ${nonVegText} per plate (veg / non-veg)`
      } else if (foodType === 'Veg' && vegText) {
        priceText = `${vegText} per plate`
      } else if ((foodType === 'Non-Veg' || (nonVegService === true && !vegText)) && nonVegText) {
        priceText = `${nonVegText} per plate`
      } else if (nonVegService === false && vegText) {
        priceText = `${vegText} per plate`
      } else if (vegText && nonVegText) {
        priceText = `${vegText} / ${nonVegText} per plate (veg / non-veg)`
      } else if (vegText) {
        priceText = `${vegText} per plate`
      } else if (nonVegText) {
        priceText = `${nonVegText} per plate`
      }
    }

    if (category === 'Pandits/Priests') {
      const p = fmtPrice(servicePricing.price_per_ceremony_or_day)
      if (p) priceText = `${p} per ceremony / per day`
    }
  }

  // Backward-compatible fallback for older vendors that still only have `price_range`
  if (priceText === 'Price on request' && v.price_range && v.price_range.min !== undefined && v.price_range.min !== null) {
    const min = v.price_range.min
    const max = v.price_range.max
    const p = fmtPrice(min)
    if (p) {
      if (category === 'Venues') priceText = `${p} per day / per event`
      else if (category === 'Decorators') priceText = `${p} per event (starting from)`
      else if (category === 'Photographers') priceText = `${p} per function / per day`
      else if (category === 'Videographers') priceText = `${p} per day / per event`
      else if (category === 'Makeup Artists') priceText = `${p} per person`
      else if (category === 'Mehendi Artists') priceText = `${p} per hand / per person`
      else if (category === 'DJs') priceText = `${p} per event / per night`
      else if (category === 'Bands') priceText = `${p} per event`
      else if (category === 'Choreographers') priceText = `${p} per song`
      else if (category === 'Pandits/Priests') priceText = `${p} per ceremony / per day`
      else if (category === 'Caterers') {
        const pn = fmtPrice(max)
        priceText = pn ? `${p} / ${pn} per plate (veg / non-veg)` : `${p} per plate`
      }
    }
  }

  const imageSrc = v.profile_pic || v.profile_image || v.profile_picture || v.logo || v.banner
    || (v.images && v.images[0])
    || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80'

  return (
    <div
      className="vendor-card-wrapper"
      style={{
        borderRadius: 20,
        overflow: 'hidden',
        background: '#fff',
        border: '1px solid rgba(15, 23, 42, 0.07)',
        boxShadow: isHovered
          ? '0 22px 48px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(233, 30, 99, 0.06)'
          : '0 8px 28px rgba(15, 23, 42, 0.06)',
        cursor: 'pointer',
        transition: 'box-shadow 0.28s ease, transform 0.28s ease, border-color 0.28s ease',
        transform: isHovered ? 'translateY(-6px)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        minWidth: 260,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/vendor/${v.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>

        <div className="vendor-card-image" style={{ position: 'relative', width: '100%', height: 200, overflow: 'hidden', background: 'linear-gradient(145deg, #f8fafc, #fdf2f8)' }}>
          <img
            src={imageSrc}
            alt={v.business_name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.55s cubic-bezier(0.33, 1, 0.68, 1)',
              transform: isHovered ? 'scale(1.06)' : 'scale(1)',
            }}
            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80' }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(15,23,42,0.06) 0%, transparent 42%, rgba(15,23,42,0.5) 100%)',
          }} />

          {v.verified && (
            <div style={{
              position: 'absolute',
              top: 12,
              right: 12,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#14532d',
              background: 'rgba(255,255,255,0.94)',
              padding: '5px 10px',
              borderRadius: 999,
              boxShadow: '0 4px 14px rgba(15,23,42,0.12)',
            }}>
              Verified
            </div>
          )}

          {v.category && (
            <div className="vendor-card-cat-chip" style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              right: 12,
              maxWidth: 'calc(100% - 24px)',
              background: 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(10px)',
              borderRadius: 10,
              padding: '6px 12px',
              fontSize: 10,
              fontWeight: 800,
              color: '#9d174d',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              boxShadow: '0 4px 20px rgba(15,23,42,0.1)',
              border: '1px solid rgba(233,30,99,0.12)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>{v.category}</div>
          )}
        </div>

        <div className="vendor-card-body" style={{ padding: '16px 16px 18px', display: 'flex', flexDirection: 'column', flex: 1, gap: 10 }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <h3 className="vendor-card-title" style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: '#0f172a',
              lineHeight: 1.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              flex: 1,
            }}>{v.business_name}</h3>

            {ratingStr && (
              <div className="vendor-card-rating" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0,
                padding: '4px 10px',
                borderRadius: 999,
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#d97706" stroke="#d97706" strokeWidth="1">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#92400e' }}>{ratingStr}</span>
                {reviewCount > 0 && (
                  <span style={{ fontSize: 11, color: 'rgba(146,64,14,0.75)', fontWeight: 600 }}>({reviewCount})</span>
                )}
              </div>
            )}
          </div>

          {v.city && (
            <div className="vendor-card-location" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'linear-gradient(135deg, rgba(233,30,99,0.1) 0%, rgba(139,92,246,0.12) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#be185d" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{v.city}</span>
            </div>
          )}

          <div style={{
            marginTop: 'auto',
            paddingTop: 12,
            borderTop: '1px solid rgba(15,23,42,0.06)',
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#94a3b8',
              marginBottom: 6,
            }}>
              Pricing
            </div>
            {priceText === 'Price on request' ? (
              <div className="vendor-card-price-val" style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>
                Request a quote
              </div>
            ) : (
              <div style={{
                padding: '10px 12px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(233,30,99,0.06) 0%, rgba(76,29,149,0.06) 100%)',
                border: '1px solid rgba(233,30,99,0.1)',
              }}>
                <div className="vendor-card-price-val" style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>
                  {priceText}
                </div>
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 4,
            fontSize: 12,
            fontWeight: 700,
            color: '#be185d',
            opacity: isHovered ? 1 : 0.85,
          }}>
            View profile
            <span aria-hidden style={{ transform: isHovered ? 'translateX(3px)' : 'none', transition: 'transform 0.2s ease' }}>→</span>
          </div>
        </div>
      </Link>
    </div>
  )
}
