'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const AVAILABLE_CATEGORIES = [
  'Venues',
  'Decorators',
  'Photographers',
  'Videographers',
  'Makeup Artists',
  'Mehendi Artists',
  'DJs',
  'Bands',
  'Choreographers',
  'Caterers',
  'Pandits/Priests',
]

export default function Hero({ selectedCity: propSelectedCity, onCityChange }) {
  const router = useRouter()
  const [cities, setCities] = useState([])
  const [selectedCity, setSelectedCity] = useState(propSelectedCity || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [cityOpen, setCityOpen] = useState(false)
  const cityRef = useRef(null)

  useEffect(() => {
    fetch('/api/cities')
      .then(r => r.json())
      .then(d => setCities(d.cities || []))
      .catch(() => { })
  }, [])

  useEffect(() => {
    if (propSelectedCity !== undefined) setSelectedCity(propSelectedCity)
  }, [propSelectedCity])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (cityRef.current && !cityRef.current.contains(e.target)) setCityOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleCitySelect = (cityName) => {
    setSelectedCity(cityName)
    setCityOpen(false)
    if (onCityChange) onCityChange(cityName)
  }



  const handleSearch = () => {
    const params = new URLSearchParams()
    if (selectedCity) params.set('city', selectedCity)
    if (searchQuery) params.set('q', searchQuery)
    router.push(`/vendors?${params.toString()}`)
  }

  return (
    <section className="hero-container" style={{
      position: 'relative',
      padding: '60px 0 40px',
      minHeight: '380px',
      display: 'flex',
      alignItems: 'center',
    }}>
      {/* Background Image */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1600&q=85&auto=format&fit=crop)',
        backgroundSize: 'cover',
        backgroundPosition: 'center 40%',
        zIndex: 0
      }} />
      {/* Dark overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(160deg, rgba(15,8,12,0.85) 0%, rgba(35,10,20,0.85) 50%, rgba(10,5,10,0.95) 100%)',
        zIndex: 1
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="hero-title"
            style={{
              fontSize: 'clamp(32px, 5vw, 56px)',
              margin: '0 0 16px',
              lineHeight: 1.15,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#fff',
            }}
          >
            Find The Perfect Wedding and Event Vendors
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="hero-subtitle"
            style={{
              fontSize: 'clamp(15px, 1.8vw, 18px)',
              color: 'rgba(255,255,255,0.9)',
              lineHeight: 1.5,
              marginBottom: 32,
              fontWeight: 400,
              maxWidth: 600,
              margin: '0 auto 32px'
            }}
          >
            Discover and book top-rated professionals for your dream event.
          </motion.p>

          {/* Search Card - Solid White for max visibility */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hero-search-card"
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '8px',
              display: 'flex',
              gap: 8,
              alignItems: 'stretch',
              maxWidth: 700,
              margin: '0 auto 24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }}
          >
            {/* City Dropdown */}
            <div ref={cityRef} style={{ flex: 1, position: 'relative' }}>
              <button
                className="city-picker-btn"
                onClick={() => { setCityOpen(o => !o) }}
                style={{
                  width: '100%',
                  background: cityOpen ? '#f9fafb' : '#fff',
                  border: '1px solid transparent',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                  minHeight: 52
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#be185d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>City</div>
                  <div className="city-name" style={{ fontSize: 15, color: '#111827', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedCity || 'All Cities'}
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, transform: cityOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {cityOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
                  background: '#fff', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                  zIndex: 100, maxHeight: 240, overflowY: 'auto', border: '1px solid #e5e7eb'
                }}>
                  <div
                    onClick={() => handleCitySelect('')}
                    style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 14, color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >All Cities</div>
                  {cities.map(city => (
                    <div
                      key={city.id}
                      onClick={() => handleCitySelect(city.name)}
                      style={{
                        padding: '10px 14px', cursor: 'pointer', fontSize: 14,
                        color: selectedCity === city.name ? '#be185d' : '#111827',
                        fontWeight: selectedCity === city.name ? 600 : 400,
                        background: selectedCity === city.name ? '#fff5f7' : '#fff',
                        borderBottom: '1px solid #f3f4f6',
                        display: 'flex', alignItems: 'center', gap: 8
                      }}
                      onMouseEnter={e => { if (selectedCity !== city.name) e.currentTarget.style.background = '#fdf2f8' }}
                      onMouseLeave={e => { e.currentTarget.style.background = selectedCity === city.name ? '#fff5f7' : '#fff' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={selectedCity === city.name ? "#be185d" : "#6b7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      {city.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="hero-search-divider" style={{ width: 1, background: '#e5e7eb', flexShrink: 0, margin: '8px 0' }} />

            {/* Search Input */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: 14 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#be185d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <input
                type="text"
                className="search-input"
                placeholder="Search vendors by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                style={{
                  width: '100%',
                  background: '#fff',
                  border: '1px solid transparent',
                  borderRadius: '10px',
                  padding: '10px 14px 10px 44px',
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#111827',
                  outline: 'none',
                  minHeight: 52
                }}
              />
            </div>

            {/* Search Button */}
            <button
              className="search-btn"
              onClick={handleSearch}
              style={{
                padding: '0 24px',
                background: '#e91e63',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#c2185b' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#e91e63' }}
            >
              Search
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
