'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Footer from '../../../components/Footer'
import { auth } from '../../../lib/firebase_client'
import { RecaptchaVerifier, signInWithPhoneNumber, signOut } from 'firebase/auth'
import { normalizeIndianPhone } from '../../../lib/phone-utils'
import { getCategoryConfig } from '../../../lib/vendorRegistrationConfig'

// 24-hour unlock: one verification unlocks View Contact, Check Availability, Send Message for this vendor
const UNLOCK_HOURS = 24
const getVendorUnlockKey = (vendorId) => `vendor_unlock_${vendorId}`
const setVendorUnlock = (vendorId) => {
  if (typeof window === 'undefined' || !vendorId) return
  const expiresAt = Date.now() + UNLOCK_HOURS * 60 * 60 * 1000
  localStorage.setItem(getVendorUnlockKey(vendorId), JSON.stringify({ expiresAt }))
}
const isVendorUnlocked = (vendorId) => {
  if (typeof window === 'undefined' || !vendorId) return false
  try {
    const raw = localStorage.getItem(getVendorUnlockKey(vendorId))
    if (!raw) return false
    const { expiresAt } = JSON.parse(raw)
    return expiresAt > Date.now()
  } catch {
    return false
  }
}

// Helper to create reCAPTCHA verifier (prevents multiple initializations)
const setupRecaptcha = (containerId) => {
  if (typeof window === 'undefined' || !auth) return null

  // Initialize global cache if it doesn't exist
  if (!window.__recaptchaVerifiers) {
    window.__recaptchaVerifiers = {}
  }

  // Return existing verifier if available
  if (window.__recaptchaVerifiers[containerId]) {
    try {
      const container = document.getElementById(containerId)
      if (container) {
        return window.__recaptchaVerifiers[containerId]
      } else {
        delete window.__recaptchaVerifiers[containerId]
      }
    } catch (e) {
      delete window.__recaptchaVerifiers[containerId]
    }
  }

  const container = document.getElementById(containerId)
  if (!container) {
    console.warn(`[VendorDetail] reCAPTCHA container #${containerId} not found`)
    return null
  }

  try {
    // Clean up any existing verifier first
    if (window.__recaptchaVerifiers[containerId]) {
      try {
        window.__recaptchaVerifiers[containerId].clear()
      } catch (e) {
        console.warn(`[VendorDetail] Error clearing old verifier:`, e)
      }
    }

    const verifier = new RecaptchaVerifier(auth, container, {
      size: 'invisible',
      callback: () => {
        console.log(`[VendorDetail] reCAPTCHA solved for ${containerId}`)
      }
    })

    window.__recaptchaVerifiers[containerId] = verifier
    return verifier
  } catch (error) {
    console.error(`[VendorDetail] Error creating reCAPTCHA verifier:`, error)
    return null
  }
}

