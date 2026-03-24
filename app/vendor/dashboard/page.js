'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { auth } from '../../../lib/firebase_client'
import {
  onAuthStateChanged,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth'
import { normalizeIndianPhone } from '../../../lib/phone-utils'
import { getCategoryConfig, VENDOR_CATEGORY_OPTIONS } from '../../../lib/vendorRegistrationConfig'

// Professional SVG Icon Components
const IconOverview = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
)

const IconProfile = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
)

const IconCalendar = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
)

const IconBriefcase = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
  </svg>
)

const IconStar = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
)

const IconImage = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
)

const IconSparkles = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M17 5l-5 5-5-5M17 19l-5-5-5 5"></path>
  </svg>
)

const IconTrendingUp = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
)

const IconDiamond = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12l4 6-10 12L2 9z"></path>
  </svg>
)

const IconUser = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
)

const IconMenu = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
)

const IconSearch = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
)

const IconPlus = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
)

const IconCamera = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
    <circle cx="12" cy="13" r="4"></circle>
  </svg>
)

const IconHeart = ({ size = 20, color = 'currentColor', filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
)

const IconEye = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
)

const IconBarChart = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10"></line>
    <line x1="18" y1="20" x2="18" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="16"></line>
  </svg>
)

const IconClock = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
)

// Lightweight helper to create an invisible reCAPTCHA verifier for phone auth
// Prevents multiple initializations by storing verifiers in a global cache
const setupRecaptcha = (containerId) => {
  if (typeof window === 'undefined' || !auth) return null

  // Initialize global cache if it doesn't exist
  if (!window.__recaptchaVerifiers) {
    window.__recaptchaVerifiers = {}
  }

  // Return existing verifier if available
  if (window.__recaptchaVerifiers[containerId]) {
    try {
      // Verify it's still valid by checking if container exists
      const container = document.getElementById(containerId)
      if (container) {
        return window.__recaptchaVerifiers[containerId]
      } else {
        // Container removed, clean up
        delete window.__recaptchaVerifiers[containerId]
      }
    } catch (e) {
      // Verifier is invalid, clean up
      delete window.__recaptchaVerifiers[containerId]
    }
  }

  const container = document.getElementById(containerId)
  if (!container) {
    console.warn(`[VendorDashboard] reCAPTCHA container #${containerId} not found`)
    return null
  }

  try {
    // Clean up any existing verifier for this container first
    if (window.__recaptchaVerifiers[containerId]) {
      try {
        window.__recaptchaVerifiers[containerId].clear()
      } catch (e) {
        console.warn(`[VendorDashboard] Error clearing old verifier:`, e)
      }
    }

    const verifier = new RecaptchaVerifier(auth, container, {
      size: 'invisible',
      callback: () => {
        console.log(`[VendorDashboard] reCAPTCHA solved for ${containerId}`)
      }
    })

    // Store in cache
    window.__recaptchaVerifiers[containerId] = verifier
    return verifier
  } catch (error) {
    console.error(`[VendorDashboard] Error creating reCAPTCHA verifier:`, error)
    return null
  }
}

