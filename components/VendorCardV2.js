'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function VendorCard({ v }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className="card"
      style={{
        padding: 0,
        overflow: 'hidden',
        cursor: 'pointer',
        background: 'white'
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/vendor/${v.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        {/* Image Section */}
        <div style={{
          position: 'relative',
          width: '100%',
          paddingTop: '75%',
          overflow: 'hidden',
          background: 'var(--bg-warm)'
        }}>
          <img
            src={
              v.profile_pic ||
              v.logo ||
              v.banner ||
              'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80'
            }
            alt={v.business_name}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)'
            }}
          />
          {/* Favorite button */}
          <button
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'white'
              e.target.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.9)'
              e.target.style.transform = 'scale(1)'
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        {/* Content Section */}
        <div style={{ padding: 16 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 8
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--text-dark)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {v.business_name}
              </h4>
              <div style={{
                color: 'var(--text-muted)',
                fontSize: 14,
                marginTop: 4
              }}>
                {v.category} · {v.city}
              </div>
            </div>
          </div>

          {/* Rating and Price */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--border-light)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent-gold)" stroke="var(--accent-gold)" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)' }}>
                {v.avg_rating?.toFixed(1) || '4.5'}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--accent-rose)'
              }}>
                {v.price_range?.min ? `₹${v.price_range.min.toLocaleString()}` : 'Price on request'}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
