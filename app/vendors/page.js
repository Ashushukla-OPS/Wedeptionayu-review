'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import Footer from '../../components/Footer'
import { useSearchParams } from 'next/navigation'
import VendorCard from '../../components/VendorCard'

const CATEGORIES = [
  'Venues', 'Decorators', 'Photographers', 'Videographers',
  'Makeup Artists', 'Mehendi Artists', 'DJs', 'Bands',
  'Choreographers', 'Caterers', 'Pandits/Priests'
]

const RATING_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: '3.0+', value: '3' },
  { label: '3.5+', value: '3.5' },
  { label: '4.0+', value: '4' },
]

function VendorsContent() {
  const searchParams = useSearchParams()
  const initCategory = searchParams.get('category') || ''
  const initCity = searchParams.get('city') || ''
  const initQ = searchParams.get('q') || ''

  // ── Raw data from API ──
  const [allVendors, setAllVendors] = useState([])   // all fetched vendors
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)

  // ── Filter state ──
  const [selectedCategory, setSelectedCategory] = useState(initCategory)
  const [selectedCity, setSelectedCity] = useState(initCity)
  const [selectedRating, setSelectedRating] = useState('all')
  const [searchInput, setSearchInput] = useState(initQ)
  const [searchQuery, setSearchQuery] = useState(initQ)
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false)
  const cityDropdownRef = useRef(null)
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const categoryDropdownRef = useRef(null)

  // Fetch cities once
  useEffect(() => {
    fetch('/api/cities')
      .then(r => r.json())
      .then(d => setCities(d.cities || []))
      .catch(() => { })
  }, [])

  // Close city dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target)) {
        setCityDropdownOpen(false)
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) {
        setCategoryDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Fetch all vendors whenever category changes (city & rating are filtered client-side for instant response)
  useEffect(() => {
    fetchVendors()
  }, [selectedCategory])

  const fetchVendors = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory) params.set('category', selectedCategory)
      params.set('sort_by', 'popular')
      params.set('limit', '200')   // grab a big batch so we can filter client-side
      const res = await fetch(`/api/vendors?${params}`)
      const data = await res.json()
      if (res.ok) setAllVendors(data.vendors || [])
      else setAllVendors([])
    } catch (e) {
      console.error(e)
      setAllVendors([])
    } finally {
      setLoading(false)
    }
  }

  // ── Client-side filtering (instant, no extra API call) ──
  const filteredVendors = allVendors.filter(v => {
    // City filter
    if (selectedCity && v.city?.toLowerCase() !== selectedCity.toLowerCase()) return false

    // Rating filter
    if (selectedRating !== 'all') {
      const min = parseFloat(selectedRating)
      if (!v.avg_rating || parseFloat(v.avg_rating) < min) return false
    }

    // Search filter (name, city, category)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = v.business_name?.toLowerCase().includes(q)
      const matchCity = v.city?.toLowerCase().includes(q)
      const matchCat = v.category?.toLowerCase().includes(q)
      if (!matchName && !matchCity && !matchCat) return false
    }

    return true
  })

  const handleSearch = (e) => {
    e.preventDefault()
    setSearchQuery(searchInput.trim())
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') setSearchQuery(searchInput.trim())
  }

  const clearAll = () => {
    setSelectedCategory('')
    setSelectedCity('')
    setSelectedRating('all')
    setSearchInput('')
    setSearchQuery('')
  }

  const hasFilters = selectedCategory || selectedCity || selectedRating !== 'all' || searchQuery

  const pageTitle = selectedCategory
    ? selectedCategory
    : searchQuery
      ? `Results for "${searchQuery}"`
      : 'Find Your Perfect Vendors'


  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fc' }}>

      {/* ─── Hero Banner ─── */}
      <div style={{
        background: 'linear-gradient(135deg, #1a0533 0%, #4a0d6b 40%, #be185d 100%)',
        padding: '52px 0 40px',
        position: 'relative',
        zIndex: 100,
      }}>
        {/* Decorative blobs — clipped in their own container */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'absolute', bottom: -80, left: '35%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 2, maxWidth: 1200 }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <Link href="/" style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>Home</Link>
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>›</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
              {selectedCategory || 'All Vendors'}
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            {pageTitle}
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', margin: '0 0 28px' }}>
            {loading ? 'Searching…' : `${filteredVendors.length} vendor${filteredVendors.length !== 1 ? 's' : ''} found`}
            {selectedCity ? ` in ${selectedCity}` : ''}
          </p>

          {/* Search Bar with City Selector */}
          <form className="vendors-search-form" onSubmit={handleSearch} style={{
            background: '#fff', borderRadius: '14px',
            overflow: 'visible', maxWidth: 960, boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}>
            {/* City Selector — Custom Dropdown */}
            <div
              className="search-divider"
              ref={cityDropdownRef}
              style={{ position: 'relative', flexShrink: 0 }}
            >
              <button
                type="button"
                onClick={() => setCityDropdownOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '14px 16px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  minWidth: 160
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#be185d" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>City</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: selectedCity ? '#111827' : '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110 }}>
                    {selectedCity || 'All Cities'}
                  </div>
                </div>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"
                  style={{ transform: cityDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Dropdown Panel */}
              {cityDropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                  minWidth: 220, background: '#fff',
                  borderRadius: '14px', boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
                  border: '1px solid #e5e7eb', zIndex: 9999,
                  maxHeight: 320, overflowY: 'auto',
                  padding: '8px 0'
                }}>
                  {/* All Cities option */}
                  <button
                    type="button"
                    onClick={() => { setSelectedCity(''); setCityDropdownOpen(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '10px 16px', border: 'none',
                      background: !selectedCity ? '#fff0f6' : 'transparent',
                      color: !selectedCity ? '#be185d' : '#374151',
                      fontWeight: !selectedCity ? 700 : 500,
                      fontSize: 14, cursor: 'pointer', textAlign: 'left',
                      borderBottom: '1px solid #f3f4f6'
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    All Cities
                    {!selectedCity && (
                      <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#be185d" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>

                  {cities.map(c => (
                    <button
                      key={c.id || c.name}
                      type="button"
                      onClick={() => { setSelectedCity(c.name); setCityDropdownOpen(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', padding: '10px 16px', border: 'none',
                        background: selectedCity === c.name ? '#fff0f6' : 'transparent',
                        color: selectedCity === c.name ? '#be185d' : '#374151',
                        fontWeight: selectedCity === c.name ? 700 : 400,
                        fontSize: 14, cursor: 'pointer', textAlign: 'left',
                        transition: 'background 0.12s'
                      }}
                      onMouseEnter={e => { if (selectedCity !== c.name) e.currentTarget.style.background = '#fdf2f8' }}
                      onMouseLeave={e => { e.currentTarget.style.background = selectedCity === c.name ? '#fff0f6' : 'transparent' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={selectedCity === c.name ? '#be185d' : '#9ca3af'} strokeWidth="2" strokeLinecap="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                      </svg>
                      {c.name}
                      {selectedCity === c.name && (
                        <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#be185d" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Category Selector — Custom Dropdown */}
            <div
              className="search-divider"
              ref={categoryDropdownRef}
              style={{ position: 'relative', flexShrink: 0 }}
            >
              <button
                type="button"
                onClick={() => setCategoryDropdownOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '14px 16px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  minWidth: 160
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#be185d" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Category</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: selectedCategory ? '#111827' : '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110 }}>
                    {selectedCategory || 'All Categories'}
                  </div>
                </div>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"
                  style={{ transform: categoryDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Dropdown Panel */}
              {categoryDropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                  minWidth: 220, background: '#fff',
                  borderRadius: '14px', boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
                  border: '1px solid #e5e7eb', zIndex: 9999,
                  maxHeight: 320, overflowY: 'auto',
                  padding: '8px 0'
                }}>
                  {/* All Categories option */}
                  <button
                    type="button"
                    onClick={() => { setSelectedCategory(''); setCategoryDropdownOpen(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '10px 16px', border: 'none',
                      background: !selectedCategory ? '#fff0f6' : 'transparent',
                      color: !selectedCategory ? '#be185d' : '#374151',
                      fontWeight: !selectedCategory ? 700 : 500,
                      fontSize: 14, cursor: 'pointer', textAlign: 'left',
                      borderBottom: '1px solid #f3f4f6'
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                    All Categories
                    {!selectedCategory && (
                      <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#be185d" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>

                  {CATEGORIES.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setSelectedCategory(c); setCategoryDropdownOpen(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', padding: '10px 16px', border: 'none',
                        background: selectedCategory === c ? '#fff0f6' : 'transparent',
                        color: selectedCategory === c ? '#be185d' : '#374151',
                        fontWeight: selectedCategory === c ? 700 : 400,
                        fontSize: 14, cursor: 'pointer', textAlign: 'left',
                        transition: 'background 0.12s'
                      }}
                      onMouseEnter={e => { if (selectedCategory !== c) e.currentTarget.style.background = '#fdf2f8' }}
                      onMouseLeave={e => { e.currentTarget.style.background = selectedCategory === c ? '#fff0f6' : 'transparent' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={selectedCategory === c ? '#be185d' : '#9ca3af'} strokeWidth="2" strokeLinecap="round">
                        <path d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      {c}
                      {selectedCategory === c && (
                        <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#be185d" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Text Search */}
            <div className="vendors-search-input-wrap" style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '0 14px', gap: 10 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search by vendor name or category…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  fontSize: 14, color: '#111827', padding: '16px 0', background: 'transparent'
                }}
              />
              {searchInput && (
                <button type="button"
                  onClick={() => { setSearchInput(''); setSearchQuery('') }}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
              )}
            </div>

            <button type="submit" style={{
              background: 'linear-gradient(135deg, #e91e63, #be185d)',
              color: '#fff', border: 'none', padding: '0 28px',
              fontWeight: 700, fontSize: 15, cursor: 'pointer',
              borderRadius: '0 14px 14px 0', letterSpacing: '0.02em',
              flexShrink: 0
            }}>Search</button>
          </form>
        </div>
      </div>

      {/* ─── Horizontal Filter Bar ─── */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #eaeaea',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        <div className="container" style={{ maxWidth: 1200 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 0,
            overflowX: 'auto', scrollbarWidth: 'none', padding: '12px 0',
          }} className="hide-scrollbar">

            {/* Filter Icon + Label */}
            <div style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
              paddingRight: 16, borderRight: '1px solid #f0f0f0', marginRight: 16,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>Filter</span>
            </div>

            {/* ── Removed Category Pills and City Filters from here as per user request ── */}

            {/* ── Rating Pills ── */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>Rating</span>
              {RATING_OPTIONS.map(opt => (
                <button key={opt.value}
                  onClick={() => setSelectedRating(opt.value === selectedRating ? 'all' : opt.value)}
                  style={{
                    flexShrink: 0, padding: '7px 14px', borderRadius: '20px',
                    border: selectedRating === opt.value ? '2px solid #f59e0b' : '1.5px solid #e5e7eb',
                    background: selectedRating === opt.value ? '#fffbeb' : '#fff',
                    color: selectedRating === opt.value ? '#b45309' : '#6b7280',
                    fontWeight: selectedRating === opt.value ? 700 : 500,
                    fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 4
                  }}>
                  {opt.value !== 'all' && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  )}
                  {opt.label}
                </button>
              ))}
            </div>

            {/* ── Clear All ── */}
            {hasFilters && (
              <>
                <div style={{ width: 1, height: 30, background: '#e5e7eb', flexShrink: 0, margin: '0 16px' }} />
                <button onClick={clearAll} style={{
                  flexShrink: 0, padding: '7px 14px', borderRadius: '20px',
                  border: '1.5px solid #fee2e2', background: '#fff5f5',
                  color: '#ef4444', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4
                }}>× Clear all</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Active filter summary ─── */}
      {hasFilters && (
        <div className="container" style={{ maxWidth: 1200, padding: '16px 20px 0' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Showing:</span>
            {selectedCategory && <span style={{ padding: '4px 12px', background: '#fff0f6', color: '#be185d', borderRadius: '12px', fontSize: 13, fontWeight: 600 }}>{selectedCategory}</span>}
            {selectedCity && <span style={{ padding: '4px 12px', background: '#fff0f6', color: '#be185d', borderRadius: '12px', fontSize: 13, fontWeight: 600 }}>📍 {selectedCity}</span>}
            {selectedRating !== 'all' && <span style={{ padding: '4px 12px', background: '#fffbeb', color: '#b45309', borderRadius: '12px', fontSize: 13, fontWeight: 600 }}>★ {selectedRating}+ Rating</span>}
            {searchQuery && <span style={{ padding: '4px 12px', background: '#f3f4f6', color: '#374151', borderRadius: '12px', fontSize: 13, fontWeight: 600 }}>🔍 "{searchQuery}"</span>}
            <span style={{ fontSize: 13, color: '#9ca3af' }}>— {filteredVendors.length} result{filteredVendors.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* ─── Vendor Grid ─── */}
      <div className="container" style={{ maxWidth: 1200, padding: '28px 20px 60px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <div style={{
              width: 44, height: 44, margin: '0 auto 20px',
              border: '4px solid #f3f4f6', borderTop: '4px solid #e91e63',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ color: '#9ca3af', fontSize: 15 }}>Finding the best vendors for you…</p>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            background: '#fff', borderRadius: '20px', border: '1px solid #eaeaea',
            maxWidth: 480, margin: '0 auto'
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, #fff0f6, #fce7f3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: 32
            }}>🔍</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>No vendors found</h3>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 28, lineHeight: 1.6 }}>
              Try adjusting your filters, changing the city, or using a different search term.
            </p>
            <button onClick={clearAll} style={{
              background: 'linear-gradient(135deg, #e91e63, #be185d)',
              color: '#fff', border: 'none', borderRadius: '12px',
              padding: '12px 32px', fontSize: 14, fontWeight: 700, cursor: 'pointer'
            }}>Browse All Vendors</button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 24
          }}>
            {filteredVendors.map(vendor =>
              vendor && vendor.id ? <VendorCard key={vendor.id} v={vendor} /> : null
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <Footer />
    </div>
  )
}

export default function VendorsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#9ca3af' }}>Loading vendors…</p>
      </div>
    }>
      <VendorsContent />
    </Suspense>
  )
}