export default function VendorDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)
  const [vendor, setVendor] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [leads, setLeads] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)
  const [leadFilter, setLeadFilter] = useState('all')
  const [leadPeriod, setLeadPeriod] = useState('lifetime') // '7d' | '30d' | '6m' | '1y' | 'lifetime'
  const [leadShortlistedOnly, setLeadShortlistedOnly] = useState(false)
  const [leadTypeFilter, setLeadTypeFilter] = useState('all') // 'all' | 'message' | 'contact_view' | 'inquiry' | 'availability_check'
  const [leadSearch, setLeadSearch] = useState('')

  const getLeadType = (l) => l.lead_type || (l.details && l.details.lead_type) || 'inquiry'
  const filteredLeads = useMemo(() => {
    let list = leads
    if (leadTypeFilter !== 'all') {
      list = list.filter(l => {
        const t = getLeadType(l)
        if (leadTypeFilter === 'inquiry') return t === 'inquiry'
        if (leadTypeFilter === 'availability_check') return t === 'availability_check'
        return t === leadTypeFilter
      })
    }
    if (leadSearch.trim()) {
      const q = leadSearch.trim().toLowerCase()
      list = list.filter(l => {
        const name = (l.name || l.user_name || '').toLowerCase()
        const phone = (l.contact_phone || '').replace(/\D/g, '')
        const searchNum = q.replace(/\D/g, '')
        return name.includes(q) || (searchNum && phone.includes(searchNum))
      })
    }
    return list
  }, [leads, leadTypeFilter, leadSearch])

  useEffect(() => {
    // Check authentication – allow any Firebase-authenticated user (Google or phone).
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login')
        return
      }

      try {
        const formattedPhone = normalizeIndianPhone(user.phoneNumber || '')

        // Sync user to Supabase
        const token = await user.getIdToken()
        await fetch('/api/sync-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            phone: formattedPhone || user.phoneNumber
          })
        })
      } catch (error) {
        console.error('Error syncing user:', error)
      } finally {
        setAuthLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (!authLoading && auth.currentUser) {
      fetchDashboardData()
    }
  }, [authLoading])

  useEffect(() => {
    if (activeTab === 'leads' && vendor && !authLoading) {
      fetchLeadsForCRM()
    }
  }, [activeTab, leadPeriod, leadShortlistedOnly, vendor?.id])

  const fetchDashboardData = async () => {
    try {
      const token = await getFirebaseToken()
      const [vendorRes, analyticsRes, leadsRes] = await Promise.all([
        fetch('/api/vendor/me', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/vendor/analytics', { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/vendor/chats?period=${leadPeriod}&shortlisted=${leadShortlistedOnly}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      const vendorData = await vendorRes.json()
      const analyticsData = await analyticsRes.json()
      const leadsData = await leadsRes.json()
      setVendor(vendorData.vendor)
      setAnalytics(analyticsData)
      setLeads(leadsData.leads || leadsData.chats || [])
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchLeadsForCRM = async () => {
    try {
      const token = await getFirebaseToken()
      const res = await fetch(
        `/api/vendor/chats?period=${leadPeriod}&shortlisted=${leadShortlistedOnly}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await res.json()
      setLeads(data.leads || data.chats || [])
    } catch (err) {
      console.error('Failed to fetch leads:', err)
    }
  }

  const getFirebaseToken = async () => {
    try {
      const user = auth.currentUser
      if (user) {
        return await user.getIdToken()
      }
      // If no current user, wait for auth state
      return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          unsubscribe()
          if (user) {
            resolve(await user.getIdToken())
          } else {
            resolve(null)
          }
        })
      })
    } catch (err) {
      console.error('Failed to get token:', err)
      return null
    }
  }

  const handleLeadAction = async (leadId, action, reply = '', amountPaid = null, paymentStatus = null) => {
    try {
      const token = await getFirebaseToken()
      const body = { lead_id: leadId, action, reply }
      if (typeof amountPaid === 'boolean') body.amount_paid = amountPaid
      if (paymentStatus != null) body.payment_status = paymentStatus
      if (['new', 'in_progress', 'booked', 'rejected'].includes(action)) body.status = action
      const res = await fetch('/api/vendor/lead-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        fetchDashboardData()
        if (action !== 'set_amount_paid' && action !== 'set_payment_status') setSelectedLead(null)
        else if (typeof amountPaid === 'boolean') {
          setSelectedLead(prev => prev && prev.id === leadId ? { ...prev, details: { ...(prev.details || {}), amount_paid: amountPaid } } : prev)
        } else if (paymentStatus != null) {
          setSelectedLead(prev => prev && prev.id === leadId ? { ...prev, details: { ...(prev.details || {}), payment_status: paymentStatus } } : prev)
        }
      }
    } catch (err) {
      console.error('Failed to update lead:', err)
    }
  }

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
            <IconClock size={48} color="#6B6B6B" />
          </div>
          <div style={{ fontSize: 18, color: '#6B6B6B', fontWeight: 500, letterSpacing: '0.01em' }}>
            {authLoading ? 'Checking authentication...' : 'Loading dashboard...'}
          </div>
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
            <IconUser size={48} color="#6B6B6B" />
          </div>
          <div style={{ fontSize: 18, color: '#6B6B6B', marginBottom: 24, fontWeight: 500, letterSpacing: '0.01em' }}>
            Vendor profile not found
          </div>
          <Link href="/register-vendor" className="btn-primary">
            Register as Vendor
          </Link>
        </div>
      </div>
    )
  }

  const stats = analytics?.overview || {}

  // Navigation items with icons
  const navItems = [
    { id: 'overview', label: 'Overview', icon: IconOverview },
    { id: 'profile', label: 'Profile', icon: IconProfile },
    { id: 'availability', label: 'Availability', icon: IconCalendar },
    { id: 'leads', label: 'Leads (CRM)', icon: IconBriefcase },
    { id: 'reviews', label: 'Reviews', icon: IconStar },
    { id: 'portfolio', label: 'Portfolio', icon: IconImage },
    { id: 'inspiration', label: 'Inspiration Feed', icon: IconSparkles },
    { id: 'analytics', label: 'Analytics', icon: IconTrendingUp },
    { id: 'subscription', label: 'Subscription', icon: IconDiamond }
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FB', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Dark Sidebar */}
        <div className={`vendor-dashboard-sidebar ${sidebarOpen ? 'open' : ''}`} style={{
          width: '260px',
          background: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)',
          height: 'calc(100vh - 73px)',
          padding: '24px 0',
          position: 'fixed',
          left: 0,
          top: '73px',
          zIndex: 90,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}>
          {/* Logo Section */}
          <div style={{
            padding: '0 24px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #E91E63 0%, #FF6B9D 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 800,
              color: 'white',
              boxShadow: '0 4px 15px rgba(233, 30, 99, 0.4)'
            }}>
              W
            </div>
            <div style={{ color: 'white', fontSize: '17px', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Dashboard
            </div>
          </div>
          {/* Divider */}
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(233,30,99,0.3), transparent)', margin: '8px 24px 20px' }} />

          {/* Navigation Items */}
          <div style={{ flex: 1, padding: '0 12px' }}>
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setSidebarOpen(false)
                }}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  marginBottom: '4px',
                  border: 'none',
                  background: activeTab === item.id ? 'rgba(233, 30, 99, 0.15)' : 'transparent',
                  color: activeTab === item.id ? '#FF6B9D' : 'rgba(255,255,255,0.55)',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: activeTab === item.id ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left',
                  position: 'relative',
                  borderLeft: activeTab === item.id ? '3px solid #E91E63' : '3px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== item.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.85)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== item.id) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.55)'
                  }
                }}
              >
                {item.icon && <item.icon size={18} color={activeTab === item.id ? '#FF6B9D' : 'rgba(255,255,255,0.45)'} />}
                <span style={{ letterSpacing: '0.01em' }}>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Wedeption Pro</div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="vendor-dashboard-main" style={{
          marginLeft: '260px',
          flex: 1,
          minHeight: '100vh',
          background: '#F8F9FB'
        }}>
          {/* Gradient Accent Strip */}
          <div style={{ height: '3px', background: 'linear-gradient(90deg, #E91E63, #FF6B9D, #D4AF37)', flexShrink: 0 }} />
          {/* Top Header Bar */}
          <div style={{
            background: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)',
            padding: '14px 32px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #E91E63, #FF6B9D)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(233,30,99,0.3)'
                }}>
                  {(vendor.business_name || 'U').charAt(0).toUpperCase()}
                </div>
                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: 500, letterSpacing: '0.01em' }}>{vendor.business_name || 'User'}</span>
              </div>
              <button
                className="vendor-dashboard-hamburger"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >
                <IconMenu size={18} color="white" />
              </button>
            </div>
          </div>

          {/* Mobile Overlay */}
          {sidebarOpen && (
            <div
              className="vendor-dashboard-overlay"
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 89
              }}
            />
          )}

          {/* Content Container */}
          <div style={{ padding: 'clamp(16px, 4vw, 32px)', maxWidth: '1400px', margin: '0 auto', overflowX: 'hidden' }}>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Welcome Section */}
                <div style={{
                  background: 'linear-gradient(135deg, #E91E63 0%, #C2185B 40%, #AD1457 100%)',
                  borderRadius: '20px',
                  padding: '32px',
                  marginBottom: '24px',
                  boxShadow: '0 8px 32px rgba(233, 30, 99, 0.25)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Decorative circles */}
                  <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', bottom: '-20px', right: '80px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginBottom: '8px', letterSpacing: '0.02em' }}>
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <h2 style={{
                      fontSize: '26px',
                      fontWeight: 800,
                      margin: 0,
                      marginBottom: '8px',
                      color: 'white',
                      letterSpacing: '-0.02em',
                      lineHeight: '1.3'
                    }}>
                      Welcome Back, {vendor.business_name || 'User'}! 👋
                    </h2>
                    <p style={{
                      fontSize: '14px',
                      color: 'rgba(255,255,255,0.8)',
                      margin: 0,
                      fontWeight: 400,
                      lineHeight: '1.5'
                    }}>
                      Here's what's happening with your business today.
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 'clamp(16px, 3vw, 24px)',
                  marginBottom: '32px'
                }}>
                  <StatCard
                    title="Profile Views"
                    value={stats.totalViews ?? 0}
                    icon={IconEye}
                    color="#2196F3"
                    subtitle="People who visited your profile"
                    trend={stats.profileViewsLast7Days > 0 ? `${stats.profileViewsLast7Days} in the last 7 days` : null}
                  />
                  <StatCard
                    title="Total Leads"
                    value={stats.totalLeads || 0}
                    icon={IconBriefcase}
                    color="#E91E63"
                    trend={stats.recentActivity?.leads > 0 ? `+${stats.recentActivity.leads} this week` : null}
                  />
                  <StatCard
                    title="Conversion Rate"
                    value={`${stats.conversionRate || 0}%`}
                    icon={IconTrendingUp}
                    color="#D4AF37"
                    subtitle={`${stats.leadsByStatus?.booked || 0} booked`}
                  />
                  <StatCard
                    title="Average Rating"
                    value={stats.avgRating || '0.0'}
                    icon={IconStar}
                    color="#D4AF37"
                    subtitle={`${stats.totalReviews || 0} reviews`}
                  />
                  <StatCard
                    title="Portfolio Likes"
                    value={stats.totalLikes || 0}
                    icon={IconHeart}
                    color="#E91E63"
                    subtitle={`${stats.approvedPortfolio || 0} approved`}
                  />
                </div>

                {/* Responsive Layout */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '24px',
                  marginBottom: '32px'
                }}>
                  {/* Key Metrics */}
                  <div style={{
                    background: 'white',
                    borderRadius: '18px',
                    padding: '28px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '24px'
                    }}>
                      <h3 style={{
                        fontSize: '17px',
                        fontWeight: 700,
                        margin: 0,
                        color: '#1A1A1A',
                        letterSpacing: '-0.01em'
                      }}>
                        Key Metrics
                      </h3>
                      <button
                        onClick={() => setActiveTab('analytics')}
                        style={{
                          background: 'rgba(233,30,99,0.08)',
                          border: 'none',
                          color: '#E91E63',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          padding: '6px 12px',
                          borderRadius: '20px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        View All →
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {[
                        { label: 'Total Leads', value: stats.totalLeads ?? 0, sub: `${stats.leadsByStatus?.booked ?? 0} booked`, color: '#E91E63' },
                        { label: 'Conversion Rate', value: `${stats.conversionRate ?? 0}%`, sub: 'of leads converted', color: '#D4AF37' },
                        { label: 'Average Rating', value: `${stats.avgRating ?? '0.0'}/5.0`, sub: `${stats.totalReviews ?? 0} reviews`, color: '#2196F3' }
                      ].map((metric, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                          <div style={{
                            width: '4px', height: '44px', borderRadius: '4px',
                            background: `linear-gradient(180deg, ${metric.color}, ${metric.color}60)`,
                            flexShrink: 0, marginTop: '2px'
                          }} />
                          <div>
                            <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '4px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{metric.label}</div>
                            <div style={{ fontSize: '26px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.02em', lineHeight: '1.1' }}>{metric.value}</div>
                            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>{metric.sub}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Monthly Performance */}
                  <div style={{
                    background: 'white',
                    borderRadius: '18px',
                    padding: '28px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '24px'
                    }}>
                      <h3 style={{
                        fontSize: '17px',
                        fontWeight: 700,
                        margin: 0,
                        color: '#1A1A1A',
                        letterSpacing: '-0.01em'
                      }}>
                        Monthly Performance
                      </h3>
                      <button
                        onClick={() => setActiveTab('analytics')}
                        style={{
                          background: 'rgba(233,30,99,0.08)',
                          border: 'none',
                          color: '#E91E63',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          padding: '6px 12px',
                          borderRadius: '20px'
                        }}
                      >
                        View All →
                      </button>
                    </div>
                    <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '10px', paddingTop: '20px' }}>
                      {analytics?.monthlyTrends?.slice(-6).map((month, idx) => {
                        const maxLeads = Math.max(...(analytics.monthlyTrends || []).map(m => m.leads), 1)
                        const height = maxLeads > 0 ? (month.leads / maxLeads) * 130 : 0
                        const isMax = month.leads === maxLeads && month.leads > 0
                        return (
                          <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {month.leads > 0 && (
                              <div style={{ fontSize: '11px', fontWeight: 700, color: isMax ? '#E91E63' : '#9CA3AF', marginBottom: '6px' }}>{month.leads}</div>
                            )}
                            <div style={{
                              width: '100%', maxWidth: '40px',
                              background: isMax ? 'linear-gradient(180deg, #E91E63, #AD1457)' : 'linear-gradient(180deg, #E91E6340, #E91E6318)',
                              height: `${Math.max(height, month.leads > 0 ? 6 : 0)}px`,
                              borderRadius: '6px 6px 4px 4px', marginBottom: '10px',
                              transition: 'height 0.3s ease'
                            }} />
                            <div style={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'center', fontWeight: 500 }}>{month.month}</div>
                          </div>
                        )
                      }) || Array.from({ length: 6 }).map((_, idx) => (
                        <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: '100%', maxWidth: '40px', background: '#F3F4F6', height: '20px', borderRadius: '6px 6px 4px 4px', marginBottom: '10px' }} />
                          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>-</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Activity Feed */}
                <div style={{
                  background: 'white',
                  borderRadius: '18px',
                  padding: '28px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{
                      fontSize: '17px',
                      fontWeight: 700,
                      margin: 0,
                      color: '#1A1A1A'
                    }}>
                      Recent Activity
                    </h3>
                    <button style={{
                      background: 'rgba(233,30,99,0.08)',
                      border: 'none',
                      color: '#E91E63',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      padding: '6px 12px',
                      borderRadius: '20px'
                    }}>
                      View All →
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {analytics?.recentLeads?.slice(0, 5).map((lead, idx) => {
                      const colors = ['#10b981', '#E91E63', '#D4AF37', '#2196F3', '#9CA3AF']
                      const icons = ['🟢', '🔴', '🟡', '🔵', '⚪']
                      return (
                        <div key={lead.id || idx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '14px 16px',
                          borderRadius: '12px',
                          background: idx % 2 === 0 ? '#F9FAFB' : 'transparent',
                          transition: 'background 0.2s ease'
                        }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                          onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? '#F9FAFB' : 'transparent'}
                        >
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: `${colors[idx % colors.length]}15`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px', flexShrink: 0
                          }}>
                            {icons[idx % icons.length]}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '14px', color: '#1A1A1A', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              New lead <span style={{ fontWeight: 700 }}>'{lead.user_name || lead.name}'</span> assigned
                            </div>
                            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                              {idx === 0 ? 'Today' : idx === 1 ? 'Yesterday' : `${idx} days ago`}
                            </div>
                          </div>
                          <div style={{ fontSize: '12px', color: '#9CA3AF', flexShrink: 0, fontWeight: 500 }}>
                            {lead.user_name || 'Client'}
                          </div>
                        </div>
                      )
                    }) || (
                        <div style={{ color: '#9CA3AF', padding: '32px', textAlign: 'center', fontSize: '14px' }}>
                          No recent activity
                        </div>
                      )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Leads/CRM Tab */}
            {activeTab === 'leads' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px'
                }}>
                  <h1 style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    margin: 0,
                    color: '#1A1A1A',
                    letterSpacing: '-0.02em',
                    lineHeight: '1.2'
                  }}>
                    Lead Management
                  </h1>
                  <button
                    onClick={() => {
                      // Add new lead functionality
                      setSelectedLead(null)
                    }}
                    style={{
                      padding: '12px 24px',
                      background: '#E91E63',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>+</span>
                    <span>Add Lead</span>
                  </button>
                </div>

                {/* Lead stats summary (leads only; profile views are in Overview) */}
                {(() => {
                  const messages = filteredLeads.filter(l => getLeadType(l) === 'message').length
                  const contactViews = filteredLeads.filter(l => getLeadType(l) === 'contact_view').length
                  const inquiries = filteredLeads.filter(l => getLeadType(l) === 'inquiry').length
                  const availabilityChecks = filteredLeads.filter(l => getLeadType(l) === 'availability_check').length
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                      {[
                        { label: 'Total Leads', value: filteredLeads.length, color: '#1A1A1A' },
                        { label: 'Inquiries', value: inquiries, color: '#E91E63' },
                        { label: 'Messages', value: messages, color: '#2196F3' },
                        { label: 'Contact Views', value: contactViews, color: '#4CAF50' },
                        { label: 'Availability checks', value: availabilityChecks, color: '#FF9800' }
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                          <div style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '4px', fontWeight: 600 }}>{label}</div>
                          <div style={{ fontSize: '24px', fontWeight: 700, color }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  )
                })()}

                {/* Leads over time + Lead source breakdown graphs */}
                {(() => {
                  const last14Days = Array.from({ length: 14 }, (_, i) => {
                    const d = new Date()
                    d.setDate(d.getDate() - (13 - i))
                    return d.toISOString().split('T')[0]
                  })
                  const byDate = last14Days.map(date => ({
                    date,
                    label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    count: filteredLeads.filter(l => l.created_at && l.created_at.startsWith(date)).length
                  }))
                  const typeCounts = {}
                  filteredLeads.forEach(l => {
                    const t = getLeadType(l)
                    typeCounts[t] = (typeCounts[t] || 0) + 1
                  })
                  const total = filteredLeads.length || 1
                  const typeLabels = { contact_view: 'Contact view', message: 'Message', availability_check: 'Availability', inquiry: 'Inquiry' }
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 20px', color: '#1A1A1A' }}>Leads over time (last 14 days)</h3>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '160px' }}>
                          {byDate.map((day, idx) => (
                            <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{
                                width: '100%',
                                maxWidth: '28px',
                                height: `${Math.max(4, (day.count / Math.max(...byDate.map(x => x.count), 1)) * 120)}px`,
                                background: 'linear-gradient(to top, #E91E63, #C2185B)',
                                borderRadius: '4px 4px 0 0',
                                marginBottom: '8px'
                              }} />
                              <div style={{ fontSize: '10px', color: '#6B6B6B', textAlign: 'center' }}>{day.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 20px', color: '#1A1A1A' }}>Lead source</h3>
                        {Object.keys(typeCounts).length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {Object.entries(typeCounts).map(([t, count], i) => {
                              const pct = Math.round((count / total) * 100)
                              const colors = ['#E91E63', '#2196F3', '#4CAF50', '#FF9800', '#9E9E9E']
                              return (
                                <div key={t}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                                    <span style={{ fontWeight: 500, color: '#1A1A1A' }}>{typeLabels[t] || t}</span>
                                    <span style={{ color: '#6B6B6B' }}>{count} ({pct}%)</span>
                                  </div>
                                  <div style={{ height: '8px', background: '#E0E0E0', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${pct}%`, height: '100%', background: colors[i % colors.length], borderRadius: '4px' }} />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div style={{ fontSize: '14px', color: '#6B6B6B' }}>No leads in this period</div>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {/* Search and Filters */}
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      flex: 1,
                      position: 'relative'
                    }}>
                      <input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={leadSearch}
                        onChange={(e) => setLeadSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px 12px 40px',
                          border: '1px solid #E0E0E0',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <IconSearch size={18} color="#6B6B6B" />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Period</label>
                    <select
                      value={leadPeriod}
                      onChange={(e) => setLeadPeriod(e.target.value)}
                      style={{
                        padding: '8px 32px 8px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#1F2937',
                        background: 'white',
                        cursor: 'pointer',
                        minWidth: '140px'
                      }}
                    >
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="6m">Last 6 months</option>
                      <option value="1y">Last 1 year</option>
                      <option value="lifetime">Lifetime</option>
                    </select>
                    <span style={{ marginLeft: '4px', fontSize: '13px', color: '#9CA3AF' }}>|</span>
                    {[
                      { value: 'all', label: 'All types' },
                      { value: 'message', label: 'Message' },
                      { value: 'contact_view', label: 'Contact view' },
                      { value: 'inquiry', label: 'Inquiry' },
                      { value: 'availability_check', label: 'Availability check' }
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setLeadTypeFilter(value)}
                        style={{
                          padding: '8px 16px',
                          border: 'none',
                          background: leadTypeFilter === value ? '#E91E63' : 'transparent',
                          color: leadTypeFilter === value ? 'white' : '#6B6B6B',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: leadTypeFilter === value ? 600 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {label}
                      </button>
                    ))}
                    <label style={{ marginLeft: '16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#6B6B6B' }}>
                      <input
                        type="checkbox"
                        checked={leadShortlistedOnly}
                        onChange={(e) => setLeadShortlistedOnly(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#E91E63' }}
                      />
                      Shortlist only
                    </label>
                  </div>
                </div>

                {/* Kanban Board */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '24px'
                }}>
                  {/* New Leads Column */}
                  <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}>
                    <div style={{
                      borderTop: '4px solid #E91E63',
                      paddingTop: '12px',
                      marginBottom: '20px'
                    }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        margin: 0,
                        color: '#1A1A1A'
                      }}>
                        New Leads
                      </h3>
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}>
                      {filteredLeads
                        .filter(lead => lead.status === 'new' || (!lead.status && leadFilter === 'all'))
                        .slice(0, 10)
                        .map(lead => (
                          <div
                            key={lead.id}
                            style={{
                              background: 'white',
                              borderRadius: '12px',
                              padding: '18px',
                              border: '1px solid #E5E7EB',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                              <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>
                                {lead.user_name || lead.name || '—'}
                              </div>
                              <button
                                onClick={() => handleLeadAction(lead.id, lead.shortlisted ? 'unshortlist' : 'shortlist')}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}
                                title={lead.shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                              >
                                <IconHeart size={20} color={lead.shortlisted ? '#E91E63' : '#D1D5DB'} filled={!!lead.shortlisted} />
                              </button>
                            </div>
                            <span style={{
                              display: 'inline-block',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#E91E63',
                              background: '#FDF2F8',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              marginBottom: '10px'
                            }}>
                              {lead.lead_type === 'contact_view' ? 'Contact view' : lead.lead_type === 'message' ? 'Message' : lead.lead_type === 'availability_check' ? 'Availability check' : 'Inquiry'}
                            </span>
                            {lead.contact_phone && (
                              <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>📞 {lead.contact_phone}</div>
                            )}
                            {lead.email && (
                              <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>✉️ {lead.email}</div>
                            )}
                            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
                              {lead.event_date ? new Date(lead.event_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBD'}
                            </div>
                            {(lead.budget_range || lead.budget) && (
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
                                {lead.budget_range || lead.budget}
                              </div>
                            )}
                            <div style={{ marginBottom: '10px' }}>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>Status</label>
                              <select
                                value={lead.status || 'new'}
                                onChange={(e) => handleLeadAction(lead.id, e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  border: '1px solid #E5E7EB',
                                  fontSize: '13px',
                                  fontWeight: 500,
                                  color: '#111827',
                                  background: 'white',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="new">New</option>
                                <option value="in_progress">In Progress</option>
                                <option value="booked">Booked</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>Payment</label>
                              <select
                                value={(lead.details && lead.details.payment_status) || 'none'}
                                onChange={(e) => handleLeadAction(lead.id, 'set_payment_status', '', null, e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  border: '1px solid #E5E7EB',
                                  fontSize: '13px',
                                  fontWeight: 500,
                                  color: '#111827',
                                  background: 'white',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="none">No paid</option>
                                <option value="25">25% paid</option>
                                <option value="50">50% paid</option>
                                <option value="full">Full paid</option>
                              </select>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <button onClick={() => setSelectedLead(lead)} style={{ padding: '6px 12px', background: '#374151', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                                View details
                              </button>
                              {lead.contact_phone && (
                                <a href={`https://wa.me/91${lead.contact_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 12px', background: '#25D366', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', textDecoration: 'none', fontWeight: 500 }}>
                                  WhatsApp
                                </a>
                              )}
                              <button onClick={() => { setSelectedLead(lead); handleLeadAction(lead.id, 'in_progress') }} style={{ padding: '6px 12px', background: '#E91E63', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>
                                Contact
                              </button>
                            </div>
                          </div>
                        ))}
                      {filteredLeads.filter(lead => lead.status === 'new' || (!lead.status && leadFilter === 'all')).length === 0 && (
                        <div style={{
                          textAlign: 'center',
                          padding: '40px 20px',
                          color: '#6B6B6B',
                          fontSize: '14px'
                        }}>
                          No new leads
                        </div>
                      )}
                    </div>
                  </div>

                  {/* In Progress Column */}
                  <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}>
                    <div style={{
                      borderTop: '4px solid #FF9800',
                      paddingTop: '12px',
                      marginBottom: '20px'
                    }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        margin: 0,
                        color: '#1A1A1A'
                      }}>
                        In Progress
                      </h3>
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}>
                      {filteredLeads
                        .filter(lead => lead.status === 'in_progress')
                        .slice(0, 10)
                        .map(lead => (
                          <div
                            key={lead.id}
                            style={{
                              background: 'white',
                              borderRadius: '12px',
                              padding: '18px',
                              border: '1px solid #E5E7EB',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '8px', color: '#111827' }}>
                                {lead.user_name || lead.name || 'Client'}
                              </div>
                              <button onClick={() => handleLeadAction(lead.id, lead.shortlisted ? 'unshortlist' : 'shortlist')} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                                <IconHeart size={20} color={lead.shortlisted ? '#E91E63' : '#D1D5DB'} filled={!!lead.shortlisted} />
                              </button>
                            </div>
                            <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 600, color: '#F59E0B', background: '#FFFBEB', padding: '4px 8px', borderRadius: '6px', marginBottom: '8px' }}>
                              {lead.lead_type === 'contact_view' ? 'Contact view' : lead.lead_type === 'message' ? 'Message' : lead.lead_type === 'availability_check' ? 'Availability check' : lead.lead_type || 'Inquiry'}
                            </span>
                            {lead.contact_phone && <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>📞 {lead.contact_phone}</div>}
                            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '10px' }}>
                              {lead.event_date ? new Date(lead.event_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBD'}
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>Status</label>
                              <select
                                value={lead.status || 'in_progress'}
                                onChange={(e) => handleLeadAction(lead.id, e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  border: '1px solid #E5E7EB',
                                  fontSize: '13px',
                                  fontWeight: 500,
                                  color: '#111827',
                                  background: 'white',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="new">New</option>
                                <option value="in_progress">In Progress</option>
                                <option value="booked">Booked</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>Payment</label>
                              <select
                                value={(lead.details && lead.details.payment_status) || 'none'}
                                onChange={(e) => handleLeadAction(lead.id, 'set_payment_status', '', null, e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  border: '1px solid #E5E7EB',
                                  fontSize: '13px',
                                  fontWeight: 500,
                                  color: '#111827',
                                  background: 'white',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="none">No paid</option>
                                <option value="25">25% paid</option>
                                <option value="50">50% paid</option>
                                <option value="full">Full paid</option>
                              </select>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <button onClick={() => setSelectedLead(lead)} style={{ padding: '6px 12px', background: '#374151', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>View details</button>
                              {lead.contact_phone && (
                                <a href={`https://wa.me/91${lead.contact_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 12px', background: '#25D366', color: 'white', borderRadius: '6px', fontSize: '12px', textDecoration: 'none' }}>WhatsApp</a>
                              )}
                            </div>
                          </div>
                        ))}
                      {filteredLeads.filter(lead => lead.status === 'in_progress').length === 0 && (
                        <div style={{
                          textAlign: 'center',
                          padding: '40px 20px',
                          color: '#6B6B6B',
                          fontSize: '14px'
                        }}>
                          No leads in progress
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Booked Column */}
                  <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}>
                    <div style={{
                      borderTop: '4px solid #10b981',
                      paddingTop: '12px',
                      marginBottom: '20px'
                    }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        margin: 0,
                        color: '#1A1A1A'
                      }}>
                        Booked
                      </h3>
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}>
                      {filteredLeads
                        .filter(lead => lead.status === 'booked')
                        .slice(0, 10)
                        .map(lead => (
                          <div
                            key={lead.id}
                            style={{
                              background: 'white',
                              borderRadius: '12px',
                              padding: '18px',
                              border: '1px solid #E5E7EB',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '8px', color: '#111827' }}>
                                {lead.user_name || lead.name || 'Client'}
                              </div>
                              <button onClick={() => handleLeadAction(lead.id, lead.shortlisted ? 'unshortlist' : 'shortlist')} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                                <IconHeart size={20} color={lead.shortlisted ? '#E91E63' : '#D1D5DB'} filled={!!lead.shortlisted} />
                              </button>
                            </div>
                            <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 600, color: '#10b981', background: '#ECFDF5', padding: '4px 8px', borderRadius: '6px', marginBottom: '8px' }}>
                              {lead.lead_type === 'contact_view' ? 'Contact view' : lead.lead_type === 'message' ? 'Message' : lead.lead_type === 'availability_check' ? 'Availability check' : lead.lead_type || 'Inquiry'}
                            </span>
                            {lead.contact_phone && <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>📞 {lead.contact_phone}</div>}
                            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '10px' }}>
                              {lead.event_date ? new Date(lead.event_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBD'}
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>Status</label>
                              <select
                                value={lead.status || 'booked'}
                                onChange={(e) => handleLeadAction(lead.id, e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  border: '1px solid #E5E7EB',
                                  fontSize: '13px',
                                  fontWeight: 500,
                                  color: '#111827',
                                  background: 'white',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="new">New</option>
                                <option value="in_progress">In Progress</option>
                                <option value="booked">Booked</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>Payment</label>
                              <select
                                value={(lead.details && lead.details.payment_status) || 'none'}
                                onChange={(e) => handleLeadAction(lead.id, 'set_payment_status', '', null, e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  border: '1px solid #E5E7EB',
                                  fontSize: '13px',
                                  fontWeight: 500,
                                  color: '#111827',
                                  background: 'white',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="none">No paid</option>
                                <option value="25">25% paid</option>
                                <option value="50">50% paid</option>
                                <option value="full">Full paid</option>
                              </select>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <button onClick={() => setSelectedLead(lead)} style={{ padding: '6px 12px', background: '#374151', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>View details</button>
                              {lead.contact_phone && (
                                <a href={`https://wa.me/91${lead.contact_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 12px', background: '#25D366', color: 'white', borderRadius: '6px', fontSize: '12px', textDecoration: 'none' }}>WhatsApp</a>
                              )}
                            </div>
                          </div>
                        ))}
                      {filteredLeads.filter(lead => lead.status === 'booked').length === 0 && (
                        <div style={{
                          textAlign: 'center',
                          padding: '40px 20px',
                          color: '#6B6B6B',
                          fontSize: '14px'
                        }}>
                          No booked leads
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lead detail drawer — full info and actions */}
                {selectedLead && (
                  <div
                    style={{
                      position: 'fixed',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      width: 'min(420px, 100vw)',
                      background: 'white',
                      boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
                      zIndex: 1000,
                      overflow: 'auto',
                      padding: '24px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#1A1A1A' }}>Lead details</h3>
                      <button onClick={() => setSelectedLead(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '24px', color: '#6B6B6B', padding: '4px' }}>×</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
                      <div><span style={{ color: '#6B6B6B', fontWeight: 600 }}>Name</span><br />{selectedLead.user_name || selectedLead.name || '—'}</div>
                      <div><span style={{ color: '#6B6B6B', fontWeight: 600 }}>Type</span><br />{getLeadType(selectedLead) === 'contact_view' ? 'Contact view' : getLeadType(selectedLead) === 'message' ? 'Message' : getLeadType(selectedLead) === 'availability_check' ? 'Availability check' : 'Inquiry'}</div>
                      {selectedLead.contact_phone && <div><span style={{ color: '#6B6B6B', fontWeight: 600 }}>Phone</span><br />{selectedLead.contact_phone}</div>}
                      {selectedLead.email && <div><span style={{ color: '#6B6B6B', fontWeight: 600 }}>Email</span><br />{selectedLead.email}</div>}
                      <div><span style={{ color: '#6B6B6B', fontWeight: 600 }}>Event date</span><br />{selectedLead.event_date ? new Date(selectedLead.event_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</div>
                      <div><span style={{ color: '#6B6B6B', fontWeight: 600 }}>Budget</span><br />{selectedLead.budget_range || selectedLead.budget || '—'}</div>
                      {(selectedLead.details && (selectedLead.details.details || selectedLead.details.event_type)) && <div><span style={{ color: '#6B6B6B', fontWeight: 600 }}>Details</span><br />{typeof selectedLead.details.details === 'string' ? selectedLead.details.details : selectedLead.details.event_type || JSON.stringify(selectedLead.details)}</div>}
                      <div style={{ marginTop: '4px' }}>
                        <span style={{ color: '#6B6B6B', fontWeight: 600, fontSize: '13px' }}>Status</span>
                        <select
                          value={selectedLead.status || 'new'}
                          onChange={(e) => handleLeadAction(selectedLead.id, e.target.value)}
                          style={{
                            width: '100%',
                            marginTop: '6px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #E5E7EB',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#111827',
                            background: 'white',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="new">New</option>
                          <option value="in_progress">In Progress</option>
                          <option value="booked">Booked</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      <div style={{ marginTop: '16px' }}>
                        <span style={{ color: '#6B6B6B', fontWeight: 600, fontSize: '13px' }}>Payment</span>
                        <select
                          value={(selectedLead.details && selectedLead.details.payment_status) || 'none'}
                          onChange={(e) => handleLeadAction(selectedLead.id, 'set_payment_status', '', null, e.target.value)}
                          style={{
                            width: '100%',
                            marginTop: '6px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #E5E7EB',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#111827',
                            background: 'white',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="none">No paid</option>
                          <option value="25">25% paid</option>
                          <option value="50">50% paid</option>
                          <option value="full">Full paid</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button onClick={() => handleLeadAction(selectedLead.id, selectedLead.shortlisted ? 'unshortlist' : 'shortlist')} style={{ padding: '12px', border: '1px solid #E0E0E0', borderRadius: '8px', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                        <IconHeart size={18} color={selectedLead.shortlisted ? '#E91E63' : '#666'} filled={!!selectedLead.shortlisted} />
                        {selectedLead.shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                      </button>
                      {selectedLead.contact_phone && (
                        <a href={`https://wa.me/91${selectedLead.contact_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ padding: '12px', background: '#25D366', color: 'white', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                )}

              </motion.div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <ReviewsSection vendorId={vendor.id} />
              </motion.div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <ProfileSection vendor={vendor} analytics={analytics} leads={leads} onUpdate={fetchDashboardData} />
              </motion.div>
            )}

            {/* Availability Tab */}
            {activeTab === 'availability' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <AvailabilitySection vendor={vendor} />
              </motion.div>
            )}

            {/* Portfolio Tab */}
            {activeTab === 'portfolio' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <PortfolioSection vendor={vendor} />
              </motion.div>
            )}

            {/* Inspiration Feed Tab */}
            {activeTab === 'inspiration' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <InspirationFeedSection vendor={vendor} />
              </motion.div>
            )}

            {/* Subscription Tab */}
            {activeTab === 'subscription' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <SubscriptionSection vendor={vendor} />
              </motion.div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <AnalyticsSection analytics={analytics} />
              </motion.div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

// Helper Components
function StatCard({ title, value, icon: IconComponent, color, subtitle, trend }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      borderLeft: `4px solid ${color || '#E91E63'}`,
      position: 'relative',
      overflow: 'hidden'
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)'
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)'
      }}
    >
      {/* Subtle gradient overlay */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: '120px', height: '120px',
        background: `radial-gradient(circle at top right, ${color || '#E91E63'}08, transparent)`,
        pointerEvents: 'none'
      }} />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
        position: 'relative'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '12px',
            color: '#9CA3AF',
            marginBottom: '10px',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase'
          }}>
            {title}
          </div>
          <div style={{
            fontSize: '30px',
            fontWeight: 800,
            color: '#1A1A1A',
            marginBottom: '4px',
            letterSpacing: '-0.02em',
            lineHeight: '1.1'
          }}>
            {value}
          </div>
          {subtitle && (
            <div style={{
              fontSize: '12px',
              color: '#9CA3AF',
              marginTop: '6px',
              fontWeight: 400
            }}>
              {subtitle}
            </div>
          )}
          {trend && (
            <div style={{
              fontSize: '12px',
              color: '#10b981',
              marginTop: '6px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ fontSize: '14px' }}>↑</span> {trend}
            </div>
          )}
        </div>
        {IconComponent && (
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: `${color || '#E91E63'}12`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginLeft: '12px'
          }}>
            <IconComponent size={24} color={color || '#E91E63'} />
          </div>
        )}
      </div>
    </div>
  )
}

function StatusCard({ label, count, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: 20,
        borderRadius: 'var(--radius-md)',
        background: color,
        color: 'white',
        cursor: 'pointer',
        transition: 'transform 0.2s ease'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{
        fontSize: 13,
        opacity: 0.9,
        marginBottom: 8
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 32,
        fontWeight: 700
      }}>
        {count}
      </div>
    </div>
  )
}

function LeadCard({ lead, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: 16,
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-light)',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-rose)'
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-light)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8
      }}>
        <div>
          <div style={{
            fontWeight: 600,
            marginBottom: 4,
            color: 'var(--text-dark)'
          }}>
            {lead.user_name || lead.name}
          </div>
          <div style={{
            fontSize: 13,
            color: 'var(--text-muted)'
          }}>
            {lead.contact_phone}
          </div>
        </div>
        <span style={{
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          background: getStatusColor(lead.status),
          color: 'white',
          fontSize: 11,
          fontWeight: 600
        }}>
          {lead.status}
        </span>
      </div>
      {lead.event_date && (
        <div style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          marginTop: 8
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <IconCalendar size={14} color="#6B6B6B" />
            Event: {new Date(lead.event_date).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  )
}

function LeadDetails({ lead, onAction }) {
  const [reply, setReply] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    // Load existing reply if any
    if (lead.details?.vendor_reply) {
      setReply(lead.details.vendor_reply)
    } else {
      setReply('')
    }
  }, [lead])

  const handleAction = async (action) => {
    setActionLoading(true)
    await onAction(lead.id, action, reply)
    setActionLoading(false)
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24
      }}>
        <div>
          <h3 style={{
            fontSize: 24,
            fontWeight: 700,
            margin: 0,
            marginBottom: 8,
            color: 'var(--text-dark)'
          }}>
            {lead.user_name || lead.name || '—'}
          </h3>
          <div style={{ fontSize: 12, color: '#E91E63', marginBottom: 8, textTransform: 'capitalize' }}>
            {lead.lead_type === 'contact_view' ? 'Contact view' : lead.lead_type === 'message' ? 'Message' : lead.lead_type === 'availability_check' ? 'Availability check' : 'Inquiry'}
          </div>
          {lead.contact_phone && (
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>
              📞 {lead.contact_phone}
            </div>
          )}
          <div style={{
            fontSize: 14,
            color: 'var(--text-muted)'
          }}>
            📅 {lead.event_date ? new Date(lead.event_date).toLocaleDateString() : 'Not specified'}
          </div>
        </div>
        <span style={{
          padding: '8px 16px',
          borderRadius: 'var(--radius-full)',
          background: getStatusColor(lead.status),
          color: 'white',
          fontSize: 13,
          fontWeight: 600
        }}>
          {lead.status}
        </span>
      </div>

      <div style={{
        padding: 20,
        background: 'var(--bg-warm)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 24
      }}>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 12,
          color: 'var(--text-dark)'
        }}>
          Event Details
        </div>
        <div style={{
          fontSize: 14,
          color: 'var(--text-dark)',
          marginBottom: 8
        }}>
          <strong>Budget:</strong> {lead.budget_range || 'Not specified'}
        </div>
        {lead.details && (
          <div style={{
            fontSize: 14,
            color: 'var(--text-dark)',
            whiteSpace: 'pre-wrap'
          }}>
            {typeof lead.details === 'string' ? lead.details : JSON.stringify(lead.details, null, 2)}
          </div>
        )}
      </div>

      {lead.details?.vendor_reply && (
        <div style={{
          padding: 16,
          background: '#e0f2fe',
          borderRadius: 'var(--radius-md)',
          marginBottom: 24
        }}>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 8,
            color: '#0369a1'
          }}>
            Your Reply:
          </div>
          <div style={{
            fontSize: 14,
            color: '#0c4a6e'
          }}>
            {lead.details.vendor_reply}
          </div>
        </div>
      )}

      <div style={{
        padding: 20,
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 20
      }}>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 12,
          color: 'var(--text-dark)'
        }}>
          Reply to Lead
        </div>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Type your reply here..."
          style={{
            width: '100%',
            minHeight: '100px',
            padding: 12,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            fontSize: 14,
            fontFamily: 'inherit',
            resize: 'vertical',
            marginBottom: 12
          }}
        />
        <div style={{
          display: 'flex',
          gap: 12
        }}>
          <button
            onClick={() => handleAction('accept')}
            disabled={actionLoading}
            className="btn-primary"
            style={{
              flex: 1,
              opacity: actionLoading ? 0.6 : 1
            }}
          >
            {lead.status === 'in_progress' ? 'Update' : 'Accept Lead'}
          </button>
          <button
            onClick={() => handleAction('reject')}
            disabled={actionLoading}
            style={{
              flex: 1,
              padding: '12px 24px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              background: 'white',
              color: 'var(--text-dark)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              opacity: actionLoading ? 0.6 : 1
            }}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}