export default function VendorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [vendor, setVendor] = useState(null)
  const [portfolio, setPortfolio] = useState([])
  const [reviews, setReviews] = useState([])
  const [inspirationPosts, setInspirationPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [submittingLead, setSubmittingLead] = useState(false)
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    contact_phone: '',
    event_date: '',
    budget: '',
    details: ''
  })
  const [availability, setAvailability] = useState({})
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [selectedDateStatus, setSelectedDateStatus] = useState(null)
  const [availabilityCheckDate, setAvailabilityCheckDate] = useState('')
  const [availabilityCheckResult, setAvailabilityCheckResult] = useState(null)
  const [availabilityCheckSending, setAvailabilityCheckSending] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [isVerified, setIsVerified] = useState(false)
  const [verificationStep, setVerificationStep] = useState('form') // 'form', 'otp', 'verified'
  const [verificationForm, setVerificationForm] = useState({
    name: '',
    phone: ''
  })
  const [otpCode, setOtpCode] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [whatsappNotify, setWhatsappNotify] = useState(true)
  const [inquiryVerificationStep, setInquiryVerificationStep] = useState('form') // 'form', 'otp', 'verified'
  const [inquiryOtpCode, setInquiryOtpCode] = useState('')
  const [sendingInquiryOtp, setSendingInquiryOtp] = useState(false)
  const [verifyingInquiryOtp, setVerifyingInquiryOtp] = useState(false)
  const [inquiryVerified, setInquiryVerified] = useState(false)
  const [isInCompare, setIsInCompare] = useState(false)
  const [inquiryRecaptchaReady, setInquiryRecaptchaReady] = useState(false)
  const [hasStoredCustomerDetails, setHasStoredCustomerDetails] = useState(false)
  const [activeTab, setActiveTab] = useState('projects') // 'projects', 'about', 'reviews'
  const [portfolioTab, setPortfolioTab] = useState('portfolio') // 'portfolio', 'albums'
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [reviewCanSubmit, setReviewCanSubmit] = useState(false)
  const [reviewAlreadyDone, setReviewAlreadyDone] = useState(false)
  const [reviewMyReview, setReviewMyReview] = useState(null)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewCustomerName, setReviewCustomerName] = useState('')

  useEffect(() => {
    fetchVendorData()
  }, [params.id])

  useEffect(() => {
    if (!vendor?.id || !currentUser) {
      setReviewCanSubmit(false)
      setReviewAlreadyDone(false)
      setReviewMyReview(null)
      return
    }
    let cancelled = false
    const token = currentUser.getIdToken?.()
    token.then((t) => {
      if (cancelled || !vendor?.id) return
      return fetch(`/api/reviews/can-review?vendor_id=${vendor.id}`, { headers: { Authorization: `Bearer ${t}` } })
    }).then((r) => r && r.json()).then((d) => {
      if (cancelled || !d) return
      setReviewCanSubmit(d.canReview === true)
      setReviewAlreadyDone(!!d.alreadyReviewed)
      setReviewMyReview(d.myReview || null)
    }).catch(() => { })
    return () => { cancelled = true }
  }, [vendor?.id, currentUser?.uid])

  useEffect(() => {
    if (!currentUser) {
      setReviewCustomerName('')
      return
    }
    let cancelled = false
      ; (async () => {
        try {
          const token = await currentUser.getIdToken(true)
          const res = await fetch('/api/sync-user', { headers: { Authorization: `Bearer ${token}` } })
          const data = await res.json()
          if (!cancelled) {
            setReviewCustomerName((data?.user?.name || currentUser.displayName || '').trim())
          }
        } catch (_) {
          if (!cancelled) setReviewCustomerName((currentUser.displayName || '').trim())
        }
      })()
    return () => { cancelled = true }
  }, [currentUser?.uid])

  useEffect(() => {
    // Check if customer details are stored (from previous vendor inquiry)
    if (typeof window !== 'undefined') {
      const storedDetails = localStorage.getItem('customerDetails')
      if (storedDetails) {
        try {
          const details = JSON.parse(storedDetails)
          if (details.name && details.phone) {
            setHasStoredCustomerDetails(true)
            // Pre-fill form with stored details
            setLeadForm(prev => ({
              ...prev,
              name: details.name,
              contact_phone: details.phone.replace('+91', ''),
              email: details.email || ''
            }))
            setVerificationForm(prev => ({
              ...prev,
              name: details.name,
              phone: details.phone.replace('+91', '')
            }))
            // Mark as verified if details exist
            setInquiryVerified(true)
            setInquiryVerificationStep('verified')
          }
        } catch (e) {
          console.error('Error parsing stored customer details:', e)
        }
      }
    }

    // Get current user for lead creation
    if (auth) {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        setCurrentUser(user)
      })
      // Check 24h unlock for this vendor (View Contact / Availability / Send Message)
      const verified = isVendorUnlocked(params.id)
      setIsVerified(verified)
      // Check if vendor is in compare list
      const stored = localStorage.getItem('compareVendors')
      if (stored) {
        const vendorIds = JSON.parse(stored)
        setIsInCompare(vendorIds.includes(params.id))
      }
      // Fetch availability when vendor is loaded
      if (params.id) {
        fetchAvailability()
      }
      return () => unsubscribe()
    } else {
      // Check 24h unlock for this vendor (even without auth)
      const verified = isVendorUnlocked(params.id)
      setIsVerified(verified)
      // Check if vendor is in compare list
      const stored = localStorage.getItem('compareVendors')
      if (stored) {
        const vendorIds = JSON.parse(stored)
        setIsInCompare(vendorIds.includes(params.id))
      }
      // Fetch availability when vendor is loaded
      if (params.id) {
        fetchAvailability()
      }
    }
  }, [params.id])

  // When opening Contact modal: if 24h unlock valid, show contact directly
  useEffect(() => {
    if (showContactModal && params.id && isVendorUnlocked(params.id)) {
      setVerificationStep('verified')
    }
  }, [showContactModal, params.id])

  // When opening Send Message modal: if 24h unlock valid, skip verification
  useEffect(() => {
    if (showLeadModal && params.id && isVendorUnlocked(params.id)) {
      setInquiryVerified(true)
      setInquiryVerificationStep('verified')
    }
  }, [showLeadModal, params.id])

  // Initialize reCAPTCHA when inquiry modal opens
  useEffect(() => {
    if (showLeadModal && typeof window !== 'undefined') {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const container = document.getElementById('recaptcha-container-inquiry')
        if (container) {
          const verifier = setupRecaptcha('recaptcha-container-inquiry')
          setInquiryRecaptchaReady(!!verifier)
          if (verifier) {
            console.log('[VENDOR-DETAIL] reCAPTCHA initialized for inquiry')
          } else {
            console.warn('[VENDOR-DETAIL] Failed to initialize reCAPTCHA')
          }
        } else {
          console.warn('[VENDOR-DETAIL] reCAPTCHA container not found yet')
          setInquiryRecaptchaReady(false)
        }
      }, 150) // Slightly longer delay to ensure modal is fully rendered
      return () => clearTimeout(timer)
    } else {
      // Reset when modal closes
      setInquiryRecaptchaReady(false)
    }
  }, [showLeadModal])

  const fetchAvailability = async () => {
    try {
      setLoadingAvailability(true)
      const res = await fetch(`/api/availability/list?vendor_id=${params.id}`)
      const data = await res.json()
      if (res.ok) {
        const map = {}
        data.availability?.forEach(entry => {
          map[entry.date] = entry.status
        })
        setAvailability(map)
      }
    } catch (err) {
      console.error('Failed to fetch availability:', err)
    } finally {
      setLoadingAvailability(false)
    }
  }

  const checkDateAvailability = (date) => {
    if (!date) return null
    const dateStr = new Date(date).toISOString().split('T')[0]
    const entry = availability[dateStr]
    return entry?.status || 'available'
  }

  async function handleCheckAvailability(e) {
    e.preventDefault()
    if (!availabilityCheckDate || !vendor?.id) return
    setAvailabilityCheckSending(true)
    setAvailabilityCheckResult(null)
    try {
      const status = checkDateAvailability(availabilityCheckDate)
      setAvailabilityCheckResult(status || 'available')
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: vendor.id,
          lead_type: 'availability_check',
          event_date: availabilityCheckDate
        })
      })
    } catch (err) {
      console.warn('Availability check record failed:', err)
    } finally {
      setAvailabilityCheckSending(false)
    }
  }

  const fetchVendorData = async () => {
    try {
      setLoading(true)
      const [vendorRes, portfolioRes, reviewsRes, inspirationRes] = await Promise.all([
        fetch(`/api/vendors/${params.id}`),
        fetch(`/api/vendor/portfolio?vendor_id=${params.id}`),
        fetch(`/api/vendor/reviews?vendor_id=${params.id}`),
        fetch(`/api/inspiration-feed?vendor_id=${params.id}`)
      ])

      if (!vendorRes.ok) {
        throw new Error('Vendor not found')
      }

      const vendorData = await vendorRes.json()
      const portfolioData = portfolioRes.ok ? await portfolioRes.json() : { portfolio: [] }
      const reviewsData = reviewsRes.ok ? await reviewsRes.json() : { reviews: [] }
      const inspirationData = inspirationRes.ok ? await inspirationRes.json() : { posts: [] }

      setVendor(vendorData.vendor)
      setPortfolio(portfolioData.portfolio || [])
      setReviews(reviewsData.reviews || [])
      setInspirationPosts(inspirationData.posts || [])
    } catch (err) {
      console.error('Error fetching vendor:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviewsOnly = async () => {
    if (!vendor?.id) return
    try {
      const res = await fetch(`/api/vendor/reviews?vendor_id=${vendor.id}`)
      const data = res.ok ? await res.json() : { reviews: [] }
      setReviews(data.reviews || [])
    } catch (_) { }
  }

  const handleSubmitReview = async () => {
    if (!vendor?.id || !currentUser) {
      setReviewError('Please sign in to submit a review.')
      return
    }
    if (!reviewCustomerName.trim()) {
      setReviewError('Please enter your name before submitting a review.')
      return
    }
    setReviewSubmitting(true)
    setReviewError('')
    try {
      const token = await currentUser.getIdToken(true)
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          vendor_id: vendor.id,
          rating: reviewRating,
          review_text: reviewText.trim() || null,
          customer_name: reviewCustomerName.trim()
        })
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setShowReviewModal(false)
        fetchReviewsOnly()
        if (currentUser) {
          const r = await fetch(`/api/reviews/can-review?vendor_id=${vendor.id}`, { headers: { Authorization: `Bearer ${token}` } })
          const canData = await r.json()
          setReviewAlreadyDone(!!canData.alreadyReviewed)
          setReviewMyReview(canData.myReview || null)
        }
        alert(reviewAlreadyDone ? 'Your review has been updated. It may take a moment to appear after approval.' : 'Thank you! Your review has been submitted and will appear after approval.')
      } else {
        setReviewError(data.error || 'Failed to submit review.')
      }
    } catch (err) {
      setReviewError(err?.message || 'Failed to submit review.')
    } finally {
      setReviewSubmitting(false)
    }
  }

  const searchParams = useSearchParams()
  // Record profile view for every visitor (logged in or not) — once per session per vendor. If from_post in URL, track for "profile visits from post".
  useEffect(() => {
    if (!vendor?.id || typeof window === 'undefined') return
    const key = `profile_view_${vendor.id}`
    if (sessionStorage.getItem(key)) return
    const stored = localStorage.getItem('customerDetails')
    let name = null
    let contact_phone = null
    if (stored) {
      try {
        const d = JSON.parse(stored)
        name = d.name || null
        contact_phone = d.phone || null
      } catch (_) { }
    }
    const fromPost = searchParams?.get?.('from_post') || null
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendor_id: String(vendor.id),
        lead_type: 'profile_view',
        ...(name && contact_phone && { name, contact_phone }),
        ...(fromPost && { from_post: fromPost })
      })
    })
      .then(async (res) => {
        if (res.ok) {
          sessionStorage.setItem(key, '1')
        } else {
          const text = await res.text().catch(() => '')
          console.warn('[profile_view] API returned', res.status, text)
        }
      })
      .catch((err) => console.warn('[profile_view] request failed:', err))
  }, [vendor?.id])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-cream)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>Loading vendor details...</div>
        </div>
      </div>
    )
  }

  if (error || !vendor) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-cream)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 18, color: 'var(--text-muted)', marginBottom: 24 }}>
            {error || 'Vendor not found'}
          </div>
          <Link href="/vendors" className="btn-primary">
            Browse Vendors
          </Link>
        </div>
      </div>
    )
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null

  async function handleSendInquiryOtp() {
    if (!leadForm.name || !leadForm.contact_phone || leadForm.contact_phone.length !== 10) {
      alert('Please enter valid name and 10-digit phone number')
      return
    }

    if (!auth) {
      alert('Firebase authentication is not initialized. Please refresh the page.')
      return
    }

    setSendingInquiryOtp(true)
    // Declare formattedPhone outside try-catch so it's accessible in catch block
    let formattedPhone = null
    try {
      formattedPhone = normalizeIndianPhone(leadForm.contact_phone)
      if (!formattedPhone) {
        alert('Please enter a valid Indian phone number (+91, 10 digits)')
        setSendingInquiryOtp(false)
        return
      }

      // Ensure reCAPTCHA container exists
      const container = document.getElementById('recaptcha-container-inquiry')
      if (!container) {
        alert('Security check container not found. Please refresh the page.')
        setSendingInquiryOtp(false)
        return
      }

      // Try to get or create reCAPTCHA verifier
      let recaptchaVerifier = setupRecaptcha('recaptcha-container-inquiry')

      // If verifier doesn't exist, try initializing it
      if (!recaptchaVerifier) {
        console.log('[VENDOR-DETAIL] reCAPTCHA not ready, attempting to initialize...')
        // Wait a moment for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 200))
        recaptchaVerifier = setupRecaptcha('recaptcha-container-inquiry')

        if (!recaptchaVerifier) {
          alert('Security check is not ready. Please refresh the page and try again.')
          setSendingInquiryOtp(false)
          return
        }
        setInquiryRecaptchaReady(true)
      }

      // Ensure widget is rendered for this verifier instance.
      try {
        await recaptchaVerifier.render()
      } catch (_) { }

      console.log('[VENDOR-DETAIL] Sending OTP to:', formattedPhone)
      console.log('[VENDOR-DETAIL] Firebase auth initialized:', !!auth)
      console.log('[VENDOR-DETAIL] reCAPTCHA verifier ready:', !!recaptchaVerifier)

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier)

      if (typeof window !== 'undefined') {
        window.inquiryConfirmationResult = confirmation
      }

      setInquiryVerificationStep('otp')
      alert('Verification code sent to your phone!')
    } catch (error) {
      console.error('Phone sign in error:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        phone: formattedPhone || leadForm.contact_phone || 'unknown',
        firebaseProject: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'wedeption-a40a0',
        firebaseAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'wedeption-a40a0.firebaseapp.com'
      })

      let errorMessage = 'Failed to send verification code'

      // Handle 400 Bad Request and Firebase config errors
      if (error.code === 'auth/invalid-app-credential' ||
        error.code === 'auth/unauthorized-domain' ||
        (error.message && error.message.includes('400')) ||
        (error.message && error.message.includes('Bad Request'))) {
        errorMessage = '🔴 CRITICAL: Firebase Phone Authentication Configuration Error\n\n'
        errorMessage += 'This error means phone authentication is NOT properly configured in Firebase.\n\n'
        errorMessage += '📋 STEP-BY-STEP FIX:\n\n'
        errorMessage += '1. Go to Firebase Console:\n'
        errorMessage += '   https://console.firebase.google.com/project/wedeption-a40a0/authentication/providers\n\n'
        errorMessage += '2. Click on "Phone" provider\n'
        errorMessage += '3. Click "Enable" if it\'s disabled\n'
        errorMessage += '4. Under "Authorized domains", add:\n'
        errorMessage += '   - localhost\n'
        errorMessage += '   - 127.0.0.1\n'
        errorMessage += '   (if not already present)\n\n'
        errorMessage += '5. Go to Google Cloud Console:\n'
        errorMessage += '   https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com?project=wedeption-a40a0\n'
        errorMessage += '   Enable "Identity Toolkit API"\n\n'
        errorMessage += '6. Save all changes and wait 2-3 minutes\n\n'
        errorMessage += '7. RESTART your dev server (Ctrl+C then npm run dev)\n\n'
        errorMessage += '📖 Full guide: See FIREBASE_PHONE_AUTH_SETUP.md'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many verification attempts. Please try again later.'
      } else if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format. Please use a valid Indian mobile number (+91XXXXXXXXXX).'
      } else if (error.code === 'auth/missing-phone-number') {
        errorMessage = 'Phone number is required.'
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later or contact support.'
      } else if (error.message) {
        errorMessage = `Error: ${error.message}\n\nError Code: ${error.code || 'unknown'}`
      }

      alert(errorMessage)
    } finally {
      setSendingInquiryOtp(false)
    }
  }

  async function handleVerifyInquiryOtp() {
    if (!inquiryOtpCode || inquiryOtpCode.length !== 6) {
      alert('Please enter the 6-digit code')
      return
    }

    const confirmation = typeof window !== 'undefined' ? window.inquiryConfirmationResult : null
    if (!confirmation) {
      alert('Verification session expired. Please request a new code.')
      return
    }

    setVerifyingInquiryOtp(true)
    try {
      const result = await confirmation.confirm(inquiryOtpCode)
      const user = result.user
      const formattedPhone = normalizeIndianPhone(user.phoneNumber || leadForm.contact_phone)

      // Lead-only verification: do NOT log the user in. Sign out immediately so
      // this only counts as a lead; they are not logged into the website.
      if (auth) {
        await signOut(auth)
      }

      // 24h unlock for this vendor (View Contact, Availability, Send Message)
      setVendorUnlock(params.id)
      setInquiryVerified(true)
      setInquiryVerificationStep('verified')
      setCurrentUser(null)

      if (typeof window !== 'undefined') {
        window.inquiryConfirmationResult = null
      }

      alert('Phone verified successfully! You can now submit your inquiry.')
    } catch (error) {
      console.error('OTP verification error:', error)
      alert(error.message || 'Verification failed. Please try again.')
    } finally {
      setVerifyingInquiryOtp(false)
    }
  }

  async function handleSubmitLead(e) {
    e.preventDefault()
    if (!vendor) return

    // Check if phone is verified
    if (!inquiryVerified) {
      alert('Please verify your phone number first')
      return
    }

    setSubmittingLead(true)
    try {
      const formattedPhone = normalizeIndianPhone(leadForm.contact_phone)
      if (!formattedPhone) {
        alert('Please enter a valid Indian phone number')
        setSubmittingLead(false)
        return
      }

      const leadData = {
        vendor_id: vendor.id,
        name: leadForm.name,
        contact_phone: formattedPhone,
        event_date: leadForm.event_date,
        email: leadForm.email || null,
        budget: leadForm.budget || null,
        lead_type: 'inquiry',
        details: {
          details: leadForm.details || null,
          whatsapp_notify: whatsappNotify,
          availability_status: selectedDateStatus || 'available'
        }
      }

      // If user is logged in, include user_id
      if (currentUser) {
        leadData.user_id = currentUser.uid
      }

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(leadData)
      })

      const data = await response.json()

      if (response.ok && data.ok) {
        alert('Inquiry sent successfully! The vendor will contact you soon.')
        setShowLeadModal(false)
        // Don't clear the form completely - keep name and phone for next vendor
        setLeadForm(prev => ({
          ...prev,
          event_date: '',
          budget: '',
          details: ''
        }))
        setSelectedDateStatus(null)
        // Keep verification step as 'verified' so next vendor doesn't ask for auth
        // Don't reset inquiryVerified - keep it true for subsequent vendors
        if (typeof window !== 'undefined') {
          window.inquiryConfirmationResult = null
        }
      } else {
        alert(data.error || 'Failed to send inquiry. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting lead:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setSubmittingLead(false)
    }
  }

  // Hero banner uses profile photo; portfolio is for the gallery below
  const profileBannerUrl = vendor?.profile_pic || vendor?.logo || null
  const mainImage = profileBannerUrl
    ? { media_url: profileBannerUrl, media_type: 'image' }
    : portfolio[0] || (vendor
      ? {
        media_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.business_name || 'Vendor')}&size=800&background=ff6b9d&color=fff&bold=true`,
        media_type: 'image'
      }
      : null)

  const categoryLower = (vendor?.category || '').toLowerCase()
  const servicesLower = Array.isArray(vendor?.services)
    ? vendor.services.map((s) => String(s).toLowerCase())
    : []
  const isFoodService = categoryLower.includes('cater') || servicesLower.some((s) => s.includes('cater'))
  const isVenueService = categoryLower.includes('venue') || servicesLower.some((s) => s.includes('venue'))
  const primaryPriceLabel = isFoodService ? 'Price per plate (taxes extra)' : isVenueService ? 'Starting package' : 'Starting service price'
  const secondaryPriceLabel = isFoodService ? 'Premium menu starts from' : 'Higher package starts from'

  async function handleSendOtp() {
    if (!verificationForm.name || !verificationForm.phone || verificationForm.phone.length !== 10) {
      alert('Please enter valid name and phone number')
      return
    }

    setSendingOtp(true)
    try {
      const formattedPhone = normalizeIndianPhone(verificationForm.phone)
      if (!formattedPhone) {
        alert('Please enter a valid Indian phone number')
        setSendingOtp(false)
        return
      }

      // Ensure reCAPTCHA container exists
      const container = document.getElementById('recaptcha-container-contact')
      if (!container) {
        alert('Security check container not found. Please refresh the page.')
        setSendingOtp(false)
        return
      }

      // Try to get or create reCAPTCHA verifier
      let recaptchaVerifier = setupRecaptcha('recaptcha-container-contact')

      // If verifier doesn't exist, try initializing it
      if (!recaptchaVerifier) {
        console.log('[VENDOR-DETAIL] reCAPTCHA not ready for contact, attempting to initialize...')
        // Wait a moment for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 200))
        recaptchaVerifier = setupRecaptcha('recaptcha-container-contact')

        if (!recaptchaVerifier) {
          alert('Security check is not ready. Please refresh the page and try again.')
          setSendingOtp(false)
          return
        }
      }

      try {
        await recaptchaVerifier.render()
      } catch (_) { }

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier)

      if (typeof window !== 'undefined') {
        window.confirmationResult = confirmation
      }

      setVerificationStep('otp')
      alert('OTP sent successfully!')
    } catch (error) {
      console.error('Error sending OTP:', error)
      alert(error.message || 'Failed to send OTP. Please try again.')
    } finally {
      setSendingOtp(false)
    }
  }

  async function handleVerifyOtp() {
    if (!otpCode || otpCode.length !== 6) {
      alert('Please enter a valid 6-digit OTP')
      return
    }

    setVerifyingOtp(true)
    try {
      const confirmation = typeof window !== 'undefined' ? window.confirmationResult : null

      if (!confirmation || typeof confirmation.confirm !== 'function') {
        alert('Verification session expired. Please request a new OTP.')
        setVerifyingOtp(false)
        return
      }

      const result = await confirmation.confirm(otpCode)
      const user = result.user

      // Store customer details in localStorage for future vendor inquiries
      if (typeof window !== 'undefined') {
        const formattedPhone = normalizeIndianPhone(user.phoneNumber || verificationForm.phone)
        if (formattedPhone) {
          const customerDetails = {
            name: verificationForm.name,
            phone: formattedPhone,
            email: null
          }
          localStorage.setItem('customerDetails', JSON.stringify(customerDetails))
        }
        window.confirmationResult = null
      }

      // 24h unlock for this vendor (no need to verify again for contact/availability/message)
      setVendorUnlock(params.id)
      setIsVerified(true)

      // Create lead with verification info (lead only — do not log user in)
      if (vendor) {
        const formattedPhone = normalizeIndianPhone(user.phoneNumber || verificationForm.phone)
        await fetch('/api/leads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            vendor_id: vendor.id,
            name: verificationForm.name,
            contact_phone: formattedPhone,
            lead_type: 'contact_view',
            details: {
              whatsapp_notify: whatsappNotify,
              verified: true
            }
          })
        })
      }

      setVerificationStep('verified')

      // Lead-only: sign out so verifying phone here does NOT log them into the website
      if (auth) {
        await signOut(auth)
      }
    } catch (error) {
      console.error('Error verifying OTP:', error)
      alert(error.message || 'Invalid OTP. Please try again.')
    } finally {
      setVerifyingOtp(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #fff9fb 0%, #fffdf8 46%, #ffffff 100%)', fontFamily: "'Inter', 'Segoe UI', sans-serif", color: '#1f2937' }}>
      {/* Header with Logo and Verified Badge */}
      <header style={{
        background: 'rgba(255,255,255,0.82)',
        borderBottom: '1px solid rgba(236, 227, 232, 0.9)',
        backdropFilter: 'blur(8px)',
        padding: '12px 0'
      }}>
        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Logo */}
              <span style={{
                fontSize: 22,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #d4af37 0%, #ffdf73 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px'
              }}>
                Wedeption
              </span>

              {/* Verified Professional Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginLeft: 16,
                padding: '4px 12px',
                background: '#f8f6ff',
                borderRadius: '20px',
                fontSize: 12,
                color: '#6d28d9'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Verified Professional</span>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Hero Image + Pricing Sidebar Section */}
      <div style={{
        background: 'linear-gradient(180deg, #fffdfd 0%, #fff8fb 100%)',
        padding: '16px 0 0 0',
        borderBottom: 'none'
      }}>
        <div className="container vendor-master-grid" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
          {/* Left: Hero Image */}
          {mainImage && (
            <div className="vendor-master-hero vendor-master-hero-overlay" style={{
              position: 'relative',
              width: '100%',
              height: '400px',
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#f5f5f5',
              boxShadow: '0 20px 44px rgba(190, 24, 93, 0.12)'
            }}>
              {mainImage.media_type === 'video' ? (
                <video
                  src={mainImage.media_url}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  controls
                  autoPlay
                  muted
                  loop
                />
              ) : (
                <img
                  src={mainImage.media_url}
                  alt={vendor.business_name || 'Vendor'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              )}
            </div>
          )}

          {/* Right: Pricing & Contact Form Sidebar */}
          <div className="vendor-master-sidebar">
            <motion.div
              className="card"
              style={{
                padding: 20,
                background: 'white',
                border: '1px solid rgba(17,24,39,0.08)',
                borderRadius: '16px',
                boxShadow: '0 14px 34px rgba(17,24,39,0.10)',
                position: 'sticky',
                top: 20,
                marginTop: 28
              }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Starting Price */}
              <div style={{ marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid #eceff3' }}>
                <h3 style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#6b7280',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.09em'
                }}>
                  Starting Price
                </h3>
                <div style={{
                  fontSize: 14,
                  color: '#1a1a1a',
                  lineHeight: 1.7
                }}>
                  {vendor.price_range?.min ? (
                    <>
                      <div style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: 30, fontWeight: 600, color: '#111827', lineHeight: 1.2 }}>
                          ₹ {vendor.price_range.min.toLocaleString('en-IN')}
                        </div>
                        <div style={{ marginTop: 4, color: '#4b5563', fontSize: 13 }}>
                          {primaryPriceLabel}
                        </div>
                      </div>
                      {vendor.price_range.max && vendor.price_range.max > vendor.price_range.min && (
                        <div style={{ marginTop: 8, color: '#4b5563', fontSize: 13 }}>
                          {secondaryPriceLabel} <span style={{ color: '#111827', fontWeight: 500 }}>₹ {vendor.price_range.max.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div>Contact for pricing</div>
                  )}
                </div>
              </div>

              {/* Single contact block: Send Enquiry + View Contact (no duplicate) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 2 }}>Get a tailored quote for your wedding date</p>
                <button
                  onClick={() => setShowLeadModal(true)}
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    background: 'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: 15,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                  onMouseEnter={(e) => { e.target.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  Send Enquiry
                </button>
                <button
                  onClick={() => setShowContactModal(true)}
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    background: '#fff1f8',
                    color: '#be185d',
                    border: '1px solid #f9a8d4',
                    borderRadius: '10px',
                    fontSize: 15,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                  onMouseEnter={(e) => { e.target.style.background = '#ffe4f1' }}
                  onMouseLeave={(e) => { e.target.style.background = '#fff1f8' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  View Contact
                </button>
              </div>

              {/* Check Availability (no OTP) — shows status and records in dashboard */}
              <div style={{ paddingTop: 16, borderTop: '1px solid #eceff3' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 10 }}>
                  Check Availability
                </h3>
                <form onSubmit={handleCheckAvailability} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input
                    type="date"
                    required
                    value={availabilityCheckDate}
                    onChange={(e) => { setAvailabilityCheckDate(e.target.value); setAvailabilityCheckResult(null) }}
                    min={new Date().toISOString().split('T')[0]}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #dbdbdb',
                      fontSize: 14,
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={availabilityCheckSending}
                    style={{
                      width: '100%',
                      padding: '11px 18px',
                      background: '#e91e63',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: availabilityCheckSending ? 'wait' : 'pointer'
                    }}
                  >
                    {availabilityCheckSending ? 'Checking...' : 'Check Availability'}
                  </button>
                  {availabilityCheckResult && (
                    <div style={{
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: 14,
                      fontWeight: 500,
                      background: availabilityCheckResult === 'available' ? '#d1fae5' : availabilityCheckResult === 'booked' ? '#fee2e2' : '#f3f4f6',
                      color: availabilityCheckResult === 'available' ? '#065f46' : availabilityCheckResult === 'booked' ? '#991b1b' : '#374151'
                    }}>
                      {availabilityCheckResult === 'available' ? '✓ Available' : availabilityCheckResult === 'booked' ? '✗ Booked' : '✗ Unavailable'}
                    </div>
                  )}
                </form>
              </div>
            </motion.div>
          </div>

          {/* Vendor Information - Directly below image section */}
          <div className="vendor-master-info vendor-master-info-card" style={{
            paddingTop: 0,
            borderTop: 'none',
            paddingBottom: 10,
          }}>
            <div className="vendor-master-info-inner" style={{
              display: 'block',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.99) 0%, rgba(255,248,252,0.99) 100%)',
              border: '1px solid rgba(236,72,153,0.12)',
              borderRadius: '20px',
              padding: '24px 28px',
              boxShadow: '0 16px 40px rgba(236,72,153,0.10), 0 2px 8px rgba(0,0,0,0.06)',
              minHeight: 170
            }}>
              {/* Left: Vendor Info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10, flexWrap: 'wrap' }}>
                  <h1 style={{
                    fontSize: 34,
                    fontWeight: 700,
                    color: '#111827',
                    margin: 0,
                    letterSpacing: '-0.5px',
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    {vendor.business_name}
                  </h1>
                  {vendor.verified && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '5px 12px',
                      background: 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)',
                      borderRadius: '20px',
                      fontSize: 12,
                      color: '#4338ca',
                      fontWeight: 600,
                      border: '1px solid rgba(99,102,241,0.2)',
                      boxShadow: '0 2px 8px rgba(99,102,241,0.15)'
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                      </svg>
                      Verified
                    </div>
                  )}
                  {vendor.category && (
                    <div style={{
                      padding: '5px 12px',
                      background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
                      borderRadius: '20px',
                      fontSize: 12,
                      color: '#be185d',
                      fontWeight: 600,
                      border: '1px solid rgba(236,72,153,0.2)'
                    }}>
                      {vendor.category}
                    </div>
                  )}
                </div>

                {/* Rating and Location */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 10, flexWrap: 'wrap' }}>
                  {avgRating && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                      <span style={{ fontSize: 16, color: '#16a34a' }}>★</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#15803d' }}>{avgRating}</span>
                      <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 500 }}>({reviews.length} reviews)</span>
                    </div>
                  )}
                  {vendor.city && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #fce7f3 0%, #ede9fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e91e63" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>{vendor.city}</span>
                      <Link href={`#location`} style={{ fontSize: 13, color: '#e91e63', textDecoration: 'none', fontWeight: 500, padding: '2px 8px', background: '#fff0f6', borderRadius: '8px', border: '1px solid #fce7f3' }}>
                        View on map
                      </Link>
                    </div>
                  )}
                </div>

                {/* Address */}
                {vendor.business_address && (
                  <p style={{
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: '#9ca3af',
                    marginTop: 2,
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                    {vendor.business_address}
                  </p>
                )}

                {/* Divider */}
                <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #f9a8d4, transparent)', margin: '4px 0 16px 0' }} />

                {/* Action Icons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 4, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      document.getElementById('portfolio-section')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#e91e63'; e.currentTarget.style.background = '#fff0f6' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}
                    title="Photos"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{portfolio.length} Photos</span>
                  </button>

                  <button
                    onClick={() => {
                      ; (async () => {
                        if (!currentUser) {
                          alert('Please login to shortlist vendors.')
                          return
                        }
                        try {
                          const token = await currentUser.getIdToken(true)
                          // toggle: try delete if exists, else add
                          const resList = await fetch('/api/shortlist', { headers: { Authorization: `Bearer ${token}` } })
                          const listData = await resList.json()
                          const exists = (listData.items || []).some((it) => it.vendor_id === vendor.id)
                          if (exists) {
                            const res = await fetch('/api/shortlist', {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ vendor_id: vendor.id })
                            })
                            const d = await res.json().catch(() => ({}))
                            if (!res.ok) throw new Error(d.error || 'Failed to remove')
                            alert('Removed from shortlist')
                          } else {
                            const res = await fetch('/api/shortlist', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ vendor_id: vendor.id })
                            })
                            const d = await res.json().catch(() => ({}))
                            if (!res.ok) throw new Error(d.error || 'Failed to add')
                            alert('Added to shortlist')
                          }
                        } catch (e) {
                          alert(e.message || 'Shortlist failed')
                        }
                      })()
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#e91e63'; e.currentTarget.style.background = '#fff0f6' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}
                    title="Shortlist"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e91e63" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Shortlist</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('reviews')
                      if (reviewMyReview) {
                        setReviewRating(reviewMyReview.rating || 5)
                        setReviewText(reviewMyReview.review_text || '')
                      } else {
                        setReviewRating(5)
                        setReviewText('')
                      }
                      setReviewError('')
                      setShowReviewModal(true)
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.background = '#f5f3ff' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}
                    title="Write a review"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Write a review</span>
                  </button>

                  <button
                    onClick={() => {
                      const url = window.location.href
                      if (navigator.share) {
                        navigator.share({ title: vendor.business_name, url })
                      } else {
                        navigator.clipboard.writeText(url)
                        alert('Link copied to clipboard!')
                      }
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; e.currentTarget.style.background = '#f0f9ff' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}
                    title="Share"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Share</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px 28px 24px' }}>
        {/* Left Column */}
        <div>
          {/* Navigation Tabs */}
          <div className="hide-scrollbar" style={{
            display: 'flex',
            gap: 10,
            borderBottom: 'none',
            marginBottom: 10,
            marginTop: 4,
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 6,
            width: '100%',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}>
            <button
              onClick={() => setActiveTab('projects')}
              style={{
                background: activeTab === 'projects' ? 'linear-gradient(135deg, #be185d 0%, #7c3aed 100%)' : 'transparent',
                border: 'none',
                padding: '10px 18px',
                fontSize: 14,
                fontWeight: activeTab === 'projects' ? 700 : 500,
                color: activeTab === 'projects' ? '#fff' : '#6b7280',
                cursor: 'pointer',
                borderRadius: 10,
                transition: 'all 0.22s ease',
                boxShadow: activeTab === 'projects' ? '0 2px 10px rgba(190,24,93,0.25)' : 'none',
                letterSpacing: activeTab === 'projects' ? '-0.01em' : 'normal'
              }}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab('about')}
              style={{
                background: activeTab === 'about' ? 'linear-gradient(135deg, #be185d 0%, #7c3aed 100%)' : 'transparent',
                border: 'none',
                padding: '10px 18px',
                fontSize: 14,
                fontWeight: activeTab === 'about' ? 700 : 500,
                color: activeTab === 'about' ? '#fff' : '#6b7280',
                cursor: 'pointer',
                borderRadius: 10,
                transition: 'all 0.22s ease',
                boxShadow: activeTab === 'about' ? '0 2px 10px rgba(190,24,93,0.25)' : 'none',
                letterSpacing: activeTab === 'about' ? '-0.01em' : 'normal'
              }}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              style={{
                background: activeTab === 'reviews' ? 'linear-gradient(135deg, #be185d 0%, #7c3aed 100%)' : 'transparent',
                border: 'none',
                padding: '10px 18px',
                fontSize: 14,
                fontWeight: activeTab === 'reviews' ? 700 : 500,
                color: activeTab === 'reviews' ? '#fff' : '#6b7280',
                cursor: 'pointer',
                borderRadius: 10,
                transition: 'all 0.22s ease',
                boxShadow: activeTab === 'reviews' ? '0 2px 10px rgba(190,24,93,0.25)' : 'none',
                letterSpacing: activeTab === 'reviews' ? '-0.01em' : 'normal'
              }}
            >
              Reviews {reviews.length > 0 ? `(${reviews.length})` : ''}
            </button>
          </div>

          {/* Areas Available Section */}
          {(vendor.category === 'Venues' || vendor.services?.includes('Venues')) && (
            <motion.div
              className="card"
              style={{ padding: 18, marginBottom: 14, border: '1px solid #ece9ef', borderRadius: 14, boxShadow: '0 8px 22px rgba(17,24,39,0.06)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '8px',
                  background: '#f0f9ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2"><path d="M3 21h18" /><path d="M5 21V7l8-4 8 4v14" /><path d="M9 21v-4h6v4" /></svg>
                </div>
                <div>
                  <h3 style={{
                    fontSize: 18,
                    fontWeight: 500,
                    color: '#1a1a1a',
                    margin: 0
                  }}>
                    Outdoor
                  </h3>
                  <p style={{
                    fontSize: 14,
                    color: '#666',
                    margin: 0
                  }}>
                    500 Seating | 800 Floating
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Projects Tab Content */}
          {activeTab === 'projects' && (
            <>
              {/* Photo Gallery with Tabs */}
              {portfolio.length > 0 && (
                <motion.div
                  id="portfolio-section"
                  className="card"
                  style={{ padding: 18, marginBottom: 14, border: '1px solid #f0dce7', borderRadius: 14, boxShadow: '0 10px 26px rgba(236,72,153,0.10)', background: 'linear-gradient(180deg, #fff 0%, #fff8fc 100%)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Portfolio Tabs */}
                  <div style={{
                    display: 'flex',
                    gap: 32,
                    borderBottom: '1px solid #f3d8e6',
                    marginBottom: 14
                  }}>
                    <button
                      onClick={() => setPortfolioTab('portfolio')}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '12px 0',
                        fontSize: 14,
                        fontWeight: portfolioTab === 'portfolio' ? 500 : 400,
                        color: portfolioTab === 'portfolio' ? '#1a1a1a' : '#666',
                        cursor: 'pointer',
                        borderBottom: portfolioTab === 'portfolio' ? '2px solid #e91e63' : '2px solid transparent',
                        marginBottom: '-2px'
                      }}
                    >
                      PORTFOLIO ({portfolio.length})
                    </button>
                    <button
                      onClick={() => setPortfolioTab('albums')}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '12px 0',
                        fontSize: 14,
                        fontWeight: portfolioTab === 'albums' ? 500 : 400,
                        color: portfolioTab === 'albums' ? '#1a1a1a' : '#666',
                        cursor: 'pointer',
                        borderBottom: portfolioTab === 'albums' ? '2px solid #e91e63' : '2px solid transparent',
                        marginBottom: '-2px'
                      }}
                    >
                      ALBUMS ({Math.ceil(portfolio.length / 6)})
                    </button>
                  </div>

                  {/* Portfolio Grid */}
                  {portfolioTab === 'portfolio' && (
                    <div className="portfolio-grid">
                      {portfolio.slice(0, 12).map((item) => (
                        <div
                          key={item.id}
                          style={{
                            position: 'relative',
                            paddingTop: '100%',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#f5f5f5',
                            cursor: 'pointer'
                          }}
                          onClick={() => window.open(item.media_url, '_blank')}
                        >
                          {item.media_type === 'video' ? (
                            <video
                              src={item.media_url}
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
                              alt={item.caption || 'Portfolio item'}
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
                        </div>
                      ))}
                    </div>
                  )}

                  {portfolioTab === 'albums' && (
                    <div className="albums-grid">
                      {Array.from({ length: Math.ceil(portfolio.length / 6) }).map((_, albumIdx) => (
                        <div
                          key={albumIdx}
                          style={{
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#f5f5f5',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 2
                          }}>
                            {portfolio.slice(albumIdx * 6, (albumIdx + 1) * 6).map((item, idx) => (
                              <div
                                key={item.id}
                                style={{
                                  position: 'relative',
                                  paddingTop: '100%',
                                  overflow: 'hidden'
                                }}
                                onClick={() => window.open(item.media_url, '_blank')}
                              >
                                <img
                                  src={item.media_url}
                                  alt={item.caption || 'Album item'}
                                  style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <div style={{ padding: 12, background: 'white' }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
                              Album {albumIdx + 1}
                            </div>
                            <div style={{ fontSize: 12, color: '#666' }}>
                              {portfolio.slice(albumIdx * 6, (albumIdx + 1) * 6).length} photos
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {portfolio.length > 12 && (
                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                      <button
                        onClick={() => {
                          // Show all portfolio items
                          const allItems = document.querySelectorAll('[data-portfolio-item]')
                          allItems.forEach(item => item.style.display = 'block')
                        }}
                        style={{
                          padding: '12px 24px',
                          background: '#e91e63',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        View {portfolio.length - 12} more
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </>
          )}

          {/* About Tab Content */}
          {activeTab === 'about' && (
            <>
              {/* About Section */}
              {vendor.brand_description && (
                <motion.div
                  style={{
                    marginBottom: 14,
                    border: '1px solid rgba(236,72,153,0.15)',
                    borderRadius: 18,
                    overflow: 'hidden',
                    boxShadow: '0 8px 28px rgba(236,72,153,0.08)'
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Header Banner */}
                  <div style={{
                    background: 'linear-gradient(135deg, #be185d 0%, #7c3aed 100%)',
                    padding: '20px 24px 28px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ position: 'absolute', right: -20, top: -20, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                    <div style={{ position: 'absolute', right: 40, bottom: -40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                      </div>
                      <div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>About {vendor.business_name}</h2>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: 0, marginTop: 2 }}>
                          {vendor.category || 'Wedding Vendor'}{vendor.city ? ` • ${vendor.city}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Description Body */}
                  <div style={{ background: '#fff', padding: '20px 24px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: -1, left: 24, width: 40, height: 3, background: 'linear-gradient(90deg, #be185d, #7c3aed)', borderRadius: '0 0 4px 4px' }} />
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 36, color: '#f9a8d4', lineHeight: 1, flexShrink: 0, marginTop: 2 }}>"</div>
                      <p style={{ fontSize: 15, lineHeight: 1.85, color: '#374151', whiteSpace: 'pre-wrap', margin: 0 }}>
                        {vendor.brand_description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Key Details Grid */}
              <motion.div
                style={{ marginBottom: 14, border: '1px solid #e5e7eb', borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 18px rgba(17,24,39,0.05)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.04 }}
              >
                <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #dbeafe, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                  </div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: 0 }}>Key Details</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', background: '#fff' }}>
                  {[
                    { label: 'Category', value: vendor.category || '—' },
                    { label: 'City', value: vendor.city || '—' },
                    { label: 'Experience', value: vendor.years_experience ? `${vendor.years_experience} years` : '—' },
                    { label: 'Outstation Events', value: typeof vendor.outstation_events === 'boolean' ? (vendor.outstation_events ? '✓ Yes' : '✗ No') : '—' },
                    { label: 'Service Areas', value: Array.isArray(vendor.service_areas) && vendor.service_areas.length > 0 ? vendor.service_areas.join(', ') : '—' },
                    { label: 'Member Since', value: vendor.created_at ? new Date(vendor.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—' }
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '14px 18px',
                        borderBottom: idx < 4 ? '1px solid #f3f4f6' : 'none',
                        borderRight: idx % 2 === 0 ? '1px solid #f3f4f6' : 'none',
                        transition: 'background 0.15s'
                      }}
                    >
                      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Service Details & Pricing */}
              <motion.div
                style={{ marginBottom: 14, border: '1px solid #e5e7eb', borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 18px rgba(17,24,39,0.05)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 }}
              >
                <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, #fdf4ff 0%, #fce7f3 100%)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #fce7f3, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2"><polygon points="12 2 2 7 12 22 22 7 12 2" /></svg>
                  </div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: 0 }}>Service Details & Pricing</h2>
                </div>

                <div style={{ background: '#fff', padding: '20px 22px' }}>
                  {/* Service Areas */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '8px', background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      </div>
                      <span style={{ fontWeight: 700, color: '#111827', fontSize: 14 }}>Service Areas</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {Array.isArray(vendor.service_areas) && vendor.service_areas.length > 0
                        ? vendor.service_areas.map((area, i) => (
                          <span key={i} style={{ padding: '5px 12px', background: 'linear-gradient(135deg, #fce7f3, #ede9fe)', borderRadius: '20px', fontSize: 13, color: '#7c3aed', fontWeight: 500, border: '1px solid rgba(124,58,237,0.15)' }}>
                            {area}
                          </span>
                        ))
                        : <span style={{ fontSize: 14, color: '#9ca3af' }}>Not provided</span>
                      }
                      {typeof vendor.outstation_events === 'boolean' && (
                        <span style={{ padding: '5px 12px', background: vendor.outstation_events ? '#dcfce7' : '#fee2e2', borderRadius: '20px', fontSize: 13, color: vendor.outstation_events ? '#15803d' : '#991b1b', fontWeight: 600, border: vendor.outstation_events ? '1px solid #bbf7d0' : '1px solid #fecaca' }}>
                          {vendor.outstation_events ? '✓ Outstation' : '✗ Local only'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Category-specific fields */}
                  {(() => {
                    const cfg = getCategoryConfig(vendor.category)
                    const details = vendor.service_details || {}
                    const pricing = vendor.service_pricing || {}
                    if (!cfg) return <div style={{ fontSize: 14, color: '#9ca3af', fontStyle: 'italic' }}>Category-specific details not available.</div>
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '8px', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16h16V8l-6-6z" /><path d="M14 2v6h6" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                            </div>
                            <span style={{ fontWeight: 700, color: '#111827', fontSize: 14 }}>Service Specifics</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: '12px', overflow: 'hidden', border: '1px solid #f3f4f6' }}>
                            {cfg.detailsFields.map((f, idx) => {
                              const raw = details[f.key]
                              const val = f.type === 'boolean'
                                ? (typeof raw === 'boolean' ? (raw ? 'Yes' : 'No') : '—')
                                : (raw === undefined || raw === null || raw === '' ? '—' : String(raw))
                              return (
                                <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', background: idx % 2 === 0 ? '#fafafa' : '#fff', borderBottom: idx < cfg.detailsFields.length - 1 ? '1px solid #f3f4f6' : 'none', gap: 16 }}>
                                  <div style={{ color: '#6b7280', fontSize: 14 }}>{f.label}</div>
                                  <div style={{ color: '#111827', fontSize: 14, fontWeight: 600, textAlign: 'right', maxWidth: '55%' }}>{val}</div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '8px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="12" y1="2" x2="12" y2="6" /></svg>
                            </div>
                            <span style={{ fontWeight: 700, color: '#111827', fontSize: 14 }}>Pricing</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: '12px', overflow: 'hidden', border: '1px solid #f3f4f6' }}>
                            {cfg.pricingFields.map((p, idx) => {
                              const raw = pricing[p.key]
                              const val = raw === undefined || raw === null || raw === ''
                                ? '—'
                                : `₹${Number(raw).toLocaleString('en-IN')}`
                              return (
                                <div key={p.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', background: idx % 2 === 0 ? '#fafffe' : '#fff', borderBottom: idx < cfg.pricingFields.length - 1 ? '1px solid #f3f4f6' : 'none', gap: 16 }}>
                                  <div style={{ color: '#6b7280', fontSize: 14 }}>{p.label}</div>
                                  <div style={{ color: '#15803d', fontSize: 15, fontWeight: 700, textAlign: 'right' }}>{val}</div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </motion.div>

              {/* Facilities / Services */}
              {(vendor.other_services || vendor.services?.length > 0) && (
                <motion.div
                  style={{ marginBottom: 14, border: '1px solid #e5e7eb', borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 18px rgba(17,24,39,0.05)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.12 }}
                >
                  <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #bbf7d0, #a7f3d0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    </div>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: 0 }}>Services & Facilities</h2>
                  </div>
                  <div style={{ background: '#fff', padding: '18px 22px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {vendor.services?.map((service, idx) => (
                        <div key={idx} style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '8px 14px',
                          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                          borderRadius: '12px',
                          border: '1px solid #bbf7d0',
                          fontSize: 14,
                          color: '#166534',
                          fontWeight: 500
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          {service}
                        </div>
                      ))}
                      {vendor.other_services && typeof vendor.other_services === 'string' && vendor.other_services.split(',').map((s, i) => (
                        <div key={`other-${i}`} style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '8px 14px',
                          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                          borderRadius: '12px',
                          border: '1px solid #bbf7d0',
                          fontSize: 14,
                          color: '#166534',
                          fontWeight: 500
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          {s.trim()}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Location */}
              {vendor.business_address && (
                <motion.div
                  id="location"
                  style={{ marginBottom: 14, border: '1px solid #e5e7eb', borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 18px rgba(17,24,39,0.05)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.16 }}
                >
                  <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #fed7aa, #fdba74)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📍</div>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: 0 }}>Location</h2>
                  </div>
                  <div style={{ background: '#fff', padding: '20px 22px' }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'linear-gradient(135deg, #fce7f3, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#be185d" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{vendor.business_address}</div>
                        {vendor.city && <div style={{ fontSize: 14, color: '#6b7280' }}>{vendor.city}</div>}
                        <Link href="#location" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, fontSize: 13, color: '#e91e63', fontWeight: 600, textDecoration: 'none', padding: '5px 12px', background: '#fff0f6', borderRadius: '8px', border: '1px solid #fce7f3' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                          View on map
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Booking CTA */}
              <motion.div
                style={{ marginBottom: 14, border: '1px solid rgba(236,72,153,0.2)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 18px rgba(236,72,153,0.10)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div style={{ background: 'linear-gradient(135deg, #be185d 0%, #7c3aed 100%)', padding: '24px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                      Ready to Book?
                    </div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.80)' }}>Send an enquiry or view contact details to get started.</div>
                  </div>
                  <button
                    onClick={() => setShowLeadModal(true)}
                    style={{
                      padding: '12px 24px',
                      background: 'rgba(255,255,255,0.18)',
                      color: '#fff',
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderRadius: '12px',
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: 'pointer',
                      backdropFilter: 'blur(4px)',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)' }}
                  >
                    Send Enquiry →
                  </button>
                </div>
              </motion.div>
            </>
          )}

          {/* Reviews Tab Content — Premium redesign */}
          {activeTab === 'reviews' && (
            <motion.div
              id="reviews-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Reviews Hero */}
              <div style={{
                background: 'linear-gradient(135deg, #be185d 0%, #7c3aed 100%)',
                borderRadius: '20px',
                padding: '24px 28px',
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 20,
                boxShadow: '0 8px 28px rgba(190,24,93,0.22)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{avgRating || '—'}</div>
                    <div style={{ display: 'flex', gap: 3, marginTop: 6, justifyContent: 'center' }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill={avgRating && i <= Math.round(parseFloat(avgRating)) ? '#fbbf24' : 'rgba(255,255,255,0.3)'}>
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 5 }}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</div>
                  </div>
                  {reviews.length > 0 && (
                    <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 20 }}>
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviews.filter(r => r.rating === star).length
                        const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                        return (
                          <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', width: 14, textAlign: 'right' }}>{star}</span>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="#fbbf24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                            <div style={{ width: 110, height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: '#fbbf24', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', minWidth: 16 }}>{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (reviewMyReview) {
                      setReviewRating(reviewMyReview.rating || 5)
                      setReviewText(reviewMyReview.review_text || '')
                    } else {
                      setReviewRating(5)
                      setReviewText('')
                    }
                    setReviewError('')
                    setShowReviewModal(true)
                  }}
                  style={{
                    padding: '12px 22px',
                    background: '#fff',
                    color: '#be185d',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                  {reviewAlreadyDone ? 'Edit Review' : 'Write a Review'}
                </button>
              </div>

              {/* Reviews List */}
              {reviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {reviews.map((review, reviewIdx) => {
                    const avatarColors = [
                      { bg: 'linear-gradient(135deg, #be185d, #e91e63)', text: '#fff' },
                      { bg: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', text: '#fff' },
                      { bg: 'linear-gradient(135deg, #0369a1, #0ea5e9)', text: '#fff' },
                      { bg: 'linear-gradient(135deg, #15803d, #22c55e)', text: '#fff' },
                      { bg: 'linear-gradient(135deg, #b45309, #f59e0b)', text: '#fff' },
                    ]
                    const colorScheme = avatarColors[reviewIdx % avatarColors.length]
                    return (
                      <div
                        key={review.id}
                        style={{
                          background: '#fff',
                          border: '1px solid #f3f4f6',
                          borderRadius: '18px',
                          padding: '20px 22px',
                          boxShadow: '0 2px 12px rgba(17,24,39,0.04)',
                          transition: 'box-shadow 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                          {/* Avatar */}
                          <div style={{
                            width: 46,
                            height: 46,
                            borderRadius: '14px',
                            background: colorScheme.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 18,
                            fontWeight: 700,
                            color: colorScheme.text,
                            flexShrink: 0,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                          }}>
                            {(review.user_name || 'A').charAt(0).toUpperCase()}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            {/* Name + Stars + Date */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                              <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                                  {review.user_name || 'Anonymous'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 3 }}>
                                  {[1, 2, 3, 4, 5].map((i) => (
                                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= (review.rating || 0) ? '#FFC107' : '#E5E7EB'}>
                                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                  ))}
                                  <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>{review.rating}/5</span>
                                </div>
                              </div>
                              <span style={{
                                fontSize: 12,
                                color: '#6b7280',
                                background: '#f9fafb',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                padding: '3px 10px',
                                fontWeight: 500
                              }}>
                                {new Date(review.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>

                            {/* Review text */}
                            {review.review_text && (
                              <p style={{
                                fontSize: 14,
                                lineHeight: 1.7,
                                color: '#374151',
                                margin: 0,
                                padding: '10px 14px',
                                background: '#f9fafb',
                                borderRadius: '10px',
                                borderLeft: '3px solid #e91e63'
                              }}>
                                {review.review_text}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: '#fff',
                  border: '1px solid #f3f4f6',
                  borderRadius: '18px',
                  boxShadow: '0 2px 12px rgba(17,24,39,0.04)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '16px', background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e91e63" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" /></svg>
                    </div>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: '#111827', marginBottom: 6 }}>No reviews yet</div>
                  <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 20 }}>Be the first to share your experience!</div>
                  <button
                    onClick={() => { setReviewRating(5); setReviewText(''); setReviewError(''); setShowReviewModal(true) }}
                    style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #e91e63 0%, #7c3aed 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Write the First Review
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Lead Inquiry Modal */}
      <AnimatePresence>
        {showLeadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
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
            onClick={() => setShowLeadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: 32,
                maxWidth: 500,
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20
              }}>
                <h2 style={{
                  fontSize: 20,
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--text-dark)'
                }}>
                  Hi {vendor?.business_name},
                </h2>
                <button
                  onClick={() => {
                    setShowLeadModal(false)
                    // Reset to form only if no stored customer details
                    if (!hasStoredCustomerDetails) {
                      setInquiryVerificationStep('form')
                      setInquiryOtpCode('')
                      setInquiryVerified(false)
                    } else {
                      // Keep verified state for next time
                      setInquiryVerificationStep('verified')
                    }
                    if (typeof window !== 'undefined') {
                      window.inquiryConfirmationResult = null
                    }
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

              {/* Phone Verification Steps - Only show if customer details not stored */}
              {inquiryVerificationStep === 'form' && !hasStoredCustomerDetails && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ marginBottom: 8 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--text-dark)' }}>
                      Verify Your Phone Number
                    </h3>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
                      Please verify your phone number to send an inquiry
                    </p>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 14,
                      fontWeight: 600,
                      marginBottom: 8,
                      color: 'var(--text-dark)'
                    }}>
                      Full name *
                    </label>
                    <input
                      type="text"
                      required
                      value={leadForm.name}
                      onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                      placeholder="Full name *"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #dbdbdb',
                        fontSize: 14,
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 14,
                      fontWeight: 600,
                      marginBottom: 8,
                      color: 'var(--text-dark)'
                    }}>
                      Phone Number *
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #dbdbdb',
                        background: '#f5f5f5',
                        fontSize: 14,
                        fontWeight: 600
                      }}>
                        🇮🇳 +91
                      </div>
                      <input
                        type="tel"
                        required
                        value={leadForm.contact_phone}
                        onChange={(e) => setLeadForm({ ...leadForm, contact_phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        placeholder="9876543210"
                        maxLength={10}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #dbdbdb',
                          fontSize: 14,
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div id="recaptcha-container-inquiry"></div>

                  <button
                    type="button"
                    onClick={handleSendInquiryOtp}
                    disabled={sendingInquiryOtp || !leadForm.name || !leadForm.contact_phone || leadForm.contact_phone.length !== 10}
                    style={{
                      width: '100%',
                      padding: '14px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      background: sendingInquiryOtp || !leadForm.name || !leadForm.contact_phone || leadForm.contact_phone.length !== 10 ? '#ccc' : '#e91e63',
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: sendingInquiryOtp || !leadForm.name || !leadForm.contact_phone || leadForm.contact_phone.length !== 10 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {sendingInquiryOtp ? 'Sending...' : 'Send Verification Code'}
                  </button>
                </div>
              )}

              {inquiryVerificationStep === 'otp' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ marginBottom: 8 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--text-dark)' }}>
                      Enter Verification Code
                    </h3>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
                      We sent a 6-digit code to +91 {leadForm.contact_phone}
                    </p>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 14,
                      fontWeight: 600,
                      marginBottom: 8,
                      color: 'var(--text-dark)'
                    }}>
                      Verification Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={inquiryOtpCode}
                      onChange={(e) => setInquiryOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #dbdbdb',
                        fontSize: 14,
                        outline: 'none',
                        textAlign: 'center',
                        letterSpacing: '8px',
                        fontSize: 20,
                        fontWeight: 600
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setInquiryVerificationStep('form')
                        setInquiryOtpCode('')
                      }}
                      style={{
                        flex: 1,
                        padding: '14px 24px',
                        borderRadius: '8px',
                        border: '1px solid #dbdbdb',
                        background: 'white',
                        color: 'var(--text-dark)',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Change Number
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyInquiryOtp}
                      disabled={verifyingInquiryOtp || !inquiryOtpCode || inquiryOtpCode.length !== 6}
                      style={{
                        flex: 1,
                        padding: '14px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        background: verifyingInquiryOtp || !inquiryOtpCode || inquiryOtpCode.length !== 6 ? '#ccc' : '#e91e63',
                        color: 'white',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: verifyingInquiryOtp || !inquiryOtpCode || inquiryOtpCode.length !== 6 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {verifyingInquiryOtp ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </div>
              )}

              {/* Inquiry Form (shown after verification) */}
              {inquiryVerificationStep === 'verified' && (
                <form onSubmit={handleSubmitLead} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{
                    padding: '12px',
                    background: '#d1fae5',
                    borderRadius: '8px',
                    fontSize: 14,
                    color: '#065f46',
                    marginBottom: 8
                  }}>
                    ✓ Phone verified: +91 {leadForm.contact_phone}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: 14,
                        fontWeight: 600,
                        marginBottom: 8,
                        color: 'var(--text-dark)'
                      }}>
                        Full name *
                      </label>
                      <input
                        type="text"
                        required
                        value={leadForm.name}
                        onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                        placeholder="Full name *"
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: leadForm.name ? '1px solid #dbdbdb' : '1px solid #ef4444',
                          fontSize: 14,
                          outline: 'none'
                        }}
                      />
                      {!leadForm.name && (
                        <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>Required</div>
                      )}
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: 14,
                        fontWeight: 600,
                        marginBottom: 8,
                        color: 'var(--text-dark)'
                      }}>
                        Phone Number *
                      </label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #dbdbdb',
                          background: '#f5f5f5',
                          fontSize: 14,
                          fontWeight: 600
                        }}>
                          🇮🇳 +91
                        </div>
                        <input
                          type="tel"
                          required
                          value={leadForm.contact_phone}
                          onChange={(e) => setLeadForm({ ...leadForm, contact_phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                          placeholder="9876543210"
                          maxLength={10}
                          style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #dbdbdb',
                            fontSize: 14,
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: 14,
                        fontWeight: 600,
                        marginBottom: 8,
                        color: 'var(--text-dark)'
                      }}>
                        Email address
                      </label>
                      <input
                        type="email"
                        value={leadForm.email}
                        onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                        placeholder="Email address"
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #dbdbdb',
                          fontSize: 14,
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: 14,
                        fontWeight: 600,
                        marginBottom: 8,
                        color: 'var(--text-dark)'
                      }}>
                        Function date *
                      </label>
                      <input
                        type="date"
                        required
                        value={leadForm.event_date}
                        onChange={(e) => {
                          const date = e.target.value
                          setLeadForm({ ...leadForm, event_date: date })
                          const status = checkDateAvailability(date)
                          setSelectedDateStatus(status)
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #dbdbdb',
                          fontSize: 14,
                          outline: 'none'
                        }}
                      />
                      {leadForm.event_date && selectedDateStatus && (
                        <div style={{
                          marginTop: 8,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: 12,
                          fontWeight: 500,
                          background: selectedDateStatus === 'available' ? '#d1fae5' : selectedDateStatus === 'booked' ? '#fee2e2' : '#f3f4f6',
                          color: selectedDateStatus === 'available' ? '#065f46' : selectedDateStatus === 'booked' ? '#991b1b' : '#374151'
                        }}>
                          {selectedDateStatus === 'available' ? '✓ Available' : selectedDateStatus === 'booked' ? '✗ Booked' : '✗ Not Available'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 14,
                      fontWeight: 600,
                      marginBottom: 8,
                      color: 'var(--text-dark)'
                    }}>
                      Budget (optional)
                    </label>
                    <input
                      type="text"
                      value={leadForm.budget}
                      onChange={(e) => setLeadForm({ ...leadForm, budget: e.target.value })}
                      placeholder="e.g. ₹2-3 Lakh"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #dbdbdb',
                        fontSize: 14,
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 14,
                      fontWeight: 600,
                      marginBottom: 8,
                      color: 'var(--text-dark)'
                    }}>
                      Details about my wedding
                    </label>
                    <textarea
                      value={leadForm.details}
                      onChange={(e) => setLeadForm({ ...leadForm, details: e.target.value })}
                      placeholder="Details about my wedding"
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #dbdbdb',
                        fontSize: 14,
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: '#f0f9ff',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontSize: 14, color: '#262626' }}>Notify me on WhatsApp</span>
                    <button
                      type="button"
                      onClick={() => setWhatsappNotify(!whatsappNotify)}
                      style={{
                        width: 44,
                        height: 24,
                        borderRadius: '12px',
                        border: 'none',
                        background: whatsappNotify ? '#10b981' : '#ccc',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.3s'
                      }}
                    >
                      <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: 'white',
                        position: 'absolute',
                        top: 2,
                        left: whatsappNotify ? 22 : 2,
                        transition: 'all 0.3s'
                      }} />
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingLead || !leadForm.name || !leadForm.contact_phone || !leadForm.event_date || !inquiryVerified}
                    style={{
                      width: '100%',
                      padding: '14px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      background: submittingLead || !leadForm.name || !leadForm.contact_phone || !leadForm.event_date || !inquiryVerified ? '#ccc' : '#e91e63',
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: submittingLead || !leadForm.name || !leadForm.contact_phone || !leadForm.event_date || !inquiryVerified ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {submittingLead ? 'Submitting...' : 'Submit Inquiry'}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Write a Review Modal — login required; one review per user per vendor */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20
            }}
            onClick={() => setShowReviewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: 32,
                maxWidth: 480,
                width: '100%',
                boxShadow: '0 24px 48px rgba(0,0,0,0.12)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#202124' }}>
                  {reviewAlreadyDone ? 'Edit your review' : 'Write a review'}
                </h2>
                <button
                  onClick={() => setShowReviewModal(false)}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 8, color: '#5f6368' }}
                  aria-label="Close"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
              {!currentUser ? (
                <div style={{ padding: '24px 0', color: '#5f6368', fontSize: 15 }}>
                  Please sign in with your phone number to write a review. One review per customer per vendor.
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#202124', marginBottom: 8 }}>Your name</label>
                    <input
                      type="text"
                      value={reviewCustomerName}
                      onChange={(e) => setReviewCustomerName(e.target.value)}
                      placeholder="Enter your full name"
                      style={{
                        width: '100%',
                        padding: 12,
                        borderRadius: 8,
                        border: '1px solid #dadce0',
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <div style={{ marginTop: 6, fontSize: 12, color: '#5f6368' }}>
                      You can also update this in Settings.
                    </div>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#202124', marginBottom: 10 }}>Your rating</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            padding: 4
                          }}
                        >
                          <svg width="32" height="32" viewBox="0 0 24 24" fill={star <= reviewRating ? '#FFC107' : '#E0E0E0'} stroke={star <= reviewRating ? '#FFC107' : '#E0E0E0'}>
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#202124', marginBottom: 8 }}>Your review (optional)</label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your experience with this vendor..."
                      rows={4}
                      style={{
                        width: '100%',
                        padding: 12,
                        borderRadius: 8,
                        border: '1px solid #dadce0',
                        fontSize: 14,
                        resize: 'vertical',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  {reviewError && (
                    <div style={{ marginBottom: 16, padding: 12, background: '#fce8e6', borderRadius: 8, fontSize: 13, color: '#c5221f' }}>
                      {reviewError}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setShowReviewModal(false)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: 8,
                        border: '1px solid #dadce0',
                        background: '#fff',
                        color: '#5f6368',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitReview}
                      disabled={reviewSubmitting || !reviewCustomerName.trim()}
                      style={{
                        padding: '10px 24px',
                        borderRadius: 8,
                        border: 'none',
                        background: (reviewSubmitting || !reviewCustomerName.trim()) ? '#ccc' : '#1a73e8',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: (reviewSubmitting || !reviewCustomerName.trim()) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {reviewSubmitting ? 'Submitting...' : reviewAlreadyDone ? 'Update review' : 'Submit review'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Verification Modal (View Contact) */}
      <AnimatePresence>
        {showContactModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
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
            onClick={() => {
              if (verificationStep === 'form') {
                setShowContactModal(false)
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: 32,
                maxWidth: 450,
                width: '100%'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24
              }}>
                <h2 style={{
                  fontSize: 20,
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--text-dark)'
                }}>
                  {verificationStep === 'form' ? 'Verify Your Mobile' : verificationStep === 'otp' ? 'Enter OTP' : 'Contact Details'}
                </h2>
                {verificationStep === 'form' && (
                  <button
                    onClick={() => setShowContactModal(false)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: 24,
                      color: '#8e8e8e'
                    }}
                  >
                    ×
                  </button>
                )}
              </div>

              {verificationStep === 'form' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 14,
                      fontWeight: 600,
                      marginBottom: 8,
                      color: 'var(--text-dark)'
                    }}>
                      Full name *
                    </label>
                    <input
                      type="text"
                      required
                      value={verificationForm.name}
                      onChange={(e) => setVerificationForm({ ...verificationForm, name: e.target.value })}
                      placeholder="Enter your full name"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #dbdbdb',
                        fontSize: 14,
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 14,
                      fontWeight: 600,
                      marginBottom: 8,
                      color: 'var(--text-dark)'
                    }}>
                      Phone Number *
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #dbdbdb',
                        background: '#f5f5f5',
                        fontSize: 14,
                        fontWeight: 500
                      }}>
                        🇮🇳 +91
                      </div>
                      <input
                        type="tel"
                        required
                        value={verificationForm.phone}
                        onChange={(e) => setVerificationForm({ ...verificationForm, phone: e.target.value })}
                        placeholder="9876543210"
                        maxLength={10}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #dbdbdb',
                          fontSize: 14,
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: '#f0f9ff',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontSize: 14, color: '#262626' }}>Notify me on WhatsApp</span>
                    <button
                      type="button"
                      onClick={() => setWhatsappNotify(!whatsappNotify)}
                      style={{
                        width: 44,
                        height: 24,
                        borderRadius: '12px',
                        border: 'none',
                        background: whatsappNotify ? '#10b981' : '#ccc',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.3s'
                      }}
                    >
                      <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: 'white',
                        position: 'absolute',
                        top: 2,
                        left: whatsappNotify ? 22 : 2,
                        transition: 'all 0.3s'
                      }} />
                    </button>
                  </div>

                  <div id="recaptcha-container-contact" style={{ marginTop: 8 }}></div>

                  <button
                    onClick={handleSendOtp}
                    disabled={sendingOtp || !verificationForm.name || !verificationForm.phone || verificationForm.phone.length !== 10}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: sendingOtp || !verificationForm.name || !verificationForm.phone || verificationForm.phone.length !== 10 ? '#ccc' : '#e91e63',
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: sendingOtp || !verificationForm.name || !verificationForm.phone || verificationForm.phone.length !== 10 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {sendingOtp ? 'Sending OTP...' : 'View Contact'}
                  </button>
                </div>
              )}

              {verificationStep === 'otp' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{
                    padding: 16,
                    background: '#f0f9ff',
                    borderRadius: '8px',
                    fontSize: 14,
                    color: '#0369a1'
                  }}>
                    OTP sent to +91 {verificationForm.phone}
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 14,
                      fontWeight: 600,
                      marginBottom: 8,
                      color: 'var(--text-dark)'
                    }}>
                      Enter 6-digit OTP *
                    </label>
                    <input
                      type="text"
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #dbdbdb',
                        fontSize: 18,
                        textAlign: 'center',
                        letterSpacing: '8px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <button
                    onClick={handleVerifyOtp}
                    disabled={verifyingOtp || otpCode.length !== 6}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: verifyingOtp || otpCode.length !== 6 ? '#ccc' : '#e91e63',
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: verifyingOtp || otpCode.length !== 6 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {verifyingOtp ? 'Verifying...' : 'Verify & View Contact'}
                  </button>
                  <button
                    onClick={() => {
                      setVerificationStep('form')
                      setOtpCode('')
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #dbdbdb',
                      background: 'white',
                      color: '#262626',
                      fontSize: 14,
                      cursor: 'pointer'
                    }}
                  >
                    Change Number
                  </button>
                </div>
              )}

              {verificationStep === 'verified' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{
                    padding: 16,
                    background: '#d1fae5',
                    borderRadius: '8px',
                    fontSize: 14,
                    color: '#065f46',
                    textAlign: 'center'
                  }}>
                    ✓ Mobile verified! Contact visible for 24 hours (no need to verify again for this vendor).
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {vendor.phone && (
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#8e8e8e', marginBottom: 4 }}>Phone</div>
                        <a href={`tel:${vendor.phone}`} style={{ fontSize: 15, color: '#e91e63', textDecoration: 'none' }}>
                          {vendor.phone}
                        </a>
                      </div>
                    )}
                    {vendor.whatsapp && (
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#8e8e8e', marginBottom: 4 }}>WhatsApp</div>
                        <a href={`https://wa.me/${vendor.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, color: '#e91e63', textDecoration: 'none' }}>
                          {vendor.whatsapp}
                        </a>
                      </div>
                    )}
                    {vendor.email && (
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#8e8e8e', marginBottom: 4 }}>Email</div>
                        <a href={`mailto:${vendor.email}`} style={{ fontSize: 15, color: '#e91e63', textDecoration: 'none' }}>
                          {vendor.email}
                        </a>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowContactModal(false)
                      setVerificationStep('form')
                      setOtpCode('')
                    }}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#e91e63',
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  )
}


