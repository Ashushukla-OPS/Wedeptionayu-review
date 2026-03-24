'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const POPULAR_CATEGORIES = [
  {
    name: 'Venues',
    image: 'https://images.unsplash.com/photo-1733135686386-125ad17182c9?q=80&w=1065&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    color: 'linear-gradient(135deg,#fce7f3,#ede9fe)'
  },
  {
    name: 'Decorators',
    image: 'https://i.pinimg.com/736x/7c/6c/1b/7c6c1beda6f0e2d58e5f1f102537164e.jpg',
    color: 'linear-gradient(135deg,#fdf2f8,#fce7f3)'
  },
  {
    name: 'Photographers',
    image: 'https://i.pinimg.com/736x/0e/42/ce/0e42ce5b4bdcfdb26a9b8636eb3b8f78.jpg',
    color: 'linear-gradient(135deg,#ede9fe,#dbeafe)'
  },
  {
    name: 'Videographers',
    image: 'https://i.pinimg.com/1200x/25/88/23/2588234ed53ce2082d1e2a9c258b1c6e.jpg',
    color: 'linear-gradient(135deg,#dbeafe,#e0f2fe)'
  },
  {
    name: 'Makeup Artists',
    image: 'https://i.pinimg.com/736x/3d/5a/bc/3d5abc436b11d613108e6e16a842aadf.jpg',
    color: 'linear-gradient(135deg,#fce7f3,#fdf4ff)'
  },
  {
    name: 'Mehendi Artists',
    image: 'https://i.pinimg.com/736x/f7/8e/1d/f78e1d1b1356d3ae07ac397e7e710ea4.jpg',
    color: 'linear-gradient(135deg,#dcfce7,#d1fae5)'
  },
  {
    name: 'DJs',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&q=80',
    color: 'linear-gradient(135deg,#ede9fe,#fce7f3)'
  },
  {
    name: 'Bands',
    image: 'https://i.pinimg.com/1200x/09/f8/da/09f8da23f49f911cfa7aa204cbd17f18.jpg',
    color: 'linear-gradient(135deg,#fef3c7,#fde68a)'
  },
  {
    name: 'Choreographers',
    image: 'https://i.pinimg.com/1200x/fc/8f/71/fc8f71a1b795448b5880ae9d46fc0dcc.jpg',
    color: 'linear-gradient(135deg,#fce7f3,#ffe4e6)'
  },
  {
    name: 'Caterers',
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=500&q=80',
    color: 'linear-gradient(135deg,#fef9c3,#fef3c7)'
  },
  {
    name: 'Pandits/Priests',
    image: 'https://i.pinimg.com/736x/21/cf/69/21cf6900f0c4e0cacad061626f2f9c80.jpg',
    color: 'linear-gradient(135deg,#fef3c7,#ffedd5)'
  },
]

export default function PopularSearches({ selectedCity }) {
  const locationName = selectedCity || ''

  return (
    <section className="home-section" style={{
      background: 'linear-gradient(180deg,#fff 0%,#fdf2f8 100%)'
    }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#fff0f6', border: '1px solid #fce7f3',
              borderRadius: '999px', padding: '5px 16px', marginBottom: 14
            }}>
              <span style={{ fontSize: 14 }}>🔍</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#be185d', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Explore</span>
            </div>
            <h2 className="home-section-title" style={{
              fontSize: 'clamp(26px, 3.5vw, 38px)',
              color: '#111827',
              margin: '0 0 12px',
            }}>
              Popular Searches
            </h2>
            <p className="home-section-subtitle" style={{ fontSize: 16, color: '#6b7280', margin: 0 }}>
              Find the best Event vendors across every category
              {locationName ? ` in ${locationName}` : ''}
            </p>
          </div>

          {/* Horizontal Scroll Row */}
          <div style={{
            display: 'flex',
            gap: 16,
            overflowX: 'auto',
            paddingBottom: 24,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollSnapType: 'x mandatory'
          }} className="hide-scrollbar">
            {POPULAR_CATEGORIES.map((cat, idx) => (
              <Link
                key={cat.name}
                href={`/vendors?category=${encodeURIComponent(cat.name)}${locationName ? `&city=${encodeURIComponent(locationName)}` : ''}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.38, delay: idx * 0.04 }}
                  style={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: '#fff',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                    border: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    flex: '0 0 auto',
                    width: '180px',
                    scrollSnapAlign: 'start'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 16px 40px rgba(190,24,93,0.14)'
                    e.currentTarget.style.borderColor = '#fce7f3'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(17,24,39,0.06)'
                    e.currentTarget.style.borderColor = '#f3f4f6'
                  }}
                >
                  {/* Image area */}
                  <div style={{
                    width: '100%',
                    height: '130px',
                    position: 'relative',
                    overflow: 'hidden',
                    background: cat.color
                  }}>
                    <img
                      src={cat.image}
                      alt={cat.name}
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        transition: 'transform 0.4s ease'
                      }}
                      onMouseEnter={e => e.target.style.transform = 'scale(1.1)'}
                      onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                      onError={e => { e.target.style.display = 'none' }}
                    />
                    {/* Overlay gradient */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.35) 100%)'
                    }} />
                    {/* Icon badge */}
                    <div style={{
                      position: 'absolute', top: 10, left: 10,
                      width: 32, height: 32,
                      background: 'rgba(255,255,255,0.88)',
                      backdropFilter: 'blur(6px)',
                      borderRadius: '10px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                    }}>
                      {cat.icon}
                    </div>
                  </div>

                  {/* Label */}
                  <div style={{ padding: '12px 14px 14px' }}>
                    <div style={{
                      fontSize: 14, fontWeight: 700, color: '#111827',
                      marginBottom: 3, lineHeight: 1.2
                    }}>
                      {cat.name}
                    </div>
                    <div style={{
                      fontSize: 12, color: '#e91e63', fontWeight: 500,
                      display: 'flex', alignItems: 'center', gap: 3
                    }}>
                      Explore
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