function ReviewsSection({ vendorId }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('most_recent')

  const fetchReviews = () => {
    if (!vendorId) return
    fetch(`/api/reviews/list?vendor_id=${vendorId}`)
      .then(r => r.json())
      .then(d => {
        setReviews(d.reviews || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchReviews()
  }, [vendorId])

  useEffect(() => {
    if (!vendorId) return
    const interval = setInterval(fetchReviews, 30000)
    const onFocus = () => fetchReviews()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [vendorId])

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Loading reviews...</div>

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0'

  const ratingBreakdown = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          margin: 0,
          color: '#1A1A1A'
        }}>
          Customer Reviews
        </h1>
        <button
          style={{
            padding: '12px 24px',
            background: '#E91E63',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          + Request a Review
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Overall Rating */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '48px',
            fontWeight: 700,
            color: '#1A1A1A',
            marginBottom: '8px'
          }}>
            {avgRating}
            <span style={{ fontSize: '24px', color: '#6B6B6B', fontWeight: 400 }}>/5.0</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '4px',
            marginBottom: '12px'
          }}>
            {[1, 2, 3, 4, 5].map(i => (
              <span key={i} style={{
                fontSize: '24px',
                color: i <= Math.round(parseFloat(avgRating)) ? '#E91E63' : '#E0E0E0'
              }}>
                ⭐
              </span>
            ))}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#6B6B6B'
          }}>
            Based on {reviews.length} reviews
          </div>
        </div>

        {/* Rating Breakdown */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            margin: 0,
            marginBottom: '24px',
            color: '#1A1A1A'
          }}>
            Rating Breakdown
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {[5, 4, 3, 2, 1].map(rating => {
              const count = ratingBreakdown[rating]
              const maxCount = Math.max(...Object.values(ratingBreakdown), 1)
              const width = (count / maxCount) * 100
              return (
                <div key={rating}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <span style={{ fontSize: '14px', color: '#1A1A1A' }}>
                      {rating} stars ({count})
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: '#E0E0E0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${width}%`,
                      height: '100%',
                      background: '#E91E63',
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '14px', color: '#6B6B6B' }}>Filter by:</span>
        {['Most Recent', 'Highest Rated', 'Lowest Rated'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f.toLowerCase().replace(' ', '_'))}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: filter === f.toLowerCase().replace(' ', '_') ? '#E91E63' : 'transparent',
              color: filter === f.toLowerCase().replace(' ', '_') ? 'white' : '#6B6B6B',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: filter === f.toLowerCase().replace(' ', '_') ? 600 : 500,
              cursor: 'pointer'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {reviews
          .sort((a, b) => {
            if (filter === 'highest_rated') return (b.rating || 0) - (a.rating || 0)
            if (filter === 'lowest_rated') return (a.rating || 0) - (b.rating || 0)
            return new Date(b.created_at) - new Date(a.created_at)
          })
          .map(review => (
            <div
              key={review.id}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                position: 'relative'
              }}
            >
              <div style={{
                display: 'flex',
                gap: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#E0E0E0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  👤
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div>
                      <div style={{
                        fontWeight: 600,
                        fontSize: '16px',
                        marginBottom: '4px',
                        color: '#1A1A1A'
                      }}>
                        {review.users?.name || 'Anonymous'}
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '4px',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        {[1, 2, 3, 4, 5].map(i => (
                          <span key={i} style={{
                            fontSize: '16px',
                            color: i <= (review.rating || 0) ? '#E91E63' : '#E0E0E0'
                          }}>
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>
                    {review.rating === 5 && (
                      <div style={{
                        padding: '4px 12px',
                        background: '#E91E63',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}>
                        Highest Rated
                      </div>
                    )}
                  </div>
                  {review.review_text && (
                    <div style={{
                      fontSize: '14px',
                      color: '#1A1A1A',
                      lineHeight: 1.6,
                      marginBottom: '8px',
                      fontStyle: 'italic'
                    }}>
                      "{review.review_text}"
                    </div>
                  )}
                  <div style={{
                    fontSize: '12px',
                    color: '#6B6B6B'
                  }}>
                    Reviewed on {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <button style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '20px',
                  color: '#6B6B6B',
                  cursor: 'pointer',
                  padding: '4px'
                }}>
                  ⋯
                </button>
              </div>
            </div>
          ))}
        {reviews.length === 0 && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '60px',
            textAlign: 'center',
            color: '#6B6B6B',
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            No reviews yet
          </div>
        )}
      </div>
    </div>
  )
}

function PortfolioSection({ vendor }) {
  const [portfolio, setPortfolio] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const token = await auth.currentUser?.getIdToken()
        const res = await fetch('/api/vendor/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setPortfolio(data.portfolio || [])
      } catch (err) {
        console.error('Failed to fetch portfolio:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPortfolio()
  }, [])

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Allow images and videos
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')

      if (!isImage && !isVideo) {
        alert('Please select an image or video file')
        return
      }

      // Check file size (max 100MB for videos, 10MB for images)
      const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024
      if (file.size > maxSize) {
        alert(`File size too large. Maximum size: ${isVideo ? '100MB' : '10MB'}`)
        return
      }

      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select an image or video file')
      return
    }

    setUploading(true)
    try {
      const user = auth.currentUser
      if (!user) {
        alert('Please login to upload files')
        setUploading(false)
        return
      }

      let token
      try {
        token = await user.getIdToken(true)
      } catch (tokenErr) {
        const msg = tokenErr?.message || ''
        if (/invalid_grant|JWT|token|expired|signature/i.test(msg)) {
          alert('Session expired. Please sign out, sign in again, and try uploading.')
        } else {
          alert('Could not verify your session. Please sign in again.')
        }
        setUploading(false)
        return
      }

      const formData = new FormData()
      formData.append('file', selectedFile)

      const uploadRes = await fetch('/api/upload-file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      let uploadData
      if (!uploadRes.ok) {
        const contentType = uploadRes.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          uploadData = await uploadRes.json()
          throw new Error(uploadData.error || 'Failed to upload file')
        } else {
          const errorText = await uploadRes.text()
          throw new Error(`Upload failed (${uploadRes.status}): ${errorText.substring(0, 200)}`)
        }
      }

      uploadData = await uploadRes.json()

      let freshToken
      try {
        freshToken = await user.getIdToken(true)
      } catch (_) {
        freshToken = token
      }
      const isVideo = selectedFile.type.startsWith('video/')
      const portfolioRes = await fetch('/api/portfolio-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${freshToken}`
        },
        body: JSON.stringify({
          media_url: uploadData.publicUrl,
          media_type: isVideo ? 'video' : 'image',
          caption: caption || (isVideo ? 'Portfolio video' : 'Portfolio image')
        })
      })
      const portfolioData = await portfolioRes.json()

      if (portfolioRes.ok) {
        alert(vendor?.verified
          ? 'Portfolio media uploaded and approved!'
          : 'Portfolio media uploaded! Pending admin approval.')
        setSelectedFile(null)
        setPreview(null)
        setCaption('')
        setShowUpload(false)
        // Refresh portfolio list with fresh token
        const refreshToken = await user.getIdToken(true)
        const refreshRes = await fetch('/api/vendor/me', {
          headers: { Authorization: `Bearer ${refreshToken}` }
        })
        const refreshData = await refreshRes.json()
        setPortfolio(refreshData.portfolio || [])
      } else {
        alert(portfolioData.error || 'Failed to save portfolio entry')
      }
    } catch (err) {
      console.error('Upload error:', err)
      let errorMessage = err.message || 'Failed to upload file. Please try again.'
      if (errorMessage.includes('invalid_grant') || errorMessage.includes('JWT') || errorMessage.includes('Session expired')) {
        errorMessage = 'Session expired. Please sign out, sign in again, and try uploading. See UPLOAD_SESSION_FIX.md for setup.'
      } else if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        errorMessage = 'Please sign in again to upload files.'
      } else if (errorMessage.includes('Upload service unavailable') || errorMessage.includes('Firebase Storage is not configured')) {
        errorMessage = 'Upload service not configured. Add firebase-service-account.json and set FIREBASE_STORAGE_BUCKET. See UPLOAD_SESSION_FIX.md.'
      }
      alert(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div>Loading portfolio...</div>

  return (
    <div>
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24
        }}>
          <h3 style={{
            fontSize: 20,
            fontWeight: 600,
            margin: 0,
            color: 'var(--text-dark)'
          }}>
            Portfolio ({portfolio.length} items)
          </h3>
          <button
            className="btn-primary"
            onClick={() => setShowUpload(!showUpload)}
          >
            {showUpload ? 'Cancel' : '+ Add Media'}
          </button>
        </div>

        {showUpload && (
          <div style={{
            padding: 28,
            background: 'linear-gradient(135deg, #FFF5F7 0%, #FFE8EC 50%, #FCE4EC 100%)',
            borderRadius: 16,
            marginBottom: 24,
            border: '2px solid rgba(233, 30, 99, 0.2)',
            boxShadow: '0 8px 24px rgba(233, 30, 99, 0.12)'
          }}>
            <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, color: '#880E4F', letterSpacing: '-0.02em' }}>Upload Portfolio Media</h4>
            <p style={{ fontSize: 13, color: '#AD1457', marginBottom: 24 }}>Showcase your best work. Images up to 10MB, videos up to 100MB.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Photo or video</label>
                <div
                  onClick={() => document.getElementById('portfolio-file-input').click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#E91E63'; e.currentTarget.style.background = '#FDF2F8' }}
                  onDragLeave={(e) => { e.currentTarget.style.borderColor = '#F48FB1'; e.currentTarget.style.background = 'white' }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.currentTarget.style.borderColor = '#F48FB1'
                    e.currentTarget.style.background = 'white'
                    const file = e.dataTransfer.files?.[0]
                    if (file) handleFileSelect({ target: { files: [file] } })
                  }}
                  style={{
                    border: '2px dashed #F48FB1',
                    borderRadius: 12,
                    padding: 24,
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: preview ? 'transparent' : 'white',
                    transition: 'all 0.2s ease',
                    minHeight: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <input
                    id="portfolio-file-input"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  {preview ? (
                    <div style={{ width: '100%', maxHeight: 320, borderRadius: 8, overflow: 'hidden', background: '#111' }}>
                      {selectedFile?.type?.startsWith('video/') ? (
                        <video src={preview} controls style={{ width: '100%', maxHeight: 320, display: 'block' }} />
                      ) : (
                        <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: 320, objectFit: 'contain', display: 'block' }} />
                      )}
                      <div style={{ marginTop: 8, fontSize: 12, color: '#AD1457' }}>Click or drag another file to replace</div>
                    </div>
                  ) : (
                    <>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #F8BBD9, #F48FB1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 24 }}>📷</span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#880E4F', marginBottom: 4 }}>Click or drag file here</div>
                      <div style={{ fontSize: 13, color: '#AD1457' }}>PNG, JPG, GIF, WebP or MP4, WebM</div>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Caption (optional)</label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Describe this image or video"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid #E5E7EB',
                      fontSize: 14,
                      outline: 'none'
                    }}
                  />
                </div>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                  style={{
                    marginTop: 8,
                    padding: '14px 24px',
                    borderRadius: 10,
                    border: 'none',
                    background: (uploading || !selectedFile) ? '#D1D5DB' : 'linear-gradient(135deg, #E91E63, #C2185B)',
                    color: 'white',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: (uploading || !selectedFile) ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.8 : 1,
                    boxShadow: (uploading || !selectedFile) ? 'none' : '0 4px 14px rgba(233, 30, 99, 0.4)',
                    transition: 'all 0.2s'
                  }}
                >
                  {uploading ? 'Uploading…' : 'Upload Media'}
                </button>
              </div>
            </div>
          </div>
        )}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16
        }}>
          {portfolio.map(item => (
            <div
              key={item.id}
              style={{
                position: 'relative',
                paddingTop: '75%',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: 'var(--bg-warm)'
              }}
            >
              {item.media_type === 'video' ? (
                <video
                  src={item.media_url}
                  controls
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <img
                  src={item.media_url}
                  alt={item.caption}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              )}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                padding: 12,
                color: 'white',
                fontSize: 12
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {item.caption || 'Untitled'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>❤️ {item.likes || 0}</span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: item.approved ? '#10b981' : 'var(--accent-gold)',
                    fontSize: 10
                  }}>
                    {item.approved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {portfolio.length === 0 && !showUpload && (
          <div style={{
            textAlign: 'center',
            padding: 60,
            color: 'var(--text-muted)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🖼️</div>
            <div>No portfolio items yet</div>
            <button
              className="btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => setShowUpload(true)}
            >
              Upload Your First Image
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function AnalyticsSection({ analytics }) {
  const stats = analytics?.overview || {}

  return (
    <div>
      <h1 style={{
        fontSize: '28px',
        fontWeight: 700,
        margin: 0,
        marginBottom: '32px',
        color: '#1A1A1A',
        letterSpacing: '-0.02em',
        lineHeight: '1.2'
      }}>
        Analytics Overview
      </h1>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '12px', fontWeight: 500, letterSpacing: '0.01em', textTransform: 'uppercase' }}>Total Profile Views</div>
          <div style={{ fontSize: '36px', fontWeight: 700, color: '#1A1A1A', marginBottom: '8px', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
            {stats.totalViews ?? 0}
          </div>
          <div style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '16px' }}>
            People who visited your profile page
          </div>
          {stats.profileViewsLast7Days > 0 && (
            <div style={{ fontSize: '12px', color: '#2196F3', fontWeight: 500 }}>
              {stats.profileViewsLast7Days} in the last 7 days
            </div>
          )}
          <div style={{
            height: '40px',
            background: 'linear-gradient(to right, #2196F3, #1976D2)',
            borderRadius: '4px',
            opacity: 0.3,
            marginTop: '12px'
          }} />
        </div>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '12px', fontWeight: 500, letterSpacing: '0.01em', textTransform: 'uppercase' }}>Leads Generated</div>
          <div style={{ fontSize: '36px', fontWeight: 700, color: '#1A1A1A', marginBottom: '16px', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
            {stats.totalLeads ?? 0}
          </div>
          <div style={{ height: '8px', background: '#E0E0E0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(stats.totalLeads ? 100 : 0, 100)}%`, height: '100%', background: '#E91E63', borderRadius: '4px' }} />
          </div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '12px', fontWeight: 500 }}>Booking Conversion Rate</div>
          <div style={{ fontSize: '36px', fontWeight: 700, color: '#1A1A1A', marginBottom: '16px' }}>
            {stats.conversionRate ?? 0}%
          </div>
          <div style={{ height: '8px', background: '#E0E0E0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(Number(stats.conversionRate) || 0, 100)}%`, height: '100%', background: '#E91E63', borderRadius: '4px' }} />
          </div>
        </div>
      </div>

      {/* Responsive Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Monthly Performance */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            margin: 0,
            marginBottom: '24px',
            color: '#1A1A1A'
          }}>
            Monthly Performance
          </h3>
          <div style={{
            height: '300px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '12px',
            paddingTop: '20px'
          }}>
            {analytics?.monthlyTrends?.slice(-11).map((month, idx) => {
              const maxValue = Math.max(...(analytics.monthlyTrends || []).map(m => m.leads || m.views || 0), 1)
              const height = maxValue > 0 ? ((month.leads || month.views || 0) / maxValue) * 220 : 0
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '100%',
                    background: idx % 3 === 0 ? '#2196F3' : idx % 3 === 1 ? '#9E9E9E' : '#E91E63',
                    height: `${height}px`,
                    borderRadius: '4px 4px 0 0',
                    marginBottom: '8px',
                    minHeight: (month.leads || month.views || 0) > 0 ? '4px' : '0px'
                  }} />
                  <div style={{ fontSize: '11px', color: '#6B6B6B', textAlign: 'center' }}>
                    {month.month}
                  </div>
                </div>
              )
            }) || Array.from({ length: 11 }).map((_, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: '100%',
                  background: '#E0E0E0',
                  height: '20px',
                  borderRadius: '4px 4px 0 0',
                  marginBottom: '8px'
                }} />
                <div style={{ fontSize: '11px', color: '#6B6B6B' }}>-</div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Source Breakdown - real data from leads by lead_type */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, marginBottom: '24px', color: '#1A1A1A' }}>
            Lead Source Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
            {(stats.leadSourceBreakdown && stats.leadSourceBreakdown.length > 0) ? (
              <>
                <div style={{
                  width: '180px',
                  height: '180px',
                  borderRadius: '50%',
                  background: `conic-gradient(${stats.leadSourceBreakdown.map((item, i) => {
                    const colors = ['#E91E63', '#9E9E9E', '#2196F3', '#4CAF50', '#FF9800']
                    const prev = stats.leadSourceBreakdown.slice(0, i).reduce((s, x) => s + x.percent, 0)
                    return `${colors[i % colors.length]} ${prev}% ${prev + item.percent}%`
                  }).join(', ')})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'white' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                  {stats.leadSourceBreakdown.map((item, i) => {
                    const colors = ['#E91E63', '#9E9E9E', '#2196F3', '#4CAF50', '#FF9800']
                    return (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: colors[i % colors.length] }} />
                        <span style={{ fontSize: '14px', color: '#1A1A1A' }}>{item.name} - {item.percent}%</span>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div style={{ fontSize: '14px', color: '#6B6B6B', padding: '24px' }}>No lead data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Profile views over time (last 6 months) */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginBottom: '32px'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, marginBottom: '8px', color: '#1A1A1A' }}>
          Profile views (last 6 months)
        </h3>
        <div style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '20px' }}>How many people visited your profile each month</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '140px' }}>
          {(analytics?.monthlyProfileViews || analytics?.overview?.monthlyProfileViews || []).length > 0
            ? (analytics?.monthlyProfileViews || analytics?.overview?.monthlyProfileViews || []).map((month, idx) => {
              const maxV = Math.max(...(analytics?.monthlyProfileViews || analytics?.overview?.monthlyProfileViews || []).map(m => m.views || 0), 1)
              const h = maxV > 0 ? ((month.views || 0) / maxV) * 100 : 0
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '100%', maxWidth: '48px', height: `${Math.max(h, 4)}px`, background: 'linear-gradient(to top, #2196F3, #1976D2)', borderRadius: '4px 4px 0 0', marginBottom: '8px' }} />
                  <div style={{ fontSize: '11px', color: '#6B6B6B', textAlign: 'center' }}>{month.month}</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#1A1A1A' }}>{month.views || 0}</div>
                </div>
              )
            })
            : Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', maxWidth: '48px', height: '4px', background: '#E0E0E0', borderRadius: '4px', marginBottom: '8px' }} />
                <div style={{ fontSize: '11px', color: '#6B6B6B' }}>—</div>
              </div>
            ))}
        </div>
      </div>

      {/* Responsive Data Tables */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 600,
            margin: 0,
            marginBottom: '20px',
            color: '#1A1A1A'
          }}>
            Performance Overview
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E0E0E0' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#6B6B6B', fontWeight: 600 }}>Item</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#6B6B6B', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#6B6B6B', fontWeight: 600 }}>Views</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#6B6B6B', fontWeight: 600 }}>Likes</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#6B6B6B', fontWeight: 600 }}>Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              {analytics?.topItems?.slice(0, 3).map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #F5F5F5' }}>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#1A1A1A' }}>{idx + 1}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#1A1A1A' }}>{item.name || 'Item'}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#1A1A1A' }}>{item.views || '0'}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#1A1A1A' }}>{item.likes || '0'}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#1A1A1A' }}>{item.conversionRate || '0'}%</td>
                </tr>
              )) || (
                  <tr>
                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#6B6B6B', fontSize: '14px' }}>
                      No data available
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 600,
            margin: 0,
            marginBottom: '20px',
            color: '#1A1A1A'
          }}>
            Top Performing Portfolio Items
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E0E0E0' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#6B6B6B', fontWeight: 600 }}>Views</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#6B6B6B', fontWeight: 600 }}>Likes</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#6B6B6B', fontWeight: 600 }}>Referral</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#6B6B6B', fontWeight: 600 }}>Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              {analytics?.topPortfolio?.slice(0, 3).map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #F5F5F5' }}>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#1A1A1A' }}>{item.views || '0'}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#1A1A1A' }}>{item.likes || '0'}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#1A1A1A' }}>{item.referral || '0'}%</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#1A1A1A' }}>{item.conversionRate || '0'}%</td>
                </tr>
              )) || (
                  <tr>
                    <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#6B6B6B', fontSize: '14px' }}>
                      No data available
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function InspirationFeedSection({ vendor }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({ caption: '', description: '', category: 'All' })
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [subscriptionInfo, setSubscriptionInfo] = useState(null)
  const [editingPost, setEditingPost] = useState(null)
  const [editCaption, setEditCaption] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategory, setEditCategory] = useState('All')
  const [savingEdit, setSavingEdit] = useState(false)
  const [selectedPostForAnalytics, setSelectedPostForAnalytics] = useState(null)
  const [postLikes, setPostLikes] = useState([])
  const [postComments, setPostComments] = useState([])
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [focusedPost, setFocusedPost] = useState(null)

  useEffect(() => {
    fetchInspirationPosts()
    fetchSubscriptionInfo()
  }, [])

  useEffect(() => {
    if (editingPost) {
      setEditCaption(editingPost.caption || '')
      setEditDescription(editingPost.description || '')
      setEditCategory(editingPost.category || 'All')
    }
  }, [editingPost])

  const fetchInspirationPosts = async () => {
    try {
      const token = await auth.currentUser?.getIdToken()
      // Fetch vendor's inspiration posts
      const res = await fetch(`/api/inspiration-feed?vendor_id=${vendor.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setPosts(data.posts || [])
    } catch (err) {
      console.error('Failed to fetch inspiration posts:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubscriptionInfo = async () => {
    try {
      const res = await fetch(`/api/subscription/check?vendor_id=${vendor.id}`)
      const data = await res.json()
      setSubscriptionInfo(data)
    } catch (err) {
      console.error('Failed to fetch subscription info:', err)
    }
  }

  const fetchPostLikes = async (postId) => {
    setLoadingAnalytics(true)
    try {
      const res = await fetch(`/api/inspiration-feed/likes?post_id=${postId}`)
      const data = await res.json()
      setPostLikes(data.likes || [])
    } catch (err) {
      console.error('Failed to fetch likes:', err)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  const fetchPostComments = async (postId) => {
    setLoadingAnalytics(true)
    try {
      const res = await fetch(`/api/inspiration-feed/comments?post_id=${postId}`)
      const data = await res.json()
      setPostComments(data.comments || [])
    } catch (err) {
      console.error('Failed to fetch comments:', err)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingPost) return
    setSavingEdit(true)
    try {
      const user = auth.currentUser
      if (!user) {
        alert('Please sign in to edit posts')
        setSavingEdit(false)
        return
      }
      const token = await user.getIdToken(true)
      const res = await fetch('/api/inspiration-feed/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          post_id: editingPost.id,
          caption: editCaption,
          description: editDescription,
          category: editCategory
        })
      })
      const data = await res.json()
      if (res.ok) {
        setPosts(prev => prev.map(p => p.id === editingPost.id ? data.post : p))
        setEditingPost(null)
        alert('Post updated successfully!')
      } else {
        alert(data.error || 'Failed to update post')
      }
    } catch (err) {
      console.error('Failed to update post:', err)
      const msg = err?.message || ''
      if (/invalid_grant|JWT|token|expired|signature/i.test(msg)) {
        alert('Session expired. Please sign out, sign in again, and try editing.')
      } else {
        alert('Failed to update post')
      }
    } finally {
      setSavingEdit(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Allow images and videos
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')

      if (!isImage && !isVideo) {
        alert('Please select an image or video file')
        return
      }

      // Check file size (max 100MB for videos, 10MB for images)
      const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024
      if (file.size > maxSize) {
        alert(`File size too large. Maximum size: ${isVideo ? '100MB' : '10MB'}`)
        return
      }

      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select an image or video file')
      return
    }

    setUploading(true)
    try {
      const user = auth.currentUser
      if (!user) {
        alert('Please login to upload files')
        setUploading(false)
        return
      }

      // Get a fresh token; if this fails (e.g. invalid_grant), ask user to re-login before hitting the server
      let token
      try {
        token = await user.getIdToken(true)
      } catch (tokenErr) {
        const msg = tokenErr?.message || ''
        if (/invalid_grant|JWT|token|expired|signature/i.test(msg)) {
          alert('Session expired. Please sign out, sign in again, and try uploading.')
        } else {
          alert('Could not verify your session. Please sign in again.')
        }
        setUploading(false)
        return
      }

      const uploadFormData = new FormData()
      uploadFormData.append('file', selectedFile)

      const uploadRes = await fetch('/api/upload-file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      })

      let uploadData
      if (!uploadRes.ok) {
        const contentType = uploadRes.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          uploadData = await uploadRes.json()
          throw new Error(uploadData.error || 'Failed to upload file')
        } else {
          const errorText = await uploadRes.text()
          throw new Error(`Upload failed (${uploadRes.status}): ${errorText.substring(0, 200)}`)
        }
      }

      uploadData = await uploadRes.json()

      // Refresh token again for the second API call (in case upload took time)
      const freshToken = await user.getIdToken(true)
      // Save inspiration post with public URL (use state formData for caption/description/category)
      const res = await fetch('/api/inspiration-feed/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${freshToken}`
        },
        body: JSON.stringify({
          vendor_id: vendor.id,
          media_url: uploadData.publicUrl,
          media_type: selectedFile.type.startsWith('video/') ? 'video' : 'image',
          caption: formData.caption || '',
          description: formData.description || '',
          category: formData.category || 'All'
        })
      })
      const data = await res.json()

      if (res.ok) {
        alert(vendor?.verified
          ? 'Inspiration post uploaded and approved!'
          : 'Inspiration post uploaded! Pending admin approval.')
        setFormData({ caption: '', description: '', category: 'All' })
        setSelectedFile(null)
        setPreview(null)
        setShowUpload(false)
        fetchInspirationPosts()
        fetchSubscriptionInfo()
      } else {
        alert(data.error || 'Failed to upload post')
      }
    } catch (err) {
      console.error('Failed to upload:', err)
      let errorMessage = err.message || 'Failed to upload post. Please try again.'
      if (errorMessage.includes('invalid_grant') || errorMessage.includes('JWT') || errorMessage.includes('Session expired')) {
        errorMessage = 'Session expired. Please sign out, sign in again, and try uploading. See UPLOAD_SESSION_FIX.md for setup.'
      } else if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        errorMessage = 'Please sign in again to upload posts.'
      } else if (errorMessage.includes('Upload service unavailable') || errorMessage.includes('Firebase Storage is not configured')) {
        errorMessage = 'Upload service not configured. Add firebase-service-account.json and set FIREBASE_STORAGE_BUCKET. See UPLOAD_SESSION_FIX.md.'
      }
      alert(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const categories = ['All', 'Decor', 'Photography', 'Catering', 'Venues', 'Fashion', 'Flowers', 'Makeup', 'Invitations']

  return (
    <div>
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24
        }}>
          <div>
            <h3 style={{
              fontSize: 20,
              fontWeight: 600,
              margin: 0,
              marginBottom: 8,
              color: 'var(--text-dark)'
            }}>
              Inspiration Feed Posts
            </h3>
            {subscriptionInfo && (
              <div style={{
                fontSize: 13,
                color: 'var(--text-muted)'
              }}>
                {subscriptionInfo.current.posts} / {subscriptionInfo.limits.posts} posts this month
                {subscriptionInfo.remaining.posts === 0 && (
                  <span style={{ color: 'var(--accent-rose)', marginLeft: 8 }}>
                    • Limit reached
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            disabled={subscriptionInfo && subscriptionInfo.remaining.posts === 0}
            className="btn-primary"
            style={{
              opacity: subscriptionInfo && subscriptionInfo.remaining.posts === 0 ? 0.5 : 1
            }}
          >
            {showUpload ? 'Cancel' : '+ Upload Post'}
          </button>
        </div>

        {showUpload && (
          <div style={{
            padding: 28,
            background: 'linear-gradient(to bottom, #FAFAFA, #F5F5F5)',
            borderRadius: 16,
            marginBottom: 24,
            border: '1px solid #E5E7EB',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: '#111827' }}>Upload Inspiration Post</h4>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>Add a photo or video to showcase your work. Images up to 10MB, videos up to 100MB.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Photo or video</label>
                <div
                  onClick={() => document.getElementById('inspiration-file-input').click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#E91E63'; e.currentTarget.style.background = '#FDF2F8' }}
                  onDragLeave={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.background = 'white' }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.currentTarget.style.borderColor = '#D1D5DB'
                    e.currentTarget.style.background = 'white'
                    const file = e.dataTransfer.files?.[0]
                    if (file) handleFileSelect({ target: { files: [file] } })
                  }}
                  style={{
                    border: '2px dashed #D1D5DB',
                    borderRadius: 12,
                    padding: 24,
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: preview ? 'transparent' : 'white',
                    transition: 'all 0.2s ease',
                    minHeight: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <input
                    id="inspiration-file-input"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  {preview ? (
                    <div style={{ width: '100%', maxHeight: 320, borderRadius: 8, overflow: 'hidden', background: '#111' }}>
                      {selectedFile?.type?.startsWith('video/') ? (
                        <video src={preview} controls style={{ width: '100%', maxHeight: 320, display: 'block' }} />
                      ) : (
                        <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: 320, objectFit: 'contain', display: 'block' }} />
                      )}
                      <div style={{ marginTop: 8, fontSize: 12, color: '#6B7280' }}>Click or drag another file to replace</div>
                    </div>
                  ) : (
                    <>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 24 }}>📷</span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Click or drag file here</div>
                      <div style={{ fontSize: 13, color: '#6B7280' }}>PNG, JPG, GIF, WebP or MP4, WebM</div>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Caption</label>
                  <input
                    type="text"
                    value={formData.caption}
                    onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                    placeholder="Short caption for your post"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid #E5E7EB',
                      fontSize: 14,
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your work (optional)"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid #E5E7EB',
                      fontSize: 14,
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid #E5E7EB',
                      fontSize: 14,
                      background: 'white',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                  style={{
                    marginTop: 8,
                    padding: '14px 24px',
                    borderRadius: 10,
                    border: 'none',
                    background: (uploading || !selectedFile) ? '#D1D5DB' : '#E91E63',
                    color: 'white',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: (uploading || !selectedFile) ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.8 : 1,
                    transition: 'background 0.2s'
                  }}
                >
                  {uploading ? 'Uploading…' : 'Upload Post'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            Loading posts...
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
            <div>No inspiration posts yet</div>
            <button
              onClick={() => setShowUpload(true)}
              className="btn-primary"
              style={{ marginTop: 16 }}
            >
              Upload Your First Post
            </button>
          </div>
        )}

        {!loading && posts.length > 0 && !focusedPost && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: posts.length === 1 ? 'minmax(0, 560px)' : 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 20,
            justifyContent: posts.length === 1 ? 'center' : 'stretch'
          }}>
            {posts.map(post => (
              <div
                key={post.id}
                style={{
                  position: 'relative',
                  paddingTop: '75%',
                  borderRadius: 18,
                  overflow: 'hidden',
                  background: 'var(--bg-warm)',
                  cursor: 'pointer',
                  boxShadow: '0 20px 40px rgba(15,23,42,0.55)',
                  border: '1px solid rgba(15,23,42,0.6)',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'
                  e.currentTarget.style.boxShadow = '0 26px 60px rgba(15,23,42,0.65)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(15,23,42,0.55)'
                }}
                onClick={() => setFocusedPost(post)}
              >
                {(post.media_type === 'video' || post.media_url?.match(/\.(mp4|webm|mov|avi)$/i)) ? (
                  <video
                    src={post.media_url}
                    controls
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <img
                    src={post.media_url}
                    alt={post.caption}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                )}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(to top, rgba(15,23,42,0.95), rgba(15,23,42,0.3), transparent)',
                  padding: 14,
                  color: 'white',
                  fontSize: 12
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {post.caption || 'Untitled'}
                    </div>
                    {post.category && (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: 'rgba(15,23,42,0.9)',
                        border: '1px solid rgba(148,163,184,0.7)',
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em'
                      }}>
                        {post.category}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 10, fontSize: 11, alignItems: 'center', opacity: 0.95 }}>
                      <span title="Likes">❤️ {post.likes || 0}</span>
                      <span title="Comments">💬 {post.comments_count || 0}</span>
                      <span title="Views">👁️ {post.views_count || 0}</span>
                    </div>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: post.approved ? '#10b981' : 'var(--accent-gold)',
                      fontSize: 10
                    }}>
                      {post.approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.9, marginTop: 4 }}>
                    👁️ {post.views_count ?? 0} views · ❤️ {post.likes ?? 0} likes
                    {(post.profile_visits_from_post ?? 0) > 0 && (
                      <> · 📍 {post.profile_visits_from_post} profile visit{post.profile_visits_from_post !== 1 ? 's' : ''} from post</>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Focused post view */}
        {focusedPost && (
          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              onClick={() => setFocusedPost(null)}
              style={{
                marginBottom: 16,
                padding: '8px 14px',
                borderRadius: 999,
                border: '1px solid #E5E7EB',
                background: '#F9FAFB',
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              ← Back to all posts
            </button>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 24,
              alignItems: 'flex-start'
            }}>
              <div style={{
                position: 'relative',
                borderRadius: 24,
                overflow: 'hidden',
                background: '#020617',
                boxShadow: '0 30px 80px rgba(15,23,42,0.85)',
                minHeight: 360
              }}>
                {(focusedPost.media_type === 'video' || focusedPost.media_url?.match(/\.(mp4|webm|mov|avi)$/i)) ? (
                  <video
                    src={focusedPost.media_url}
                    controls
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                ) : (
                  <img
                    src={focusedPost.media_url}
                    alt={focusedPost.caption}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                )}
              </div>
              <div style={{
                background: 'white',
                borderRadius: 20,
                border: '1px solid #E5E7EB',
                padding: 20,
                boxShadow: '0 10px 30px rgba(15,23,42,0.12)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                      {focusedPost.caption || 'Untitled post'}
                    </div>
                    {focusedPost.description && (
                      <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.6 }}>
                        {focusedPost.description}
                      </div>
                    )}
                  </div>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: focusedPost.approved ? '#ECFDF3' : '#FFFBEB',
                    color: focusedPost.approved ? '#166534' : '#92400E',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    whiteSpace: 'nowrap'
                  }}>
                    {focusedPost.approved ? 'Approved' : 'Pending'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                  {focusedPost.category && (
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em'
                    }}>
                      {focusedPost.category}
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: '#4B5563' }}>
                    👁️ {focusedPost.views_count ?? 0} views
                  </span>
                  <span style={{ fontSize: 12, color: '#4B5563' }}>
                    ❤️ {focusedPost.likes ?? 0} likes
                  </span>
                  <span style={{ fontSize: 12, color: '#4B5563' }}>
                    💬 {focusedPost.comments_count ?? 0} comments
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPostForAnalytics(focusedPost)
                      setPostLikes([])
                      setPostComments([])
                      fetchPostLikes(focusedPost.id)
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 999,
                      border: '1px solid #E5E7EB',
                      background: '#F9FAFB',
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    View who liked
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPost(focusedPost)
                    }}
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: 13 }}
                  >
                    ✏️ Edit post
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm('Delete this post? This cannot be undone.')) return
                      try {
                        const token = await auth.currentUser?.getIdToken()
                        const res = await fetch('/api/inspiration-feed/delete', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ post_id: focusedPost.id })
                        })
                        if (res.ok) {
                          setPosts(prev => prev.filter(p => p.id !== focusedPost.id))
                          setFocusedPost(null)
                        } else {
                          const d = await res.json()
                          alert(d.error || 'Failed to delete')
                        }
                      } catch (err) {
                        alert('Failed to delete post')
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 999,
                      border: '1px solid rgba(239,68,68,0.8)',
                      background: 'rgba(239,68,68,0.06)',
                      color: '#B91C1C',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Post Modal */}
        {editingPost && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
            onClick={() => setEditingPost(null)}
          >
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: 24,
              maxWidth: 500,
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginTop: 0, marginBottom: 20 }}>Edit Post</h3>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Caption</label>
                <input
                  type="text"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="Enter caption..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dbdbdb',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Enter description..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dbdbdb',
                    borderRadius: '4px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dbdbdb',
                    borderRadius: '4px',
                    fontSize: '14px',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setEditingPost(null)}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #dbdbdb',
                    borderRadius: '4px',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '4px',
                    background: '#e91e63',
                    color: 'white',
                    cursor: savingEdit ? 'not-allowed' : 'pointer'
                  }}
                >
                  {savingEdit ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Modal (Likes/Comments) */}
        {selectedPostForAnalytics && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
            onClick={() => {
              setSelectedPostForAnalytics(null)
              setPostLikes([])
              setPostComments([])
            }}
          >
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: 24,
              maxWidth: 500,
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#262626' }}>
                  Post Analytics
                </h3>
                <button
                  onClick={() => {
                    setSelectedPostForAnalytics(null)
                    setPostLikes([])
                    setPostComments([])
                  }}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: 24,
                    color: '#8e8e8e',
                    padding: 0,
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>
              {selectedPostForAnalytics.caption && (
                <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: '4px' }}>
                  <div style={{ fontSize: 13, color: '#8e8e8e', marginBottom: 4 }}>Post Caption:</div>
                  <div style={{ fontSize: 14, color: '#262626', fontWeight: 500 }}>{selectedPostForAnalytics.caption}</div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: '1px solid #efefef', paddingBottom: 12 }}>
                <button
                  onClick={() => {
                    setPostLikes([])
                    setPostComments([])
                    fetchPostLikes(selectedPostForAnalytics.id)
                  }}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    background: postLikes.length > 0 ? '#e91e63' : '#efefef',
                    color: postLikes.length > 0 ? 'white' : '#262626',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 14
                  }}
                >
                  Likes ({selectedPostForAnalytics.likes || 0})
                </button>
                <button
                  onClick={() => {
                    setPostLikes([])
                    setPostComments([])
                    fetchPostComments(selectedPostForAnalytics.id)
                  }}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    background: postComments.length > 0 ? '#e91e63' : '#efefef',
                    color: postComments.length > 0 ? 'white' : '#262626',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 14
                  }}
                >
                  Comments ({selectedPostForAnalytics.comments_count || 0})
                </button>
              </div>
              {loadingAnalytics ? (
                <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
              ) : postLikes.length > 0 ? (
                <div>
                  <h4 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>People who liked this post</h4>
                  {postLikes.map(like => (
                    <div key={like.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #efefef' }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: '#efefef',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#262626'
                      }}>
                        {like.users?.name ? like.users.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#262626' }}>{like.users?.name || 'User'}</div>
                        <div style={{ fontSize: '12px', color: '#8e8e8e' }}>
                          {new Date(like.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : postComments.length > 0 ? (
                <div>
                  <h4 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Comments on this post</h4>
                  {postComments.map(comment => (
                    <div key={comment.id} style={{ padding: '12px 0', borderBottom: '1px solid #efefef' }}>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: '#efefef',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          fontWeight: 600,
                          color: '#262626',
                          flexShrink: 0
                        }}>
                          {comment.users?.name ? comment.users.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, marginBottom: 4, color: '#262626' }}>{comment.users?.name || 'User'}</div>
                          <div style={{ color: '#262626', marginBottom: 4 }}>{comment.comment_text}</div>
                          <div style={{ fontSize: '12px', color: '#8e8e8e' }}>
                            {new Date(comment.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#8e8e8e' }}>
                  Click on "Likes" or "Comments" to view details
                </div>
              )}
              <button
                onClick={() => {
                  setSelectedPostForAnalytics(null)
                  setPostLikes([])
                  setPostComments([])
                }}
                style={{
                  marginTop: 20,
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #dbdbdb',
                  borderRadius: '4px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SubscriptionSection({ vendor }) {
  const [subscriptionInfo, setSubscriptionInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchSubscriptionInfo()
  }, [])

  const fetchSubscriptionInfo = async () => {
    try {
      const res = await fetch(`/api/subscription/check?vendor_id=${vendor.id}`)
      const data = await res.json()
      setSubscriptionInfo(data)
    } catch (err) {
      console.error('Failed to fetch subscription info:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async () => {
    setProcessing(true)
    try {
      // Load Razorpay script dynamically if not already loaded
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://checkout.razorpay.com/v1/checkout.js'
          script.async = true
          script.onload = resolve
          script.onerror = () => reject(new Error('Failed to load Razorpay script'))
          document.head.appendChild(script)
        })
      }

      const token = await auth.currentUser?.getIdToken()
      const res = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vendor_id: vendor.id,
          plan: 'premium'
        })
      })
      const data = await res.json()

      if (res.ok && data.order_id) {
        // Initialize Razorpay checkout with payment
        const options = {
          key: data.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: data.amount,
          currency: 'INR',
          name: 'Wedeption Premium',
          description: 'Premium Subscription - ₹399/month',
          order_id: data.order_id,
          handler: function (response) {
            alert('Payment successful! Your premium subscription is now active.')
            fetchSubscriptionInfo()
          },
          prefill: {
            name: vendor.business_name,
            email: vendor.email || '',
            contact: vendor.phone || ''
          },
          theme: {
            color: '#E91E63'
          },
          modal: {
            ondismiss: function () {
              setProcessing(false)
            }
          }
        }
        const rzp = new window.Razorpay(options)
        rzp.on('payment.failed', function (response) {
          alert('Payment failed. Please try again.')
          setProcessing(false)
        })
        rzp.open()
      } else {
        alert(data.error || 'Failed to create subscription')
        setProcessing(false)
      }
    } catch (err) {
      console.error('Failed to subscribe:', err)
      if (err.message?.includes('Razorpay')) {
        alert('Failed to load payment gateway. Please refresh the page and try again.')
      } else {
        alert('Failed to initiate subscription: ' + (err.message || 'Unknown error'))
      }
      setProcessing(false)
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
  }

  const isPremium = subscriptionInfo?.is_premium || false

  return (
    <div>
      <h1 style={{
        fontSize: '28px',
        fontWeight: 700,
        margin: 0,
        marginBottom: '32px',
        color: '#1A1A1A'
      }}>
        Manage Your Subscription
      </h1>

      <div style={{
        background: 'linear-gradient(135deg, rgba(233, 30, 99, 0.08) 0%, rgba(233, 30, 99, 0.03) 100%)',
        border: '1px solid rgba(233, 30, 99, 0.18)',
        borderRadius: '16px',
        padding: '22px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A' }}>
            Enjoy all services now free
          </div>
          <div style={{
            padding: '6px 12px',
            borderRadius: 999,
            background: '#fff',
            border: '1px solid rgba(233, 30, 99, 0.25)',
            color: '#E91E63',
            fontWeight: 800,
            fontSize: 12
          }}>
            Coming soon
          </div>
        </div>
        <div style={{ marginTop: 8, color: '#555', fontSize: 14, lineHeight: 1.6 }}>
          Subscription plans are launching soon. Until then, you have full access to all vendor features at no cost.
        </div>
      </div>

      {/* Billing History */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: 600,
          margin: 0,
          marginBottom: '24px',
          color: '#1A1A1A'
        }}>
          Billing History
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E0E0E0' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#6B6B6B', fontWeight: 600 }}>Invoice ID</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#6B6B6B', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#6B6B6B', fontWeight: 600 }}>Plan</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#6B6B6B', fontWeight: 600 }}>Amount</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#6B6B6B', fontWeight: 600 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {subscriptionInfo?.billingHistory?.slice(0, 3).map((invoice, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #F5F5F5' }}>
                <td style={{ padding: '12px', fontSize: '14px', color: '#1A1A1A' }}>{invoice.id || idx + 1}</td>
                <td style={{ padding: '12px', fontSize: '14px', color: '#1A1A1A' }}>
                  {invoice.date ? new Date(invoice.date).toLocaleDateString() : '-'}
                </td>
                <td style={{ padding: '12px', fontSize: '14px', color: '#1A1A1A' }}>{invoice.plan || 'Pro Plan'}</td>
                <td style={{ padding: '12px', fontSize: '14px', color: '#1A1A1A' }}>${invoice.amount || '99'}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>
                  <button style={{
                    padding: '4px 12px',
                    background: 'transparent',
                    border: 'none',
                    color: '#6B6B6B',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}>
                    Download
                  </button>
                </td>
              </tr>
            )) || (
                <tr>
                  <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#6B6B6B', fontSize: '14px' }}>
                    No billing history available
                  </td>
                </tr>
              )}
          </tbody>
        </table>
        <div style={{ marginTop: '24px' }}>
          <button style={{
            padding: '8px 16px',
            background: 'transparent',
            border: 'none',
            color: '#E91E63',
            fontSize: '14px',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}>
            Cancel Subscription
          </button>
        </div>
      </div>
    </div>
  )
}

