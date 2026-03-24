'use client'

import { useState, useEffect } from 'react'
import Footer from '../../components/Footer'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  getCompareIds,
  setCompareIds,
  getCompareCategory,
  setCompareCategory,
  tryToggleCompareVendor,
  clearCompareStorage,
  COMPARE_IDS_KEY,
  COMPARE_CATEGORY_KEY
} from '../../lib/compare-storage'

export default function ComparePage() {
  const [selectedVendors, setSelectedVendors] = useState([])
  const [vendorsToCompare, setVendorsToCompare] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [trendingVendors, setTrendingVendors] = useState([])
  const [loadingTrending, setLoadingTrending] = useState(true)
  const [showVendorModal, setShowVendorModal] = useState(false)
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [cities, setCities] = useState([])
  const [selectedLocation, setSelectedLocation] = useState('')
  const [vendorsList, setVendorsList] = useState([])
  const [loadingVendors, setLoadingVendors] = useState(false)
  const [selectedCardIndex, setSelectedCardIndex] = useState(null)
  const [compareNow, setCompareNow] = useState(false)
  const [compareCategoryLock, setCompareCategoryLock] = useState('')

  useEffect(() => {
    const vendorIds = getCompareIds()
    const storedCompareNow = localStorage.getItem('compareNow')
    if (vendorIds.length > 0) {
      const clamped = vendorIds.slice(0, 3)
      if (clamped.length !== vendorIds.length) {
        setCompareIds(clamped)
      }
      setSelectedVendors(clamped)
      setCompareCategoryLock(getCompareCategory())
      // Check if comparison was previously started
      if (storedCompareNow === 'true' && clamped.length >= 2) {
        setCompareNow(true)
        fetchVendors(clamped, { includeDetails: true })
      } else {
        // We still fetch lightweight vendor details so selected cards are visible.
        fetchVendors(clamped, { includeDetails: false })
        setCompareNow(false)
        localStorage.setItem('compareNow', 'false')
      }
    } else {
      setLoading(false)
      setCompareNow(false)
      setSelectedVendors([])
      setVendorsToCompare([])
      localStorage.setItem('compareNow', 'false')
    }
    fetchTrendingVendors()
    fetchCategories()
    fetchCities()

    const onStorage = (e) => {
      if (e.key !== COMPARE_IDS_KEY && e.key !== COMPARE_CATEGORY_KEY && e.key !== 'compareNow') return
      const ids = getCompareIds()
      const clamped = ids.slice(0, 3)
      if (clamped.length !== ids.length) {
        setCompareIds(clamped)
      }
      setSelectedVendors(clamped)
      setCompareCategoryLock(getCompareCategory())
      const cn = localStorage.getItem('compareNow') === 'true'
      if (cn && clamped.length >= 2) {
        setCompareNow(true)
        fetchVendors(clamped, { includeDetails: true })
      } else {
        setCompareNow(false)
        if (clamped.length > 0) {
          fetchVendors(clamped, { includeDetails: false })
        } else {
          setVendorsToCompare([])
          setLoading(false)
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const clearCompare = () => {
    clearCompareStorage()
    setSelectedVendors([])
    setCompareNow(false)
    setVendorsToCompare([])
    setCompareCategoryLock('')
    setError(null)
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (response.ok && data.categories) {
        setCategories(data.categories)
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  const fetchCities = async () => {
    try {
      const response = await fetch('/api/cities')
      const data = await response.json()
      if (response.ok && data.cities) {
        // Filter only Madhya Pradesh cities
        const mpCities = data.cities.filter(city =>
          city.state === 'Madhya Pradesh' || !city.state
        )
        // Sort cities alphabetically
        mpCities.sort((a, b) => a.name.localeCompare(b.name))
        setCities(mpCities)
      }
    } catch (err) {
      console.error('Failed to fetch cities:', err)
    }
  }

  const fetchTrendingVendors = async () => {
    try {
      setLoadingTrending(true)
      const response = await fetch('/api/vendors?sort_by=popular&limit=10')
      const data = await response.json()
      if (response.ok && data.vendors) {
        setTrendingVendors(data.vendors.slice(0, 5)) // Get top 5 trending
      }
    } catch (err) {
      console.error('Failed to fetch trending vendors:', err)
    } finally {
      setLoadingTrending(false)
    }
  }

  const handleAddToCompare = (vendorId, vendorCategory) => {
    const result = tryToggleCompareVendor(vendorId, vendorCategory)
    if (!result.ok) {
      alert(result.error)
      return
    }
    setCompareCategoryLock(getCompareCategory())
    setSelectedVendors(result.ids)
    if (result.removed) {
      if (result.ids.length < 2) {
        setCompareNow(false)
        setVendorsToCompare([])
        setLoading(false)
        localStorage.setItem('compareNow', 'false')
        if (result.ids.length === 0) setError(null)
      } else if (compareNow) {
        fetchVendors(result.ids, { includeDetails: true })
      } else {
        fetchVendors(result.ids, { includeDetails: false })
      }
    } else {
      if (compareNow && result.ids.length >= 2) {
        fetchVendors(result.ids, { includeDetails: true })
      } else {
        fetchVendors(result.ids, { includeDetails: false })
      }
    }
  }

  const handleCompareNow = () => {
    if (selectedVendors.length >= 2) {
      setCompareNow(true)
      localStorage.setItem('compareNow', 'true')
      fetchVendors(selectedVendors, { includeDetails: true })
    } else {
      alert('Please select at least 2 vendors to compare.')
    }
  }

  const handleOpenVendorModal = (cardIndex) => {
    setSelectedCardIndex(cardIndex)
    setShowVendorModal(true)
    const locked = getCompareCategory()
    if (locked) {
      setSelectedCategory(locked)
      setSelectedLocation('')
      fetchVendorsByFilters(locked, '')
    } else {
      setSelectedCategory('')
      setSelectedLocation('')
      setVendorsList([])
    }
  }

  const handleCloseVendorModal = () => {
    setShowVendorModal(false)
    setSelectedCardIndex(null)
    setSelectedCategory('')
    setSelectedLocation('')
    setVendorsList([])
  }

  const fetchVendorsByFilters = async (category, location) => {
    if (!category) {
      setVendorsList([])
      return
    }

    setLoadingVendors(true)
    try {
      let url = `/api/vendors?category=${encodeURIComponent(category)}&limit=50`
      if (location && location !== 'All') {
        url += `&city=${encodeURIComponent(location)}`
      }

      const response = await fetch(url)
      const data = await response.json()
      if (response.ok && data.vendors) {
        // Filter out already selected vendors
        const selectedIds = getCompareIds()
        const filtered = data.vendors.filter(v => !selectedIds.includes(v.id))
        setVendorsList(filtered)
      }
    } catch (err) {
      console.error('Failed to fetch vendors:', err)
    } finally {
      setLoadingVendors(false)
    }
  }

  const handleCategoryChange = async (categoryName) => {
    if (compareCategoryLock && categoryName && categoryName !== compareCategoryLock) {
      alert(`Your compare list is for "${compareCategoryLock}" vendors only. Clear compare to choose a different category.`)
      return
    }
    setSelectedCategory(categoryName)
    fetchVendorsByFilters(categoryName, selectedLocation)
  }

  const handleLocationChange = async (locationName) => {
    setSelectedLocation(locationName)
    if (selectedCategory) {
      fetchVendorsByFilters(selectedCategory, locationName)
    }
  }

  const handleSelectVendorFromModal = (vendorId) => {
    const row = vendorsList.find((x) => x.id === vendorId)
    handleAddToCompare(vendorId, row?.category)
    handleCloseVendorModal()
  }

  const fetchVendors = async (vendorIds, { includeDetails } = { includeDetails: true }) => {
    setLoading(true)
    setError(null)
    try {
      const idsParam = vendorIds.join(',')
      const response = await fetch(`/api/compare?ids=${idsParam}`)
      const data = await response.json()

      if (response.ok && data.vendors) {
        const cats = [...new Set((data.vendors || []).map((v) => v.category).filter(Boolean))]
        if (cats.length > 1) {
          setError('These vendors belong to different categories. You can only compare vendors from the same category. Please clear your list and try again.')
          setVendorsToCompare([])
          setCompareNow(false)
          localStorage.setItem('compareNow', 'false')
          return
        }
        if (cats.length === 1) {
          setCompareCategoryLock(cats[0])
          setCompareCategory(cats[0])
        }
        if (!includeDetails) {
          // Lightweight vendor objects (enough to render selected cards)
          setVendorsToCompare(data.vendors || [])
        } else {
          // Fetch additional data like reviews and portfolio count
          const vendorsWithDetails = await Promise.all(
            data.vendors.map(async (vendor) => {
              // Fetch reviews for rating
              const reviewsRes = await fetch(`/api/vendor/reviews?vendor_id=${vendor.id}`)
              const reviewsData = reviewsRes.ok ? await reviewsRes.json() : { reviews: [] }
              const reviews = reviewsData.reviews || []
              const review_count = reviews.length
              const avg_rating = review_count > 0
                ? parseFloat((reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / review_count).toFixed(1))
                : null

              // Fetch portfolio count
              const portfolioRes = await fetch(`/api/vendor/portfolio?vendor_id=${vendor.id}`)
              const portfolioData = portfolioRes.ok ? await portfolioRes.json() : { portfolio: [] }
              const portfolio_count = portfolioData.portfolio?.length || 0

              // Parse price_range if it's a string
              let priceRange = null
              if (vendor.price_range) {
                if (typeof vendor.price_range === 'string') {
                  try {
                    priceRange = JSON.parse(vendor.price_range)
                  } catch {
                    // If parsing fails, try to extract numbers
                    const matches = vendor.price_range.match(/(\d+)/g)
                    if (matches && matches.length >= 2) {
                      priceRange = { min: parseInt(matches[0]), max: parseInt(matches[1]) }
                    }
                  }
                } else {
                  priceRange = vendor.price_range
                }
              }

              // Format experience
              const experience = vendor.years_experience
                ? `${vendor.years_experience}+ years`
                : 'Not specified'

              return {
                ...vendor,
                price_range: priceRange,
                avg_rating,
                review_count,
                portfolio_count,
                experience,
                response_time: 'Contact for details',
                features: vendor.other_services
                  ? (typeof vendor.other_services === 'string'
                    ? vendor.other_services.split(',').map(s => s.trim()).filter(Boolean)
                    : Array.isArray(vendor.other_services) ? vendor.other_services : [])
                  : []
              }
            })
          )
          setVendorsToCompare(vendorsWithDetails)
        }
      } else {
        const errorMsg = data.error || 'Failed to fetch vendors'
        console.error('API Error:', errorMsg)
        setError(errorMsg)
      }
    } catch (err) {
      console.error('Error fetching vendors:', err)
      setError(err.message || 'Failed to load vendors for comparison. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const comparisonFields = [
    {
      label: 'Price Range',
      key: 'price_range',
      format: (v) => v.price_range?.min && v.price_range?.max
        ? `₹${v.price_range.min.toLocaleString()} - ₹${v.price_range.max.toLocaleString()}`
        : 'Contact for pricing'
    },
    {
      label: 'Rating',
      key: 'avg_rating',
      format: (v) => v.avg_rating
        ? `${v.avg_rating} ⭐ (${v.review_count} reviews)`
        : 'No ratings yet'
    },
    {
      label: 'Experience',
      key: 'experience',
      format: (v) => v.experience || 'Not specified'
    },
    {
      label: 'Portfolio',
      key: 'portfolio_count',
      format: (v) => `${v.portfolio_count} ${v.portfolio_count === 1 ? 'project' : 'projects'}`
    },
    {
      label: 'Response Time',
      key: 'response_time',
      format: (v) => v.response_time || 'Contact for details'
    },
    {
      label: 'Verified',
      key: 'verified',
      format: (v) => v.verified ? '✓ Verified' : 'Not Verified'
    },
  ]

  // Highlight best values to make differences clear.
  const bestStartingPriceMin = (() => {
    const mins = (vendorsToCompare || [])
      .map((v) => v?.price_range?.min)
      .filter((n) => typeof n === 'number')
    return mins.length ? Math.min(...mins) : null
  })()

  const bestAvgRating = (() => {
    const ratings = (vendorsToCompare || [])
      .map((v) => v?.avg_rating)
      .filter((n) => typeof n === 'number')
    return ratings.length ? Math.max(...ratings) : null
  })()

  const bestFeatureCount = (() => {
    return Math.max(
      0,
      ...(vendorsToCompare || []).map((v) => (Array.isArray(v?.features) ? v.features.length : 0))
    )
  })()

  const removeFromCompare = (vendorId) => {
    const updated = getCompareIds().filter((id) => id !== vendorId)
    setCompareIds(updated)
    setCompareCategoryLock(getCompareCategory())
    setSelectedVendors(updated)
    // If less than 2 vendors, stop comparison
    if (updated.length < 2) {
      setCompareNow(false)
      setVendorsToCompare([])
      setLoading(false)
      localStorage.setItem('compareNow', 'false')
    } else if (compareNow) {
      // If comparison is active and 2+ vendors remain, refresh comparison
      fetchVendors(updated, { includeDetails: true })
    } else {
      fetchVendors(updated, { includeDetails: false })
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>Loading vendors...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #fff5f8 0%, #faf8ff 35%, #ffffff 70%)',
    }}>
      {/* Hero Section - Premium, breathable */}
      <section style={{
        padding: '36px 0 28px',
        background: 'transparent',
      }}>
        <div className="container" style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 48px)',
              fontWeight: 800,
              marginBottom: 12,
              color: '#1f2937',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
            }}>
              Compare Vendors
            </h1>
            <p style={{
              fontSize: 'clamp(15px, 1.6vw, 17px)',
              color: 'rgba(31, 41, 55, 0.55)',
              maxWidth: '560px',
              lineHeight: 1.6,
              marginBottom: 4,
            }}>
              Side-by-side comparison to help you make the best choice
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14, alignItems: 'center' }}>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#6b21a8',
                background: 'linear-gradient(135deg, rgba(107,33,168,0.1) 0%, rgba(233,30,99,0.08) 100%)',
                border: '1px solid rgba(107,33,168,0.2)',
                padding: '6px 12px',
                borderRadius: 999,
              }}>
                Same category only
              </span>
              {compareCategoryLock ? (
                <span style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#be185d',
                  background: 'rgba(190,24,93,0.08)',
                  border: '1px solid rgba(190,24,93,0.2)',
                  padding: '6px 12px',
                  borderRadius: 999,
                }}>
                  List: {compareCategoryLock}
                </span>
              ) : null}
            </div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginTop: 20 }}>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                Selected: <strong style={{ color: 'var(--text-dark)' }}>{selectedVendors.length}</strong> / 3
              </div>
              {selectedVendors.length > 0 && (
                <button
                  onClick={clearCompare}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    background: 'white',
                    color: 'var(--text-dark)',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Clear compare
                </button>
              )}
              {!compareNow && selectedVendors.length >= 2 && (
                <button
                  onClick={handleCompareNow}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  Compare now
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Comparison Table */}
      <section style={{ padding: '24px 0 48px' }}>
        <div className="container" style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px' }}>
          {error ? (
            <div className="card" style={{
              padding: '60px 40px',
              textAlign: 'center',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              <div style={{ fontSize: 48, marginBottom: 24 }}>⚠️</div>
              <h2 style={{
                fontSize: 24,
                fontWeight: 600,
                marginBottom: 12,
                color: 'var(--text-dark)'
              }}>
                Error Loading Vendors
              </h2>
              <p style={{
                fontSize: 16,
                color: 'var(--text-muted)',
                marginBottom: 32
              }}>
                {error}
              </p>
              <Link href="/vendors" className="btn-primary">
                Browse Vendors
              </Link>
            </div>
          ) : !compareNow || vendorsToCompare.length < 2 ? (
            <div className="compare-layout-grid">
              {/* Left Sidebar - Quick Select (lighter, refined card) */}
              <div className="quick-select-sidebar" style={{
                background: 'linear-gradient(165deg, rgba(255,255,255,0.95) 0%, rgba(255,250,252,0.9) 50%, rgba(248,245,255,0.85) 100%)',
                borderRadius: 20,
                padding: '24px 20px',
                boxShadow: '0 12px 40px rgba(15,23,42,0.08), 0 0 0 1px rgba(233,30,99,0.06)',
                height: 'fit-content',
                position: 'sticky',
                top: 88,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <h2 style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#1f2937',
                    margin: 0,
                  }}>
                    Quick Select
                  </h2>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#E91E63',
                    background: 'linear-gradient(135deg, rgba(233,30,99,0.12) 0%, rgba(212,175,55,0.1) 100%)',
                    padding: '4px 10px',
                    borderRadius: 999,
                    letterSpacing: '0.04em',
                  }}>
                    TRENDING
                  </span>
                </div>
                <p style={{
                  fontSize: 13,
                  color: 'rgba(31,41,55,0.6)',
                  marginBottom: 18,
                  lineHeight: 1.4,
                }}>
                  Popular vendors to add
                </p>
                {loadingTrending ? (
                  <div style={{ color: 'rgba(31,41,55,0.6)', textAlign: 'center', padding: '24px 0' }}>
                    Loading...
                  </div>
                ) : trendingVendors.length === 0 ? (
                  <div style={{ color: 'rgba(31,41,55,0.5)', textAlign: 'center', padding: '24px 0', fontSize: 14 }}>
                    No trending vendors available
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {trendingVendors.map((vendor) => {
                      const isSelected = selectedVendors.includes(vendor.id)
                      return (
                        <div
                          key={vendor.id}
                          style={{
                            background: isSelected ? 'rgba(233,30,99,0.08)' : 'rgba(255,255,255,0.8)',
                            borderRadius: 14,
                            padding: '12px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            border: isSelected ? '2px solid rgba(233,30,99,0.4)' : '1px solid rgba(15,23,42,0.06)',
                            position: 'relative',
                            boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(255,255,255,1)'
                              e.currentTarget.style.boxShadow = '0 4px 16px rgba(233,30,99,0.12)'
                              e.currentTarget.style.borderColor = 'rgba(233,30,99,0.2)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.8)'
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(15,23,42,0.04)'
                              e.currentTarget.style.borderColor = 'rgba(15,23,42,0.06)'
                            }
                          }}
                          onClick={() => handleAddToCompare(vendor.id, vendor.category)}
                        >
                          {isSelected && (
                            <div style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #E91E63, #C2185B)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              color: 'white',
                            }}>
                              ✓
                            </div>
                          )}
                          <img
                            src={vendor.logo || vendor.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.business_name || 'V')}&size=80&background=E91E63&color=fff&bold=true`}
                            alt=""
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 12,
                              objectFit: 'cover',
                              flexShrink: 0,
                            }}
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.business_name || 'V')}&size=80&background=E91E63&color=fff&bold=true`
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: '#1f2937',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {vendor.business_name}
                            </div>
                            <div style={{
                              fontSize: 12,
                              color: 'rgba(31,41,55,0.6)',
                              marginTop: 2
                            }}>
                              {vendor.city}
                            </div>
                          </div>
                          <button
                            style={{
                              background: isSelected
                                ? 'linear-gradient(135deg, #E91E63, #C2185B)'
                                : 'rgba(233,30,99,0.1)',
                              color: isSelected ? 'white' : '#E91E63',
                              border: 'none',
                              borderRadius: 10,
                              padding: '6px 12px',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              whiteSpace: 'nowrap'
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAddToCompare(vendor.id, vendor.category)
                            }}
                          >
                            {isSelected ? 'Added' : 'Add'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Right Content - Vendor Selection Cards (5 slots, balanced grid) */}
              <div>
                <p style={{
                  fontSize: 14,
                  color: 'rgba(31,41,55,0.65)',
                  marginBottom: 20,
                  lineHeight: 1.55,
                }}>
                  Select 2–3 vendors from the <strong>same category</strong> for a meaningful comparison. Click a slot to add.
                </p>
                <div className="compare-slots-grid">
                  {[0, 1, 2].map((index) => {
                    const vendorId = selectedVendors[index]
                    const vendor = vendorsToCompare.find(v => v.id === vendorId) ||
                      trendingVendors.find(v => v.id === vendorId)

                    if (vendor) {
                      return (
                        <div
                          key={vendor.id}
                          style={{
                            background: 'white',
                            borderRadius: 'var(--radius-lg)',
                            padding: '24px',
                            boxShadow: 'var(--shadow-md)',
                            border: '2px solid #E91E63',
                            position: 'relative'
                          }}
                        >
                          <button
                            onClick={() => handleAddToCompare(vendor.id, vendor.category)}
                            style={{
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: 28,
                              height: 28,
                              cursor: 'pointer',
                              fontSize: 18,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              lineHeight: 1
                            }}
                            title="Remove"
                          >
                            ×
                          </button>
                          <div style={{
                            width: '100%',
                            height: '120px',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-warm)',
                            marginBottom: 16,
                            overflow: 'hidden'
                          }}>
                            <img
                              src={vendor.logo || vendor.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.business_name || 'Vendor')}&size=200&background=E91E63&color=fff&bold=true`}
                              alt={vendor.business_name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.business_name || 'Vendor')}&size=200&background=E91E63&color=fff&bold=true`
                              }}
                            />
                          </div>
                          <h3 style={{
                            fontSize: 16,
                            fontWeight: 600,
                            marginBottom: 8,
                            color: 'var(--text-dark)'
                          }}>
                            {vendor.business_name}
                          </h3>
                          <div style={{
                            fontSize: 13,
                            color: 'var(--text-muted)',
                            marginBottom: 12
                          }}>
                            {vendor.category} · {vendor.city}
                          </div>
                          <Link
                            href={`/vendor/${vendor.id}`}
                            style={{
                              display: 'inline-block',
                              width: '100%',
                              textAlign: 'center',
                              padding: '10px',
                              background: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)',
                              color: 'white',
                              borderRadius: 'var(--radius-md)',
                              textDecoration: 'none',
                              fontSize: 14,
                              fontWeight: 600,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'translateY(-2px)'
                              e.target.style.boxShadow = '0 4px 12px rgba(233, 30, 99, 0.4)'
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'translateY(0)'
                              e.target.style.boxShadow = 'none'
                            }}
                          >
                            View Details
                          </Link>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={index}
                        className="compare-add-slot"
                        style={{
                          background: 'rgba(255,255,255,0.7)',
                          borderRadius: 18,
                          padding: '28px 20px',
                          border: '2px dashed rgba(233, 30, 99, 0.25)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: 240,
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                          boxShadow: '0 4px 20px rgba(15,23,42,0.04)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.95)'
                          e.currentTarget.style.border = '2px solid rgba(233, 30, 99, 0.4)'
                          e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
                          e.currentTarget.style.boxShadow = '0 12px 36px rgba(233,30,99,0.15)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.7)'
                          e.currentTarget.style.border = '2px dashed rgba(233, 30, 99, 0.25)'
                          e.currentTarget.style.transform = 'translateY(0) scale(1)'
                          e.currentTarget.style.boxShadow = '0 4px 20px rgba(15,23,42,0.04)'
                        }}
                        onClick={() => handleOpenVendorModal(index)}
                      >
                        <div style={{
                          width: 56,
                          height: 56,
                          borderRadius: 16,
                          background: 'linear-gradient(135deg, rgba(233,30,99,0.08) 0%, rgba(212,175,55,0.06) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 28,
                          marginBottom: 12,
                          color: '#E91E63',
                          transition: 'all 0.2s ease',
                        }}>
                          +
                        </div>
                        <div style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#E91E63',
                          marginBottom: 4,
                        }}>
                          Click to add vendor
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: 'rgba(31,41,55,0.5)',
                        }}>
                          Slot {index + 1}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Compare Now Button */}
                {selectedVendors.length >= 2 && (
                  <button
                    onClick={handleCompareNow}
                    disabled={compareNow}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'center',
                      padding: '16px 32px',
                      background: compareNow
                        ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
                        : 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)',
                      color: 'white',
                      borderRadius: 'var(--radius-lg)',
                      border: 'none',
                      fontSize: 16,
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(233, 30, 99, 0.3)',
                      transition: 'all 0.2s ease',
                      cursor: compareNow ? 'default' : 'pointer',
                      marginBottom: 16,
                      opacity: compareNow ? 0.8 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!compareNow) {
                        e.target.style.transform = 'translateY(-2px)'
                        e.target.style.boxShadow = '0 6px 16px rgba(233, 30, 99, 0.4)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!compareNow) {
                        e.target.style.transform = 'translateY(0)'
                        e.target.style.boxShadow = '0 4px 12px rgba(233, 30, 99, 0.3)'
                      }
                    }}
                  >
                    {compareNow ? '✓ Comparing Now' : `Compare Now (${selectedVendors.length} vendors)`}
                  </button>
                )}

                <Link
                  href="/vendors"
                  className="compare-browse-cta"
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'center',
                    padding: '18px 36px',
                    background: 'linear-gradient(135deg, #E91E63 0%, #8B5CF6 50%, #C2185B 100%)',
                    color: 'white',
                    borderRadius: 16,
                    textDecoration: 'none',
                    fontSize: 17,
                    fontWeight: 700,
                    boxShadow: '0 10px 32px rgba(233, 30, 99, 0.25)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)'
                    e.currentTarget.style.boxShadow = '0 16px 48px rgba(233, 30, 99, 0.35)'
                    e.currentTarget.style.filter = 'brightness(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 10px 32px rgba(233, 30, 99, 0.25)'
                    e.currentTarget.style.filter = 'none'
                  }}
                >
                  Browse All Vendors
                </Link>
              </div>
            </div>
          ) : (
            <div style={{
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              background: 'white',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}>
              <div style={{ minWidth: '100%' }}>
                {/* Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `clamp(110px, 25vw, 160px) repeat(${vendorsToCompare.length}, minmax(180px, 1fr))`,
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 45%, #9d174d 100%)',
                  borderBottom: 'none',
                  boxShadow: '0 4px 24px rgba(30,27,75,0.25)',
                }}>
                  <div style={{
                  padding: 'clamp(14px, 3vw, 22px) clamp(10px, 2vw, 20px)',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.92)',
                  fontSize: 'clamp(10px, 2.5vw, 12px)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  position: 'sticky',
                  left: 0,
                  zIndex: 10,
                  background: '#1e1b4b',
                  boxShadow: '4px 0 8px rgba(0,0,0,0.1)'
                }}>
                  Details
                </div>
                {vendorsToCompare.map((vendor) => (
                  <div key={vendor.id} style={{
                    padding: '20px',
                    textAlign: 'center',
                    borderLeft: '1px solid rgba(255,255,255,0.12)',
                    position: 'relative'
                  }}>
                    <button
                      onClick={() => removeFromCompare(vendor.id)}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.45)',
                        borderRadius: '50%',
                        width: 32,
                        height: 32,
                        cursor: 'pointer',
                        fontSize: 18,
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10
                      }}
                      title="Remove from comparison"
                    >
                      ×
                    </button>
                    <div style={{
                      width: 'clamp(50px, 15vw, 80px)',
                      height: 'clamp(50px, 15vw, 80px)',
                      borderRadius: 18,
                      background: 'rgba(255,255,255,0.12)',
                      margin: '0 auto 12px',
                      overflow: 'hidden',
                      boxShadow: '0 0 0 3px rgba(255,255,255,0.25)',
                    }}>
                      <img
                        src={vendor.logo || vendor.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.business_name || 'Vendor')}&size=200&background=ff6b9d&color=fff&bold=true`}
                        alt={vendor.business_name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.business_name || 'Vendor')}&size=200&background=ff6b9d&color=fff&bold=true`
                        }}
                      />
                    </div>
                    <h3 style={{
                      fontSize: 16,
                      fontWeight: 700,
                      margin: '0 0 4px',
                      color: '#fff'
                    }}>
                      {vendor.business_name}
                    </h3>
                    <div style={{
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.75)',
                      marginBottom: 12
                    }}>
                      {vendor.category} · {vendor.city}
                    </div>
                    <Link href={`/vendor/${vendor.id}`} style={{
                      padding: '8px 16px',
                      fontSize: 13,
                      fontWeight: 600,
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.95)',
                      color: '#4c1d95',
                      textDecoration: 'none',
                      display: 'inline-block',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                    }}>
                      View Details
                    </Link>
                  </div>
                ))}
              </div>

                {/* Comparison Rows */}
                {comparisonFields.map((field, idx) => (
                  <div
                    key={field.key}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `clamp(110px, 25vw, 160px) repeat(${vendorsToCompare.length}, minmax(180px, 1fr))`,
                      borderBottom: '1px solid var(--border-light)',
                      background: idx % 2 === 0 ? 'white' : 'var(--bg-cream)'
                    }}
                  >
                  <div style={{
                    padding: 'clamp(14px, 3vw, 20px) clamp(10px, 2vw, 20px)',
                    fontWeight: 600,
                    color: 'var(--text-dark)',
                    fontSize: 'clamp(12px, 3vw, 14px)',
                    position: 'sticky',
                    left: 0,
                    zIndex: 10,
                    background: idx % 2 === 0 ? 'white' : 'var(--bg-cream)',
                    boxShadow: '4px 0 8px rgba(0,0,0,0.03)'
                  }}>
                    {field.label}
                  </div>
                  {vendorsToCompare.map((vendor) => (
                    <div
                      key={vendor.id}
                      style={{
                        padding: '20px',
                        textAlign: 'center',
                        borderLeft:
                          (field.key === 'price_range' && bestStartingPriceMin !== null && vendor?.price_range?.min === bestStartingPriceMin) ||
                            (field.key === 'avg_rating' && bestAvgRating !== null && vendor?.avg_rating === bestAvgRating)
                            ? '3px solid rgba(233,30,99,0.65)'
                            : '1px solid var(--border-light)',
                        background:
                          (field.key === 'price_range' && bestStartingPriceMin !== null && vendor?.price_range?.min === bestStartingPriceMin) ||
                            (field.key === 'avg_rating' && bestAvgRating !== null && vendor?.avg_rating === bestAvgRating)
                            ? 'rgba(233,30,99,0.07)'
                            : 'transparent',
                        boxShadow:
                          (field.key === 'price_range' && bestStartingPriceMin !== null && vendor?.price_range?.min === bestStartingPriceMin) ||
                            (field.key === 'avg_rating' && bestAvgRating !== null && vendor?.avg_rating === bestAvgRating)
                            ? '0 10px 28px rgba(233,30,99,0.12)'
                            : 'none',
                        transition: 'all 0.2s ease',
                        fontSize: 14,
                        color: 'var(--text-dark)'
                      }}
                    >
                      {field.format(vendor)}
                    </div>
                  ))}
                </div>
              ))}

                {/* Features Row */}
                {vendorsToCompare.some(v => v.features && v.features.length > 0) && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `clamp(110px, 25vw, 160px) repeat(${vendorsToCompare.length}, minmax(180px, 1fr))`,
                    borderBottom: '1px solid var(--border-light)',
                    background: vendorsToCompare.length % 2 === 0 ? 'white' : 'var(--bg-cream)'
                  }}>
                  <div style={{
                    padding: 'clamp(14px, 3vw, 20px) clamp(10px, 2vw, 20px)',
                    fontWeight: 600,
                    color: 'var(--text-dark)',
                    fontSize: 'clamp(12px, 3vw, 14px)',
                    position: 'sticky',
                    left: 0,
                    zIndex: 10,
                    background: vendorsToCompare.length % 2 === 0 ? 'white' : 'var(--bg-cream)',
                    boxShadow: '4px 0 8px rgba(0,0,0,0.03)'
                  }}>
                    Key Features
                  </div>
                  {vendorsToCompare.map((vendor) => (
                    <div key={vendor.id} style={{
                      padding: '20px',
                      borderLeft:
                        bestFeatureCount > 0 && Array.isArray(vendor?.features) && vendor.features.length === bestFeatureCount
                          ? '3px solid rgba(233,30,99,0.65)'
                          : '1px solid var(--border-light)',
                      background:
                        bestFeatureCount > 0 && Array.isArray(vendor?.features) && vendor.features.length === bestFeatureCount
                          ? 'rgba(233,30,99,0.07)'
                          : 'transparent',
                      boxShadow:
                        bestFeatureCount > 0 && Array.isArray(vendor?.features) && vendor.features.length === bestFeatureCount
                          ? '0 10px 28px rgba(233,30,99,0.12)'
                          : 'none',
                      transition: 'all 0.2s ease'
                    }}>
                      {vendor.features && vendor.features.length > 0 ? (
                        <ul style={{
                          listStyle: 'none',
                          padding: 0,
                          margin: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8
                        }}>
                          {vendor.features.slice(0, 5).map((feature, idx) => (
                            <li key={idx} style={{
                              fontSize: 13,
                              color: 'var(--text-dark)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8
                            }}>
                              <span style={{
                                color: 'var(--accent-rose)',
                                fontWeight: 600
                              }}>✓</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          No features listed
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </section>

      {/* Vendor Selection Modal */}
      {showVendorModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={handleCloseVendorModal}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              padding: '32px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseVendorModal}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'transparent',
                border: 'none',
                fontSize: 28,
                color: '#666',
                cursor: 'pointer',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f0f0f0'
                e.target.style.color = '#333'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent'
                e.target.style.color = '#666'
              }}
            >
              ×
            </button>
            <h2 style={{
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 8,
              color: 'var(--text-dark)'
            }}>
              Select a Vendor
            </h2>
            <p style={{
              fontSize: 14,
              color: 'var(--text-muted)',
              marginBottom: 24
            }}>
              {compareCategoryLock
                ? `Category is locked to "${compareCategoryLock}" so you only compare vendors in that category.`
                : 'Choose a category and location to browse vendors'}
            </p>

            {/* Category Selector */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 8,
                color: 'var(--text-dark)'
              }}>
                Select Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                disabled={!!compareCategoryLock}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid var(--border-light)',
                  fontSize: 15,
                  background: compareCategoryLock ? '#f9fafb' : 'white',
                  cursor: compareCategoryLock ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: compareCategoryLock ? 0.9 : 1
                }}
                onFocus={(e) => e.target.style.borderColor = '#E91E63'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
              >
                <option value="">Select a Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Location Selector */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 8,
                color: 'var(--text-dark)'
              }}>
                Select Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => handleLocationChange(e.target.value)}
                disabled={!selectedCategory}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid var(--border-light)',
                  fontSize: 15,
                  background: selectedCategory ? 'white' : '#f5f5f5',
                  cursor: selectedCategory ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  opacity: selectedCategory ? 1 : 0.6
                }}
                onFocus={(e) => {
                  if (selectedCategory) {
                    e.target.style.borderColor = '#E91E63'
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-light)'
                }}
              >
                <option value="">All Locations</option>
                {cities.map(city => (
                  <option key={city.id} value={city.name}>{city.name}</option>
                ))}
              </select>
            </div>

            {/* Vendors List */}
            {selectedCategory && (
              <div>
                {loadingVendors ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: 'var(--text-muted)'
                  }}>
                    Loading vendors...
                  </div>
                ) : vendorsList.length > 0 ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    maxHeight: '400px',
                    overflowY: 'auto',
                    paddingRight: '8px'
                  }}>
                    {vendorsList.map((vendor) => {
                      const isSelected = selectedVendors.includes(vendor.id)
                      return (
                        <div
                          key={vendor.id}
                          style={{
                            background: isSelected ? 'rgba(233, 30, 99, 0.1)' : 'var(--bg-cream)',
                            borderRadius: 'var(--radius-md)',
                            padding: '16px',
                            border: isSelected ? '2px solid #E91E63' : '1px solid var(--border-light)',
                            cursor: isSelected ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            opacity: isSelected ? 0.6 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(233, 30, 99, 0.05)'
                              e.currentTarget.style.borderColor = '#E91E63'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'var(--bg-cream)'
                              e.currentTarget.style.borderColor = 'var(--border-light)'
                            }
                          }}
                          onClick={() => {
                            if (!isSelected) {
                              handleSelectVendorFromModal(vendor.id)
                            }
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12
                          }}>
                            <div style={{
                              width: 50,
                              height: 50,
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-warm)',
                              overflow: 'hidden',
                              flexShrink: 0
                            }}>
                              <img
                                src={vendor.logo || vendor.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.business_name || 'Vendor')}&size=200&background=E91E63&color=fff&bold=true`}
                                alt={vendor.business_name}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                                onError={(e) => {
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.business_name || 'Vendor')}&size=200&background=E91E63&color=fff&bold=true`
                                }}
                              />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: 16,
                                fontWeight: 600,
                                color: 'var(--text-dark)',
                                marginBottom: 4,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {vendor.business_name}
                              </div>
                              <div style={{
                                fontSize: 13,
                                color: 'var(--text-muted)',
                                marginBottom: 2
                              }}>
                                {vendor.category} · {vendor.city}
                              </div>
                              {vendor.avg_rating && (
                                <div style={{
                                  fontSize: 12,
                                  color: 'var(--text-muted)'
                                }}>
                                  ⭐ {vendor.avg_rating} ({vendor.review_count || 0} reviews)
                                </div>
                              )}
                            </div>
                            {isSelected && (
                              <div style={{
                                color: '#E91E63',
                                fontWeight: 600,
                                fontSize: 14
                              }}>
                                Added
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: 'var(--text-muted)',
                    fontSize: 14
                  }}>
                    {selectedLocation && selectedLocation !== 'All'
                      ? `No vendors available in ${selectedCategory} category from ${selectedLocation}`
                      : `No vendors available in ${selectedCategory} category`}
                  </div>
                )}
              </div>
            )}

            {!selectedCategory && (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--text-muted)',
                fontSize: 14
              }}>
                Please select a category to view vendors
              </div>
            )}
          </div>
        </div>
      )}

      {/* Minimum Vendor Requirement Message */}
      {vendorsToCompare.length < 2 && selectedVendors.length > 0 && selectedVendors.length < 2 && (
        <div style={{
          padding: '16px 32px',
          background: 'rgba(255, 193, 7, 0.1)',
          border: '2px solid rgba(255, 193, 7, 0.3)',
          borderRadius: 'var(--radius-md)',
          margin: '0 auto',
          maxWidth: '1200px',
          textAlign: 'center',
          marginTop: 24
        }}>
          <p style={{
            fontSize: 15,
            color: '#856404',
            margin: 0,
            fontWeight: 500
          }}>
            ⚠️ Please add at least <strong>2 vendors</strong> to compare. You currently have {selectedVendors.length} vendor{selectedVendors.length !== 1 ? 's' : ''} selected.
          </p>
        </div>
      )}

      <Footer />
    </div>
  )
}