function SubscriptionBenefitsComparison({ isPremium, onSubscribe, processing }) {
  const benefits = {
    free: {
      posts: '10 posts/month',
      portfolio: '10 items',
      leads: '3-5 leads/month',
      visibility: 'Lower visibility',
      features: ['Basic dashboard', 'Lead management', 'Reviews']
    },
    premium: {
      posts: '50 posts/month',
      portfolio: 'Unlimited',
      leads: '5-10 leads/month',
      visibility: 'Higher visibility',
      features: ['All dashboard features', 'Advanced analytics', 'Priority support', 'Premium badge', 'Featured listings']
    }
  }

  return (
    <div className="card" style={{ padding: 24 }}>
      <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, textAlign: 'center' }}>
        Choose Your Plan
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 24
      }}>
        {/* Free Plan */}
        <div style={{
          padding: 24,
          border: '2px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          background: 'white',
          position: 'relative'
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Free</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 24 }}>
            ₹0<span style={{ fontSize: 16, fontWeight: 400, color: 'var(--text-muted)' }}>/month</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: 24 }}>
            <li style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
              ✓ {benefits.free.posts}
            </li>
            <li style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
              ✓ {benefits.free.portfolio}
            </li>
            <li style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
              ✓ {benefits.free.leads}
            </li>
            <li style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
              ✓ {benefits.free.visibility}
            </li>
            {benefits.free.features.map((feature, idx) => (
              <li key={idx} style={{ padding: '8px 0', fontSize: 13, color: 'var(--text-muted)' }}>
                • {feature}
              </li>
            ))}
          </ul>
          {isPremium && (
            <div style={{
              padding: '8px 12px',
              background: '#10b981',
              color: 'white',
              borderRadius: 'var(--radius-full)',
              fontSize: 12,
              fontWeight: 600,
              textAlign: 'center'
            }}>
              Current Plan
            </div>
          )}
        </div>

        {/* Premium Plan */}
        <div style={{
          padding: 24,
          border: '2px solid var(--accent-rose)',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, rgba(233,30,99,0.05) 0%, rgba(212,175,55,0.03) 100%)',
          position: 'relative'
        }}>
          {!isPremium && (
            <div style={{
              position: 'absolute',
              top: -12,
              right: 24,
              padding: '4px 12px',
              background: 'var(--accent-rose)',
              color: 'white',
              borderRadius: 'var(--radius-full)',
              fontSize: 11,
              fontWeight: 600
            }}>
              RECOMMENDED
            </div>
          )}
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Premium</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent-rose)', marginBottom: 24 }}>
            ₹399<span style={{ fontSize: 16, fontWeight: 400, color: 'var(--text-muted)' }}>/month</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: 24 }}>
            <li style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
              ✓ {benefits.premium.posts}
            </li>
            <li style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
              ✓ {benefits.premium.portfolio}
            </li>
            <li style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
              ✓ {benefits.premium.leads}
            </li>
            <li style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
              ✓ {benefits.premium.visibility}
            </li>
            {benefits.premium.features.map((feature, idx) => (
              <li key={idx} style={{ padding: '8px 0', fontSize: 13, color: 'var(--text-dark)', fontWeight: 500 }}>
                ✓ {feature}
              </li>
            ))}
          </ul>
          {isPremium ? (
            <div style={{
              padding: '8px 12px',
              background: '#10b981',
              color: 'white',
              borderRadius: 'var(--radius-full)',
              fontSize: 12,
              fontWeight: 600,
              textAlign: 'center'
            }}>
              Current Plan
            </div>
          ) : (
            <button
              onClick={onSubscribe}
              disabled={processing}
              className="btn-primary"
              style={{
                width: '100%',
                opacity: processing ? 0.6 : 1
              }}
            >
              {processing ? 'Processing...' : 'Subscribe Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function AvailabilitySection({ vendor }) {
  const [month, setMonth] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })
  const [availability, setAvailability] = useState({})
  const [selectedDate, setSelectedDate] = useState(null)
  const [status, setStatus] = useState('available')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [acceptingLeads, setAcceptingLeads] = useState(true)
  const [maxLeadsPerDay, setMaxLeadsPerDay] = useState(2)
  const [timeSlots, setTimeSlots] = useState([
    { id: 1, name: 'Morning (9 AM - 12 PM)' },
    { id: 2, name: 'December 24, 2024 (Vacation)' }
  ])
  const [showDateRange, setShowDateRange] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [rangeStatus, setRangeStatus] = useState('available')

  const statuses = {
    available: { label: 'Available', color: '#16a34a', bgColor: '#16a34a', pattern: 'solid' },
    booked: { label: 'Already Booked', color: '#E91E63', bgColor: '#E91E63', pattern: 'striped' },
    blocked: { label: 'Unavailable', color: '#6B7280', bgColor: '#6B7280', pattern: 'solid' }
  }

  useEffect(() => {
    fetchAvailability()
  }, [month])

  const fetchAvailability = async () => {
    try {
      setLoading(true)
      const year = month.getFullYear()
      const m = month.getMonth() + 1
      // fetch all for vendor; filter client-side to keep API simple
      const res = await fetch(`/api/vendor/availability?vendor_id=${vendor.id}`)
      const data = await res.json()
      if (res.ok) {
        const map = {}
        data.availability?.forEach(entry => {
          map[entry.date] = entry
        })
        setAvailability(map)
      }
    } catch (err) {
      console.error('Failed to fetch availability', err)
    } finally {
      setLoading(false)
    }
  }

  const daysInMonth = () => {
    const start = new Date(month)
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    return { start, end, days: end.getDate() }
  }

  const handleSave = async () => {
    if (!selectedDate) {
      alert('Select a date first')
      return
    }
    try {
      setSaving(true)
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch('/api/availability/set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vendor_id: vendor.id,
          date: selectedDate,
          status,
          notes: notes || ''
        })
      })
      const data = await res.json()
      if (res.ok) {
        await fetchAvailability()
        setSelectedDate(null)
        setNotes('')
        alert('Availability updated')
      } else {
        alert(data.error || 'Failed to update availability')
      }
    } catch (err) {
      console.error('Save availability error', err)
      alert(err.message || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleDateRangeSave = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates')
      return
    }
    if (new Date(startDate) > new Date(endDate)) {
      alert('Start date must be before end date')
      return
    }
    try {
      setSaving(true)
      const token = await auth.currentUser?.getIdToken()

      // Generate all dates in range
      const start = new Date(startDate)
      const end = new Date(endDate)
      const dates = []
      const current = new Date(start)

      while (current <= end) {
        dates.push(current.toISOString().slice(0, 10))
        current.setDate(current.getDate() + 1)
      }

      // Save all dates in range
      const promises = dates.map(date =>
        fetch('/api/availability/set', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            vendor_id: vendor.id,
            date: date,
            status: rangeStatus,
            notes: notes || ''
          })
        })
      )

      await Promise.all(promises)
      await fetchAvailability()
      setShowDateRange(false)
      setStartDate('')
      setEndDate('')
      setNotes('')
      alert(`Availability updated for ${dates.length} days`)
    } catch (err) {
      console.error('Save date range error', err)
      alert(err.message || 'Failed to update availability')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTimeSlot = (id) => {
    setTimeSlots(prev => prev.filter(slot => slot.id !== id))
  }

  const goMonth = (delta) => {
    const d = new Date(month)
    d.setMonth(d.getMonth() + delta)
    setMonth(d)
    setSelectedDate(null)
  }

  const { start, days } = daysInMonth()
  const startWeekday = start.getDay() // 0=Sun
  const todayStr = new Date().toISOString().slice(0, 10)

  const renderCell = (day) => {
    const dateObj = new Date(month.getFullYear(), month.getMonth(), day)
    const dateStr = dateObj.toISOString().slice(0, 10)
    const entry = availability[dateStr]
    const cellStatus = entry?.status
    const isSelected = selectedDate === dateStr
    const isToday = dateStr === todayStr

    // Determine cell styling based on status
    let cellBackground = 'white'
    let cellBorder = '#E0E0E0'
    let cellTextColor = '#1A1A1A'
    let hasPattern = false

    if (cellStatus === 'available') {
      cellBackground = '#16a34a'
      cellBorder = '#16a34a'
      cellTextColor = 'white'
    } else if (cellStatus === 'booked') {
      cellBackground = '#E91E63'
      cellBorder = '#E91E63'
      cellTextColor = 'white'
      hasPattern = true // Striped pattern
    } else if (cellStatus === 'blocked') {
      cellBackground = '#6B7280'
      cellBorder = '#6B7280'
      cellTextColor = 'white'
    }

    if (isSelected) {
      cellBorder = '#E91E63'
      if (!cellStatus) {
        cellBackground = '#FFF3F8'
        cellTextColor = '#1A1A1A'
      }
    }

    return (
      <button
        className="avail-cal-cell"
        key={dateStr}
        onClick={() => {
          setSelectedDate(dateStr)
          setStatus(cellStatus || 'available')
          setNotes(entry?.notes || entry?.note || '')
        }}
        style={{
          width: '100%',
          aspectRatio: '1',
          borderRadius: '8px',
          border: `2px solid ${isSelected ? '#E91E63' : cellBorder}`,
          background: hasPattern ?
            `repeating-linear-gradient(
              45deg,
              ${cellBackground},
              ${cellBackground} 10px,
              rgba(255,255,255,0.3) 10px,
              rgba(255,255,255,0.3) 20px
            )` : cellBackground,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: isSelected ? '0 0 0 3px rgba(233, 30, 99, 0.3)' : 'none',
          minHeight: '60px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = isSelected ? '0 0 0 3px rgba(233, 30, 99, 0.3)' : 'none'
        }}
      >
        <span style={{
          fontWeight: 700,
          fontSize: '16px',
          color: cellTextColor
        }}>
          {day}
        </span>
      </button>
    )
  }

  const weeks = []
  let day = 1
  const totalCells = Math.ceil((startWeekday + days) / 7) * 7
  for (let i = 0; i < totalCells; i++) {
    if (i < startWeekday || day > days) {
      weeks.push(null)
    } else {
      weeks.push(day)
      day++
    }
  }

  return (
    <div>
      <h1 className="avail-cal-title" style={{
        fontSize: '28px',
        fontWeight: 700,
        margin: 0,
        marginBottom: '32px',
        color: '#1A1A1A'
      }}>
        Availability Calendar
      </h1>

      <div className="avail-cal-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        {/* Left Panel - Calendar */}
        <div className="avail-cal-card" style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          {/* Month Navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 600,
              margin: 0,
              color: '#1A1A1A'
            }}>
              {month.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <div style={{
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={() => goMonth(-1)}
                style={{
                  padding: '8px 12px',
                  background: 'white',
                  border: '1px solid #E0E0E0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ←
              </button>
              <button
                onClick={() => goMonth(1)}
                style={{
                  padding: '8px 12px',
                  background: 'white',
                  border: '1px solid #E0E0E0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                →
              </button>
            </div>
          </div>

          {/* Calendar Days Header */}
          <div className="avail-cal-dayheader" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px',
            marginBottom: '12px'
          }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} style={{
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '13px',
                color: '#6B6B6B',
                padding: '8px 0'
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="avail-cal-cells" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px',
            marginBottom: '24px'
          }}>
            {weeks.map((d, idx) => d ? renderCell(d) : (
              <div key={idx} style={{
                aspectRatio: '1',
                borderRadius: '8px',
                background: '#F9F9F9'
              }} />
            ))}
          </div>

          {/* When a date is selected: show status selector so user can set Available / Booked / Unavailable */}
          {selectedDate && (
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              background: '#F8F9FA',
              borderRadius: '12px',
              border: '1px solid #E9ECEF'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#6B6B6B', marginBottom: '12px' }}>
                Set status for {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[
                  { value: 'available', label: 'Available', bg: '#16a34a', border: '#16a34a' },
                  { value: 'booked', label: 'Already Booked', bg: '#E91E63', border: '#E91E63' },
                  { value: 'blocked', label: 'Unavailable', bg: '#6B7280', border: '#6B7280' }
                ].map(({ value, label, bg, border }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatus(value)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: `2px solid ${status === value ? border : '#E0E0E0'}`,
                      background: status === value ? bg : 'white',
                      color: status === value ? 'white' : '#1A1A1A',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: status === value ? `0 2px 8px ${bg}40` : 'none'
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {notes !== undefined && (
                <input
                  type="text"
                  placeholder="Optional notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    marginTop: '12px',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #E0E0E0',
                    fontSize: '14px'
                  }}
                />
              )}
            </div>
          )}

          {/* Legend */}
          <div className="avail-cal-legend" style={{
            display: 'flex',
            gap: '24px',
            marginBottom: '24px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#1A1A1A'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                background: '#16a34a',
                border: '1px solid rgba(0,0,0,0.1)'
              }} />
              <span>Available</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#1A1A1A'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                background: `repeating-linear-gradient(
                  45deg,
                  #E91E63,
                  #E91E63 6px,
                  rgba(255,255,255,0.5) 6px,
                  rgba(255,255,255,0.5) 12px
                )`,
                border: '1px solid rgba(0,0,0,0.1)'
              }} />
              <span>Booked</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#1A1A1A'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                background: '#6B7280',
                border: '1px solid rgba(0,0,0,0.1)'
              }} />
              <span>Unavailable</span>
            </div>
          </div>

          {/* Save Changes Button */}
          <button
            onClick={handleSave}
            disabled={saving || !selectedDate}
            style={{
              width: '100%',
              padding: '14px',
              background: saving || !selectedDate ? '#E0E0E0' : '#E91E63',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: saving || !selectedDate ? 'not-allowed' : 'pointer',
              opacity: saving || !selectedDate ? 0.6 : 1
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          {/* Date Range Selection */}
          <div style={{
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: '1px solid #E0E0E0'
          }}>
            <button
              onClick={() => setShowDateRange(!showDateRange)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'white',
                border: '1px solid #E0E0E0',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#1A1A1A',
                cursor: 'pointer',
                marginBottom: showDateRange ? '16px' : '0'
              }}
            >
              {showDateRange ? 'Cancel Date Range' : 'Mark Date Range'}
            </button>
            {showDateRange && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: '#1A1A1A'
                  }}>
                    From Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #E0E0E0',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: '#1A1A1A'
                  }}>
                    To Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #E0E0E0',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: '#1A1A1A'
                  }}>
                    Status for Range
                  </label>
                  <select
                    value={rangeStatus}
                    onChange={(e) => setRangeStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #E0E0E0',
                      fontSize: '14px',
                      background: 'white'
                    }}
                  >
                    {Object.keys(statuses).map(k => (
                      <option key={k} value={k}>{statuses[k].label}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleDateRangeSave}
                  disabled={saving || !startDate || !endDate}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: saving || !startDate || !endDate ? '#E0E0E0' : '#E91E63',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: saving || !startDate || !endDate ? 'not-allowed' : 'pointer',
                    opacity: saving || !startDate || !endDate ? 0.6 : 1
                  }}
                >
                  {saving ? 'Saving...' : 'Apply to Range'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* Set Your Status Card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              margin: 0,
              marginBottom: '20px',
              color: '#1A1A1A'
            }}>
              Set Your Status
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <label style={{
                  fontSize: '14px',
                  color: '#1A1A1A',
                  fontWeight: 500
                }}>
                  Accepting New Leads
                </label>
                <button
                  onClick={() => setAcceptingLeads(!acceptingLeads)}
                  style={{
                    width: '48px',
                    height: '24px',
                    borderRadius: '12px',
                    background: acceptingLeads ? '#E91E63' : '#E0E0E0',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.3s ease'
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'white',
                    position: 'absolute',
                    top: '2px',
                    left: acceptingLeads ? '26px' : '2px',
                    transition: 'left 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </button>
              </div>
            </div>
          </div>

          {/* Manage Time Slots - Add New */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                margin: 0,
                color: '#1A1A1A'
              }}>
                Manage Time Slots
              </h3>
              <button style={{
                background: 'transparent',
                border: 'none',
                color: '#6B6B6B',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 500
              }}>
                View All →
              </button>
            </div>
            <button style={{
              width: '100%',
              padding: '12px',
              background: '#E91E63',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <span>+</span>
              <span>Add New Slot</span>
            </button>
          </div>

          {/* Manage Time Slots - List */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                margin: 0,
                color: '#1A1A1A'
              }}>
                Manage Time Slots
              </h3>
              <button style={{
                background: 'transparent',
                border: 'none',
                color: '#6B6B6B',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 500
              }}>
                View All →
              </button>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {timeSlots.map(slot => (
                <div key={slot.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#F9F9F9',
                  borderRadius: '8px'
                }}>
                  <span style={{
                    fontSize: '14px',
                    color: '#1A1A1A'
                  }}>
                    {slot.name}
                  </span>
                  <button
                    onClick={() => handleDeleteTimeSlot(slot.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#E91E63',
                      cursor: 'pointer',
                      padding: '4px',
                      fontSize: '16px'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
              {timeSlots.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  color: '#6B6B6B',
                  fontSize: '14px'
                }}>
                  No time slots added yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileSection({ vendor, analytics, leads, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    business_name: vendor.business_name || '',
    contact_person: vendor.contact_person || '',
    email: vendor.email || '',
    phone: vendor.phone || '',
    whatsapp: vendor.whatsapp || '',
    city: vendor.city || '',
    category: vendor.category || '',
    business_address: vendor.business_address || '',
    service_areas: Array.isArray(vendor.service_areas) ? vendor.service_areas : [],
    outstation_events: !!vendor.outstation_events,
    years_experience: vendor.years_experience || '',
    brand_description: vendor.brand_description || '',
    why_choose: vendor.why_choose || '',
    deals: vendor.deals || '',
    website: vendor.website || '',
    instagram: vendor.instagram || '',
    facebook: vendor.facebook || '',
    youtube: vendor.youtube || '',
    other_services: vendor.other_services || '',
    service_details: vendor.service_details || {},
    service_pricing: vendor.service_pricing || {},
    price_min: vendor.price_range?.min || '',
    price_max: vendor.price_range?.max || '',
    services: Array.isArray(vendor.services) && vendor.services.length ? vendor.services : (vendor.category ? [vendor.category] : []),
    profile_pic: vendor.profile_pic || vendor.logo || ''
  })
  const [loading, setLoading] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(true)
  const [sendingCode, setSendingCode] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [confirmationResult, setConfirmationResult] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [cities, setCities] = useState([])

  const isPricingFieldVisible = (field) => {
    const vi = field?.visibleIf
    if (!vi) return true

    const current = formData.service_details?.[vi.key]
    if (Object.prototype.hasOwnProperty.call(vi, 'values')) {
      const values = vi.values || []
      return values.includes(current)
    }

    if (Object.prototype.hasOwnProperty.call(vi, 'value')) {
      return current === vi.value
    }

    return true
  }

  // Profile completion calculation
  const profileFields = [
    vendor.business_name,
    vendor.contact_person,
    vendor.email,
    vendor.phone,
    vendor.city,
    vendor.category,
    vendor.profile_pic || vendor.logo,
    vendor.brand_description
  ]
  const completedFields = profileFields.filter(field => field && field.toString().trim() !== '').length
  const profileCompletion = Math.round((completedFields / profileFields.length) * 100)

  // Checklist items
  const checklistItems = [
    { id: 1, label: 'Add Profile Picture', completed: !!(vendor.profile_pic || vendor.logo) },
    { id: 2, label: 'Add Business Description', completed: !!vendor.brand_description },
    { id: 3, label: 'Upload 3 Portfolio Items', completed: (analytics?.overview?.approvedPortfolio || 0) >= 3 },
    { id: 4, label: 'Add Contact Information', completed: !!(vendor.phone && vendor.email) },
    { id: 5, label: 'Set Pricing Range', completed: !!(vendor.price_range?.min && vendor.price_range?.max) }
  ]

  const stats = analytics?.overview || {}

  useEffect(() => {
    // Fetch cities
    const fetchCities = async () => {
      try {
        const response = await fetch('/api/cities')
        const data = await response.json()
        if (response.ok && data.cities) {
          setCities(data.cities)
        }
      } catch (err) {
        console.error('Failed to fetch cities:', err)
      }
    }
    fetchCities()
  }, [])

  useEffect(() => {
    // Strip +91 prefix from phone for display
    const phoneDisplay = vendor.phone ? vendor.phone.replace(/^\+91/, '') : ''
    setFormData(prev => ({
      ...prev,
      business_name: vendor.business_name || '',
      contact_person: vendor.contact_person || '',
      email: vendor.email || '',
      phone: phoneDisplay,
      whatsapp: vendor.whatsapp || '',
      city: vendor.city || '',
      category: vendor.category || '',
      business_address: vendor.business_address || '',
      years_experience: vendor.years_experience || '',
      brand_description: vendor.brand_description || '',
      why_choose: vendor.why_choose || '',
      deals: vendor.deals || '',
      website: vendor.website || '',
      instagram: vendor.instagram || '',
      facebook: vendor.facebook || '',
      youtube: vendor.youtube || '',
      other_services: vendor.other_services || '',
      price_min: vendor.price_range?.min || '',
      price_max: vendor.price_range?.max || '',
      services: Array.isArray(vendor.services) && vendor.services.length ? vendor.services : (vendor.category ? [vendor.category] : []),
      service_details: vendor.service_details || {},
      service_pricing: vendor.service_pricing || {},
      profile_pic: vendor.profile_pic || vendor.logo || ''
    }))
    setPhoneVerified(true)
  }, [vendor])

  const handleFileUpload = async (file, field, setBusy) => {
    try {
      setBusy(true)
      const token = await auth.currentUser?.getIdToken()
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload-file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to upload file')

      setFormData(prev => ({ ...prev, [field]: data.publicUrl }))
      alert('Image uploaded')
    } catch (err) {
      console.error('Upload error:', err)
      alert(err.message || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  const handleSendCode = async () => {
    if (!formData.phone) {
      alert('Enter phone number first')
      return
    }

    const formattedPhone = normalizeIndianPhone(formData.phone)
    if (!formattedPhone) {
      alert('Use a valid Indian mobile number (+91, 10 digits)')
      return
    }
    try {
      setSendingCode(true)
      const verifier = setupRecaptcha('profile-recaptcha')

      if (!verifier) {
        alert('Security check not ready. Please reload the page and try again.')
        return
      }

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, verifier)
      setConfirmationResult(confirmation)
      alert('Verification code sent')
    } catch (err) {
      console.error('Send code error:', err)
      alert(err.message || 'Failed to send code')
    } finally {
      setSendingCode(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!confirmationResult || !verificationCode) {
      alert('Enter the verification code')
      return
    }
    try {
      const result = await confirmationResult.confirm(verificationCode)
      if (result?.user) {
        setPhoneVerified(true)
        alert('Phone verified')
      }
    } catch (err) {
      console.error('Verify code error:', err)
      alert(err.message || 'Invalid code')
    }
  }

  const handleSave = async () => {
    // Normalize phone numbers for comparison (remove +91 prefix)
    const currentPhone = (vendor.phone || '').replace(/^\+91/, '')
    const phoneChanged = formData.phone !== currentPhone
    if (phoneChanged && !phoneVerified) {
      alert('Please verify your phone number before saving changes.')
      return
    }

    try {
      // Validate compulsory dynamic fields for the selected category
      const cfg = getCategoryConfig(formData.category)
      if (cfg) {
        const missing = []

        ;(cfg.detailsFields || []).forEach((f) => {
          const val = formData.service_details?.[f.key]
          if (f.type === 'boolean') {
            if (typeof val !== 'boolean') missing.push(f.question || f.label || f.key)
          } else if (f.type === 'single') {
            if (!val || String(val).trim() === '') missing.push(f.question || f.label || f.key)
          } else if (f.type === 'number') {
            if (val === '' || val === undefined || val === null || Number.isNaN(Number(val))) missing.push(f.question || f.label || f.key)
          } else {
            if (val === '' || val === undefined || val === null) missing.push(f.question || f.label || f.key)
          }
        })

        ;(cfg.pricingFields || []).forEach((p) => {
          if (!isPricingFieldVisible(p)) return
          if (!p.required) return
          const val = formData.service_pricing?.[p.key]
          if (val === '' || val === undefined || val === null || Number.isNaN(Number(val))) {
            missing.push(p.label || p.key)
          }
        })

        if (missing.length) {
          alert(`Please fill compulsory fields: ${missing.slice(0, 6).join(', ')}${missing.length > 6 ? '...' : ''}`)
          return
        }
      }

      setLoading(true)
      const token = await auth.currentUser?.getIdToken()
      // Ensure phone has +91 prefix when saving
      const normalizedPhone = normalizeIndianPhone(formData.phone) || formData.phone
      const payload = {
        ...formData,
        phone: normalizedPhone,
        services: formData.services,
        price_min: formData.price_min || null,
        price_max: formData.price_max || null,
        phone_verified: phoneVerified
      }
      const res = await fetch('/api/vendor/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (res.ok) {
        alert('Profile updated')
        setIsEditing(false)
        onUpdate && onUpdate()
      } else {
        alert(data.error || 'Failed to update profile')
      }
    } catch (err) {
      console.error('Update error:', err)
      alert(err.message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  const renderInput = (label, value, onChange, props = {}) => (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
        {label}
      </label>
      <input
        value={value}
        onChange={onChange}
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          fontSize: 14
        }}
        {...props}
      />
    </div>
  )

  if (!isEditing) {
    // View Mode - Two Column Layout
    return (
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            margin: 0,
            color: '#1A1A1A'
          }}>
            Profile
          </h1>
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: '12px 24px',
              background: '#E91E63',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Edit Profile
          </button>
        </div>

        {/* Profile visits - how many people viewed your profile */}
        <div style={{
          background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IconEye size={28} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', fontWeight: 500, marginBottom: '4px' }}>
                Profile visits
              </div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>
                {stats.totalViews ?? 0}
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
                {stats.profileViewsLast7Days > 0 ? `${stats.profileViewsLast7Days} in the last 7 days` : 'People who opened your profile'}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', maxWidth: '280px' }}>
            This is how many times your vendor profile was viewed. More visibility can lead to more leads.
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {/* Left Column */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* Profile Status */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                margin: 0,
                marginBottom: '24px',
                color: '#1A1A1A'
              }}>
                Profile Status
              </h3>

              {/* Circular Progress */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                marginBottom: '24px'
              }}>
                <div style={{
                  position: 'relative',
                  width: '120px',
                  height: '120px'
                }}>
                  <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#E0E0E0"
                      strokeWidth="10"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#E91E63"
                      strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 50}`}
                      strokeDashoffset={`${2 * Math.PI * 50 * (1 - profileCompletion / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#E91E63'
                    }}>
                      {profileCompletion}%
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6B6B6B'
                    }}>
                      Complete
                    </div>
                  </div>
                </div>

                {/* Radio Buttons */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#1A1A1A'
                  }}>
                    <input type="radio" name="status" style={{ cursor: 'pointer' }} />
                    <span>booked</span>
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#1A1A1A'
                  }}>
                    <input type="radio" name="status" defaultChecked style={{ cursor: 'pointer' }} />
                    <span>0 bookeds</span>
                  </label>
                </div>
              </div>

              {/* Checklist */}
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  color: '#1A1A1A'
                }}>
                  Total Leads
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {checklistItems.map((item, idx) => (
                    <div key={item.id} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '8px 0'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        border: '2px solid #E0E0E0',
                        background: item.completed ? '#E91E63' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px'
                      }}>
                        {item.completed && (
                          <span style={{ color: 'white', fontSize: '12px' }}>✓</span>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '14px',
                          color: '#1A1A1A',
                          marginBottom: '4px'
                        }}>
                          {item.label}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6B6B6B',
                          fontStyle: 'italic'
                        }}>
                          {idx === 0 ? 'Complete your profile picture to attract more clients' :
                            idx === 1 ? 'Add a compelling description of your business' :
                              idx === 2 ? 'Showcase your best work with portfolio items' :
                                idx === 3 ? 'Make it easy for clients to reach you' :
                                  'Set your pricing to help clients understand your services'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Start Checklist */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                margin: 0,
                marginBottom: '20px',
                color: '#1A1A1A'
              }}>
                Quick Start Checklist
              </h3>
              <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '20px',
                flexWrap: 'wrap'
              }}>
                <button style={{
                  padding: '12px 20px',
                  background: '#E91E63',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}>
                  Booked
                </button>
                <button style={{
                  padding: '12px 20px',
                  background: '#FFC107',
                  color: '#1A1A1A',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}>
                  {stats.leadsByStatus?.in_progress || 0}
                </button>
                <button style={{
                  padding: '12px 20px',
                  background: '#FFC107',
                  color: '#1A1A1A',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}>
                  {stats.leadsByStatus?.new || 0}
                </button>
                <button style={{
                  padding: '12px 20px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}>
                  {stats.leadsByStatus?.booked || 0}
                </button>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#E91E63',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* Key Metrics */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  margin: 0,
                  color: '#1A1A1A'
                }}>
                  Key Metrics
                </h3>
                <button style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6B6B6B',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}>
                  View All →
                </button>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '20px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '4px' }}>Total Leads</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A1A' }}>{stats.totalLeads ?? 0}</div>
                  <div style={{ fontSize: '12px', color: '#6B6B6B', marginTop: '4px' }}>{stats.leadsByStatus?.booked ?? 0} booked</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '4px' }}>Conversion Rate</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A1A' }}>{stats.conversionRate ?? 0}%</div>
                  <div style={{ fontSize: '12px', color: '#6B6B6B', marginTop: '4px' }}>of leads</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '4px' }}>Average Rating</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A1A' }}>{stats.avgRating ?? '0.0'}/5.0</div>
                  <div style={{ fontSize: '12px', color: '#6B6B6B', marginTop: '4px' }}>{stats.totalReviews ?? 0} reviews</div>
                </div>
              </div>
            </div>

            {/* Monthly Performance */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  margin: 0,
                  color: '#1A1A1A'
                }}>
                  Key Metrics
                </h3>
                <button style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6B6B6B',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}>
                  View All →
                </button>
              </div>
              <div style={{
                height: '200px',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                paddingTop: '20px'
              }}>
                {analytics?.monthlyTrends?.slice(-7).map((month, idx) => {
                  const maxValue = Math.max(...(analytics.monthlyTrends || []).map(m => m.leads || m.views || 0), 1)
                  const height = maxValue > 0 ? ((month.leads || month.views || 0) / maxValue) * 140 : 0
                  return (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: '100%',
                        background: 'linear-gradient(to top, #E91E63, #C2185B)',
                        height: `${height}px`,
                        borderRadius: '4px 4px 0 0',
                        marginBottom: '8px',
                        minHeight: (month.leads || month.views || 0) > 0 ? '4px' : '0px'
                      }} />
                      <div style={{ fontSize: '11px', color: '#6B6B6B', textAlign: 'center' }}>
                        {month.month}
                      </div>
                    </div>
                  )
                }) || Array.from({ length: 7 }).map((_, idx) => {
                  const months = ['Aug', 'Sept', 'Oct', 'Nov', 'Dec', 'Dec', 'Jan']
                  return (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: '100%',
                        background: '#E0E0E0',
                        height: `${20 + idx * 15}px`,
                        borderRadius: '4px 4px 0 0',
                        marginBottom: '8px'
                      }} />
                      <div style={{ fontSize: '11px', color: '#6B6B6B' }}>{months[idx]}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent Leads Widget Removed */}
          </div>
        </div>
      </div>
    )
  }

  // Edit Mode - Full Form
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#1A1A1A' }}>Edit Profile</h3>
          <div style={{ fontSize: 13, color: '#6B6B6B' }}>
            Update your public profile, images, and contact details
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setIsEditing(false)}
            style={{
              padding: '12px 24px',
              background: 'white',
              color: '#1A1A1A',
              border: '1px solid #E0E0E0',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={loading}
            style={{ minWidth: 160 }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 32 }}>
        {/* Profile Picture (used as your public profile banner) */}
        <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Profile Picture</div>
          <div style={{ fontSize: 12, color: '#6B6B6B', marginBottom: 12 }}>
            This image appears as the banner on your public vendor page.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 96,
              height: 96,
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              background: 'var(--bg-warm)'
            }}>
              <img
                src={
                  formData.profile_pic ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.business_name || 'Vendor')}&size=200&background=ff6b9d&color=fff&bold=true`
                }
                alt="Profile"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file, 'profile_pic', setUploading)
                }}
              />
              <button
                className="btn-secondary"
                type="button"
                disabled={uploading}
                onClick={() => setFormData(prev => ({ ...prev, profile_pic: '' }))}
              >
                {uploading ? 'Uploading...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>

        {/* Location & Category */}
        <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Location & Category</div>
          <div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              {/* City Select Dropdown */}
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4, color: '#6B6B6B' }}>
                  City
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    paddingRight: '32px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    appearance: 'none',
                    background: 'white',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 10px center',
                    cursor: 'pointer',
                    overflow: 'visible',
                    textOverflow: 'clip',
                    whiteSpace: 'normal',
                    minWidth: 0,
                    maxWidth: '100%'
                  }}
                >
                  <option value="">Select City</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.name}>{city.name}</option>
                  ))}
                </select>
              </div>
              {/* Category */}
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4, color: '#6B6B6B' }}>
                  Category
                </label>
                <input
                  value={formData.category}
                  onChange={(e) => {
                    const nextCat = e.target.value || ''
                    setFormData((prev) => ({
                      ...prev,
                      category: nextCat,
                      services: nextCat ? [nextCat] : [],
                      service_details: {},
                      service_pricing: {}
                    }))
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: 13
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Details Card - Below Image Section (Exact match to venue listing page) */}
      <div style={{
        background: 'white',
        padding: '0',
        marginBottom: 24,
        borderRadius: '0',
        border: 'none',
        boxShadow: 'none'
      }}>
        {/* Business Name and Rating Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 12,
          paddingBottom: 16,
          borderBottom: '1px solid #E0E0E0'
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 700,
              margin: 0,
              marginBottom: 4,
              color: '#1A1A1A',
              letterSpacing: '-0.02em',
              lineHeight: '1.2'
            }}>
              {formData.business_name || 'Business Name'}
            </h1>
            {formData.category && (
              <div style={{ fontSize: '14px', color: '#6B6B6B', marginTop: 4, fontWeight: 400 }}>
                {formData.category}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: 20 }}>
            <div style={{
              background: '#10b981',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: 4
            }}>
              <IconStar size={14} color="white" filled={true} />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>
                {stats.avgRating || '0.0'}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: '#1A1A1A', fontWeight: 400 }}>
              {stats.totalReviews || 0} reviews
            </div>
          </div>
        </div>

        {/* Location and Address */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span style={{ fontSize: '14px', color: '#1A1A1A', fontWeight: 500 }}>
              {formData.city || 'City not set'}
            </span>
            {formData.city && (
              <span style={{ fontSize: '14px', color: '#E91E63', cursor: 'pointer', textDecoration: 'none' }}>
                (View on Map)
              </span>
            )}
          </div>
          {formData.business_address && (
            <div style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: '1.5', marginLeft: 22 }}>
              {formData.business_address}
            </div>
          )}
        </div>

        {/* Contact Button */}
        <div style={{ marginBottom: 16 }}>
          <button style={{
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            Contact
          </button>
        </div>

        {/* Action Buttons Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          borderTop: '1px solid #E0E0E0',
          borderBottom: '1px solid #E0E0E0',
          padding: '12px 0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            paddingRight: '20px',
            borderRight: '1px solid #E0E0E0',
            cursor: 'pointer',
            flex: 1,
            justifyContent: 'center'
          }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <IconImage size={18} color="#1A1A1A" />
            <span style={{ fontSize: '14px', color: '#1A1A1A', fontWeight: 500 }}>
              {analytics?.overview?.approvedPortfolio || 0} Photos
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0 20px',
            borderRight: '1px solid #E0E0E0',
            cursor: 'pointer',
            flex: 1,
            justifyContent: 'center'
          }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <IconHeart size={18} color="#1A1A1A" />
            <span style={{ fontSize: '14px', color: '#1A1A1A', fontWeight: 500 }}>
              Shortlist
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0 20px',
            borderRight: '1px solid #E0E0E0',
            cursor: 'pointer',
            flex: 1,
            justifyContent: 'center'
          }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span style={{ fontSize: '14px', color: '#1A1A1A', fontWeight: 500 }}>
              Write a Review
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            paddingLeft: '20px',
            cursor: 'pointer',
            flex: 1,
            justifyContent: 'center'
          }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            <span style={{ fontSize: '14px', color: '#1A1A1A', fontWeight: 500 }}>
              Share
            </span>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 24 }}>
        {renderInput('Business Name', formData.business_name, (e) => setFormData({ ...formData, business_name: e.target.value }))}
        {renderInput('Contact Person', formData.contact_person, (e) => setFormData({ ...formData, contact_person: e.target.value }))}
        {renderInput('Email', formData.email, (e) => setFormData({ ...formData, email: e.target.value }), { type: 'email' })}
        {renderInput('WhatsApp', formData.whatsapp, (e) => setFormData({ ...formData, whatsapp: e.target.value }), { type: 'tel' })}
      </div>

      {/* Service Areas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, marginBottom: 24 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Service Areas (comma separated)
          </label>
          <input
            type="text"
            value={Array.isArray(formData.service_areas) ? formData.service_areas.join(', ') : ''}
            onChange={(e) => {
              const parts = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              setFormData({ ...formData, service_areas: parts })
            }}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              fontSize: 14
            }}
            placeholder="e.g., Bhopal, Indore"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Outstation Events
          </label>
          <select
            value={formData.outstation_events ? 'yes' : 'no'}
            onChange={(e) => setFormData({ ...formData, outstation_events: e.target.value === 'yes' })}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              fontSize: 14,
              background: 'white'
            }}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
      </div>

      {/* Phone with verification */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
          Phone (re-verify if changed)
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, alignItems: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            background: 'white'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 10px',
              background: 'var(--bg-cream)',
              borderRight: '1px solid var(--border-light)',
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text-dark)',
              whiteSpace: 'nowrap'
            }}>
              <span style={{ marginRight: 4 }}>🇮🇳</span>
              <span>+91</span>
            </div>
            <input
              type="tel"
              value={formData.phone.replace(/^\+91/, '')}
              onChange={(e) => {
                // Only allow digits
                const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 10)
                // Store with +91 prefix
                if (digits.length <= 10) {
                  setFormData({ ...formData, phone: digits.length > 0 ? `+91${digits}` : '' })
                  setPhoneVerified(false)
                }
              }}
              maxLength={10}
              placeholder="9876543210"
              style={{
                flex: 1,
                padding: '12px 14px',
                border: 'none',
                outline: 'none',
                fontSize: 14
              }}
            />
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleSendCode}
            disabled={sendingCode}
          >
            {sendingCode ? 'Sending...' : 'Send Code'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleVerifyCode}
            disabled={!verificationCode}
          >
            Verify Code
          </button>
        </div>
        <input
          type="text"
          placeholder="Enter verification code"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          style={{
            width: '100%',
            marginTop: 8,
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            fontSize: 14
          }}
        />
        <div id="profile-recaptcha"></div>
        <div style={{ fontSize: 12, color: phoneVerified ? '#10b981' : 'var(--accent-rose)', marginTop: 6 }}>
          {phoneVerified ? 'Phone verified' : 'Phone not verified'}
        </div>
      </div>


      {/* Address */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
          Business Address
        </label>
        <textarea
          value={formData.business_address}
          onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
          rows={3}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            fontSize: 14,
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Pricing & Experience */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
        {renderInput('Years Experience', formData.years_experience, (e) => setFormData({ ...formData, years_experience: e.target.value }), { type: 'number', min: 0 })}
        {renderInput('Price Min (₹)', formData.price_min, (e) => setFormData({ ...formData, price_min: e.target.value }), { type: 'number', min: 0 })}
        {renderInput('Price Max (₹)', formData.price_max, (e) => setFormData({ ...formData, price_max: e.target.value }), { type: 'number', min: 0 })}
      </div>

      {/* Services */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
          Service category
        </label>

        <select
          value={Array.isArray(formData.services) ? (formData.services[0] || '') : (formData.services || '')}
          onChange={(e) => {
            const nextCat = e.target.value || ''
            setFormData((prev) => ({
              ...prev,
              services: nextCat ? [nextCat] : [],
              category: nextCat,
              // Reset dynamic pricing/answers when category changes
              service_details: {},
              service_pricing: {}
            }))
          }}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            fontSize: 14,
            background: 'white',
            appearance: 'none',
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2710%27 viewBox=%270 0 12 10%27%3E%3Cpath d=%27M1 1l5 5 5-5%27 stroke=%23666%27 stroke-width=%272%27 fill=%27none%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E")',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: 44,
            cursor: 'pointer'
          }}
        >
          <option value="">Select a service</option>
          {VENDOR_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div style={{ marginTop: 8, fontSize: 12, color: '#6B7280', fontWeight: 700 }}>
          Selected: {Array.isArray(formData.services) && formData.services[0] ? formData.services[0] : 'None'}
        </div>
      </div>

      {/* Category Details & Pricing (dynamic JSON) */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#111827' }}>
          Category Details & Pricing (dynamic)
        </label>
        {(() => {
          const cfg = getCategoryConfig(formData.category)
          if (!cfg) {
            return (
              <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 700 }}>
                Select a category to see dynamic questions.
              </div>
            )
          }

          return (
            <div style={{ display: 'grid', gap: 16 }}>
              {(cfg.detailsFields?.length || 0) > 0 && (
                <>
                  <div style={{ fontWeight: 700, color: '#111827' }}>Service Questions</div>
                  <div style={{ display: 'grid', gap: 14 }}>
                    {cfg.detailsFields.map((f) => {
                      const v = formData.service_details?.[f.key]
                      return (
                        <div key={f.key}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 6 }}>
                            {f.question}{f.required ? ' *' : ''}
                          </div>

                          {f.type === 'boolean' && (
                            <select
                              value={typeof v === 'boolean' ? (v ? 'yes' : 'no') : ''}
                              onChange={(e) => setFormData((p) => ({
                                ...p,
                                service_details: { ...(p.service_details || {}), [f.key]: e.target.value === 'yes' }
                              }))}
                              style={{
                                width: '100%',
                                padding: '12px 14px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-light)',
                                fontSize: 14,
                                background: 'white'
                              }}
                            >
                              <option value="">Select</option>
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          )}

                          {f.type === 'number' && (
                            <input
                              type="number"
                              min={0}
                              value={v ?? ''}
                              onChange={(e) => {
                                const raw = e.target.value
                                setFormData((p) => ({
                                  ...p,
                                  service_details: { ...(p.service_details || {}), [f.key]: raw === '' ? '' : Number(raw) }
                                }))
                              }}
                              style={{
                                width: '100%',
                                padding: '12px 14px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-light)',
                                fontSize: 14
                              }}
                            />
                          )}

                          {f.type === 'single' && (
                            <select
                              value={v ?? ''}
                              onChange={(e) => setFormData((p) => ({
                                ...p,
                                service_details: { ...(p.service_details || {}), [f.key]: e.target.value }
                              }))}
                              style={{
                                width: '100%',
                                padding: '12px 14px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-light)',
                                fontSize: 14,
                                background: 'white'
                              }}
                            >
                              <option value="">Select</option>
                              {(f.options || []).map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          )}

                          {f.type === 'text' && (
                            <input
                              type="text"
                              value={v ?? ''}
                              onChange={(e) => setFormData((p) => ({
                                ...p,
                                service_details: { ...(p.service_details || {}), [f.key]: e.target.value }
                              }))}
                              style={{
                                width: '100%',
                                padding: '12px 14px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-light)',
                                fontSize: 14
                              }}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              <div style={{ fontWeight: 700, color: '#111827', marginTop: 6 }}>Category Pricing</div>
              <div style={{ display: 'grid', gap: 14 }}>
                {cfg.pricingFields.filter(isPricingFieldVisible).map((p) => {
                  const v = formData.service_pricing?.[p.key]
                  return (
                    <div key={p.key}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 6 }}>
                        {p.label}{p.required ? ' *' : ''}
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={v ?? ''}
                        onChange={(e) => {
                          const raw = e.target.value
                          setFormData((prev) => ({
                            ...prev,
                            service_pricing: { ...(prev.service_pricing || {}), [p.key]: raw === '' ? '' : Number(raw) }
                          }))
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-light)',
                          fontSize: 14
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}
      </div>

      {/* Descriptions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Brand Description
          </label>
          <textarea
            value={formData.brand_description}
            onChange={(e) => setFormData({ ...formData, brand_description: e.target.value })}
            rows={4}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              fontSize: 14,
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Why Choose Us
          </label>
          <textarea
            value={formData.why_choose}
            onChange={(e) => setFormData({ ...formData, why_choose: e.target.value })}
            rows={4}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              fontSize: 14,
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>
      </div>

      {/* Deals */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
          Deals / Offers
        </label>
        <textarea
          value={formData.deals}
          onChange={(e) => setFormData({ ...formData, deals: e.target.value })}
          rows={3}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            fontSize: 14,
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Online Presence */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
        {renderInput('Website', formData.website, (e) => setFormData({ ...formData, website: e.target.value }), { type: 'url' })}
        {renderInput('Instagram', formData.instagram, (e) => setFormData({ ...formData, instagram: e.target.value }))}
        {renderInput('Facebook', formData.facebook, (e) => setFormData({ ...formData, facebook: e.target.value }), { type: 'url' })}
        {renderInput('YouTube', formData.youtube, (e) => setFormData({ ...formData, youtube: e.target.value }), { type: 'url' })}
      </div>

      {/* Other services */}
      <div style={{ marginBottom: 24 }}>
        {renderInput('Other Services', formData.other_services, (e) => setFormData({ ...formData, other_services: e.target.value }), { placeholder: 'Any additional services' })}
      </div>

      <div style={{ textAlign: 'right' }}>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={loading}
          style={{ minWidth: 160 }}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

function getStatusColor(status) {
  const colors = {
    new: 'var(--accent-rose)',
    in_progress: 'var(--accent-gold)',
    booked: '#10b981',
    rejected: 'var(--text-muted)'
  }
  return colors[status] || 'var(--text-muted)'
}

