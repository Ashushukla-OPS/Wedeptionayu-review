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
   <div
  style={{
    background:
      'linear-gradient(180deg, #fff7fb 0%, #fffafd 45%, #ffffff 100%)',
    padding: '18px 0 0',
    borderBottom: 'none',
  }}
>
  <style>{`
    .vendor-master-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 345px;
      gap: 16px;
      align-items: start;
    }

    .vendor-master-hero {
      grid-column: 1 / 2;
    }

    .vendor-master-sidebar {
      grid-column: 2 / 3;
      grid-row: 1 / 3;
    }

    .vendor-master-info {
      grid-column: 1 / 2;
    }

    .premium-hover {
      transition: all 0.22s ease;
    }

    .premium-hover:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 28px rgba(190, 24, 93, 0.18);
    }

    .vendor-action-btn {
      transition: all 0.22s ease;
    }

    .vendor-action-btn:hover {
      transform: translateY(-2px);
      background: #fff0f7 !important;
      border-color: rgba(219,39,119,0.32) !important;
      box-shadow: 0 10px 22px rgba(190,24,93,0.10) !important;
    }

    @media (max-width: 1050px) {
      .vendor-master-grid {
        grid-template-columns: 1fr;
        gap: 14px;
      }

      .vendor-master-hero,
      .vendor-master-sidebar,
      .vendor-master-info {
        grid-column: 1 / 2;
        grid-row: auto;
      }

      .vendor-sidebar-card {
        position: static !important;
        margin-top: 0 !important;
      }

      .vendor-master-hero {
        height: 320px !important;
      }
    }

    @media (max-width: 640px) {
      .vendor-master-grid {
        padding: 0 12px !important;
        gap: 12px;
      }

      .vendor-master-hero {
        height: 230px !important;
        border-radius: 16px !important;
      }

      .vendor-info-inner {
        padding: 16px !important;
        border-radius: 16px !important;
      }

      .vendor-title {
        font-size: 24px !important;
      }

      .vendor-action-wrap {
        gap: 8px !important;
      }

      .vendor-action-wrap button {
        flex: 1 1 calc(50% - 8px);
        justify-content: center;
      }
    }
  `}</style>

  <div
    className="container vendor-master-grid"
    style={{
      
      maxWidth: '1320px',
      margin: '0 auto',
      padding: '0 18px',
    }}
  >
    {/* Left: Hero Image */}
    {mainImage && (
      <div
        className="vendor-master-hero"
        style={{
          position: 'relative',
          width: '100%',
          height: '405px',
          borderRadius: '20px',
          overflow: 'hidden',
          background: '#f5f5f5',
          boxShadow:
            '0 22px 52px rgba(190,24,93,0.14), 0 6px 18px rgba(17,24,39,0.06)',
          border: '1px solid rgba(255,255,255,0.9)',
        }}
      >
        {mainImage.media_type === 'video' ? (
          <video
            src={mainImage.media_url}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
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
              objectFit: 'cover',
            }}
          />
        )}

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.22) 100%)',
            pointerEvents: 'none',
          }}
        />

        {vendor.category && (
          <div
            style={{
              position: 'absolute',
              left: 16,
              bottom: 16,
              padding: '8px 14px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.75)',
              color: '#be185d',
              fontSize: 13,
              fontWeight: 800,
              boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
            }}
          >
            {vendor.category}
          </div>
        )}
      </div>
    )}

    {/* Right Sidebar */}
    <div className="vendor-master-sidebar">
      <motion.div
        className="vendor-sidebar-card"
        style={{
          padding: 18,
          background: 'rgba(255,255,255,0.96)',
          border: '1px solid rgba(219,39,119,0.14)',
          borderRadius: '20px',
          boxShadow:
            '0 20px 48px rgba(17,24,39,0.10), 0 8px 22px rgba(219,39,119,0.08)',
          position: 'sticky',
          top: 18,
          marginTop: 0,
          backdropFilter: 'blur(14px)',
        }}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* Price */}
        <div
          style={{
            marginBottom: 16,
            paddingBottom: 16,
            borderBottom: '1px solid rgba(219,39,119,0.12)',
          }}
        >
          <h3
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#9ca3af',
              marginBottom: 7,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
            }}
          >
            Starting Price
          </h3>

          <div style={{ fontSize: 1, color: '#111827', lineHeight: 1.6 }}>
            {vendor.price_range?.min ? (
              <>
                <div>
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 650,
                      color: '#1c212c',
                      lineHeight: 1.1,
                      letterSpacing: '-0.8px',
                    }}
                  >
                    ₹ {vendor.price_range.min.toLocaleString('en-IN')}
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      color: '#6b7280',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {primaryPriceLabel}
                  </div>
                </div>

                {vendor.price_range.max && vendor.price_range.max > vendor.price_range.min && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: '9px 10px',
                      borderRadius: 12,
                      background: '#fff7fb',
                      border: '1px solid rgba(219,39,119,0.12)',
                      color: '#6b7280',
                      fontSize: 13,
                    }}
                  >
                    {secondaryPriceLabel}{' '}
                    <span style={{ color: '#111827', fontWeight: 800 }}>
                      ₹ {vendor.price_range.max.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontWeight: 800 }}>Contact for pricing</div>
            )}
          </div>
        </div>

        {/* Contact Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 16 }}>
          <p
            style={{
              fontSize: 13,
              color: '#6b7280',
              margin: 0,
              lineHeight: 1.45,
            }}
          >
            Get a tailored quote for your wedding date
          </p>

          <button
            className="premium-hover"
            onClick={() => setShowLeadModal(true)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #db2777 0%, #9d174d 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '13px',
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 12px 24px rgba(219,39,119,0.24)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Send Enquiry
          </button>

          <button
            className="premium-hover"
            onClick={() => setShowContactModal(true)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#fff0f7',
              color: '#be185d',
              border: '1px solid rgba(219,39,119,0.24)',
              borderRadius: '13px',
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            View Contact
          </button>
        </div>

        {/* Availability */}
        <div
          style={{
            paddingTop: 16,
            borderTop: '1px solid rgba(219,39,119,0.12)',
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 850,
              color: '#111827',
              marginBottom: 10,
            }}
          >
            Check Availability
          </h3>

          <form
            onSubmit={handleCheckAvailability}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <input
              type="date"
              required
              value={availabilityCheckDate}
              onChange={(e) => {
                setAvailabilityCheckDate(e.target.value)
                setAvailabilityCheckResult(null)
              }}
              min={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                padding: '11px 12px',
                borderRadius: '12px',
                border: '1px solid rgba(17,24,39,0.12)',
                fontSize: 14,
                outline: 'none',
                background: '#ffffff',
                color: '#111827',
              }}
            />

            <button
              type="submit"
              disabled={availabilityCheckSending}
              style={{
                width: '100%',
                padding: '11px 16px',
               background: availabilityCheckSending
  ? 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)'
  : 'linear-gradient(135deg, #7c3aed 0%, #ec4899 45%, #f97316 100%)',
boxShadow: '0 14px 30px rgba(236,72,153,0.28)',
border: '1px solid rgba(255,255,255,0.28)',
letterSpacing: '0.2px',
                color: 'white',
                borderRadius: '12px',
                fontSize: 14,
                fontWeight: 800,
                cursor: availabilityCheckSending ? 'wait' : 'pointer',
              }}
            >
              {availabilityCheckSending ? 'Checking...' : 'Check Availability'}
            </button>

            {availabilityCheckResult && (
              <div
                style={{
                  padding: '11px 12px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 800,
                  background:
                    availabilityCheckResult === 'available'
                      ? '#dcfce7'
                      : availabilityCheckResult === 'booked'
                        ? '#fee2e2'
                        : '#f3f4f6',
                  color:
                    availabilityCheckResult === 'available'
                      ? '#166534'
                      : availabilityCheckResult === 'booked'
                        ? '#991b1b'
                        : '#374151',
                }}
              >
                {availabilityCheckResult === 'available'
                  ? '✓ Available'
                  : availabilityCheckResult === 'booked'
                    ? '✗ Booked'
                    : '✗ Unavailable'}
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </div>

    {/* Vendor Info */}
    <div
  className="vendor-master-info"
  style={{
    background:
      'linear-gradient(135deg, rgba(255,255,255,0.20), rgba(255,240,247,0.34))',
    paddingTop: 0,
    paddingBottom: 0,
  }}
>
  <div
    className="vendor-info-inner"
    style={{
      background:
        'linear-gradient(135deg, rgba(255,255,255,0.86), rgba(255,247,251,0.74))',
      border: '1px solid rgba(255,255,255,0.78)',
      borderRadius: '20px',
      padding: '22px 24px',
      boxShadow:
        '0 24px 60px rgba(17,24,39,0.10), 0 10px 28px rgba(219,39,119,0.10), inset 0 1px 0 rgba(255,255,255,0.80)',
      minHeight: 150,
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(circle at top left, rgba(219,39,119,0.14), transparent 35%), radial-gradient(circle at bottom right, rgba(124,58,237,0.10), transparent 35%)',
        pointerEvents: 'none',
      }}
    />

    <div style={{ position: 'relative', zIndex: 1 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        <h1
          className="vendor-title"
          style={{
            fontSize: 30,
            fontWeight: 650,
            color: '#111827',
            margin: 0,
            letterSpacing: '-0.9px',
            lineHeight: 1.12,
          }}
        >
          {vendor.business_name}
        </h1>

        {vendor.verified && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 11px',
              background: 'rgba(238,242,255,0.82)',
              borderRadius: '999px',
              fontSize: 12,
              color: '#4338ca',
              fontWeight: 800,
              border: '1px solid rgba(99,102,241,0.20)',
              boxShadow: '0 6px 14px rgba(67,56,202,0.08)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
            </svg>
            Verified
          </div>
        )}

        {vendor.category && (
          <div
            style={{
              padding: '5px 11px',
              background: 'rgba(255,240,247,0.86)',
              borderRadius: '999px',
              fontSize: 12,
              color: '#be185d',
              fontWeight: 800,
              border: '1px solid rgba(219,39,119,0.18)',
              boxShadow: '0 6px 14px rgba(219,39,119,0.08)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            {vendor.category}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 11,
          flexWrap: 'wrap',
        }}
      >
        {avgRating && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              background: 'rgba(240,253,244,0.82)',
              borderRadius: 12,
              border: '1px solid rgba(187,247,208,0.90)',
              boxShadow: '0 8px 18px rgba(22,163,74,0.07)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            <span style={{ fontSize: 16, color: '#16a34a' }}>★</span>
            <span style={{ fontSize: 15, fontWeight: 850, color: '#15803d' }}>
              {avgRating}
            </span>
            <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 700 }}>
              ({reviews.length} reviews)
            </span>
          </div>
        )}

        {vendor.city && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '6px 10px',
              borderRadius: 12,
              background: 'rgba(255,247,251,0.82)',
              border: '1px solid rgba(219,39,119,0.14)',
              boxShadow: '0 8px 18px rgba(219,39,119,0.06)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            <span style={{ fontSize: 14, color: '#374151', fontWeight: 800 }}>
              📍 {vendor.city}
            </span>

            <Link
              href={`#location`}
              style={{
                fontSize: 13,
                color: '#be185d',
                textDecoration: 'none',
                fontWeight: 800,
              }}
            >
              View map
            </Link>
          </div>
        )}
      </div>

      {vendor.business_address && (
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.55,
            color: '#6b7280',
            marginTop: 0,
            marginBottom: 13,
          }}
        >
          {vendor.business_address}
        </p>
      )}

      <div
        style={{
          height: 1,
          background:
            'linear-gradient(90deg, transparent, rgba(219,39,119,0.30), transparent)',
          margin: '4px 0 14px',
        }}
      />

      {/* Action Buttons */}
      <div
        className="vendor-action-wrap"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        {[
          {
            label: `${portfolio.length} Photos`,
            title: 'Photos',
            stroke: '#6b7280',
            icon: (
              <>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </>
            ),
            onClick: () => {
              document.getElementById('portfolio-section')?.scrollIntoView({
                behavior: 'smooth',
              })
            },
          },
          {
            label: 'Shortlist',
            title: 'Shortlist',
            stroke: '#db2777',
            icon: (
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            ),
            onClick: () => {
              ;(async () => {
                if (!currentUser) {
                  alert('Please login to shortlist vendors.')
                  return
                }

                try {
                  const token = await currentUser.getIdToken(true)

                  const resList = await fetch('/api/shortlist', {
                    headers: { Authorization: `Bearer ${token}` },
                  })

                  const listData = await resList.json()
                  const exists = (listData.items || []).some(
                    (it) => it.vendor_id === vendor.id
                  )

                  if (exists) {
                    const res = await fetch('/api/shortlist', {
                      method: 'DELETE',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ vendor_id: vendor.id }),
                    })

                    const d = await res.json().catch(() => ({}))
                    if (!res.ok) throw new Error(d.error || 'Failed to remove')
                    alert('Removed from shortlist')
                  } else {
                    const res = await fetch('/api/shortlist', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ vendor_id: vendor.id }),
                    })

                    const d = await res.json().catch(() => ({}))
                    if (!res.ok) throw new Error(d.error || 'Failed to add')
                    alert('Added to shortlist')
                  }
                } catch (e) {
                  alert(e.message || 'Shortlist failed')
                }
              })()
            },
          },
          {
            label: 'Write a review',
            title: 'Write a review',
            stroke: '#7c3aed',
            icon: (
              <>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </>
            ),
            onClick: () => {
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
            },
          },
          {
            label: 'Share',
            title: 'Share',
            stroke: '#0284c7',
            icon: (
              <>
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </>
            ),
            onClick: () => {
              const url = window.location.href

              if (navigator.share) {
                navigator.share({
                  title: vendor.business_name,
                  url,
                })
              } else {
                navigator.clipboard.writeText(url)
                alert('Link copied to clipboard!')
              }
            },
          },
        ].map((item) => (
          <button
            key={item.label}
            className="vendor-action-btn"
            onClick={item.onClick}
            title={item.title}
            style={{
              background: 'rgba(255,255,255,0.72)',
              border: '1px solid rgba(255,255,255,0.82)',
              borderRadius: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 13px',
              boxShadow:
                '0 10px 24px rgba(17,24,39,0.07), inset 0 1px 0 rgba(255,255,255,0.75)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke={item.stroke}
              strokeWidth="2"
            >
              {item.icon}
            </svg>

            <span
              style={{
                fontSize: 13,
                color: '#374151',
                fontWeight: 800,
              }}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  </div>
</div>
  </div>
</div>

      {/* Main Content */}
    <div
  className="container vendor-content-wrap"
  style={{
  maxWidth: '1320px',
padding: '0 18px 26px'
  }}
>
  <style>{`
    .vendor-content-wrap {
      width: 100%;
    }

    .vendor-tabs {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 14px 0 22px;
      width: 100%;
      overflow-x: auto;
    }

    .vendor-tab-btn {
      border: none;
      padding: 11px 22px;
      font-size: 12px;
      cursor: pointer;
      border-radius: 3px;
      transition: all 0.22s ease;
      white-space: nowrap;
      flex-shrink: 0;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .vendor-tab-btn:hover {
      background: #6d28d9 !important;
      color: #ffffff !important;
      transform: translateY(-1px);
    }

    .premium-section-card {
      border-radius: 9px;
      overflow: hidden;
      background: #ffffff;
      border: 1px solid rgba(88,28,135,0.08);
      box-shadow: 0 16px 36px rgba(15,23,42,0.08);
      margin-bottom: 22px;
    }

    .premium-section-header {
      padding: 15px 18px;
      border-bottom: 1px solid rgba(15,23,42,0.06);
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f3edff;
    }

    .premium-icon-box {
      width: 30px;
      height: 30px;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: #e9ddff;
      color: #6d28d9;
      font-weight: 900;
    }

    .portfolio-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }

    .albums-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
    }

    .portfolio-item-card {
      transition: all 0.22s ease;
    }

    .portfolio-item-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 18px 36px rgba(15,23,42,0.14);
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .detail-box {
      padding: 18px 20px;
      background: #ffffff;
    }

    .detail-label {
      font-size: 11px;
      color: #a855f7;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 7px;
    }

    .detail-value {
      font-size: 13px;
      font-weight: 800;
      color: #374151;
    }

    .review-card {
      transition: all 0.22s ease;
    }

    .review-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 18px 34px rgba(15,23,42,0.10) !important;
    }

    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }

    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    @media (max-width: 900px) {
      .portfolio-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .albums-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 640px) {
      .vendor-content-wrap {
        padding: 0 12px 26px !important;
      }

      .vendor-tabs {
        margin: 12px 0 18px;
      }

      .vendor-tab-btn {
        padding: 10px 16px;
        font-size: 11px;
      }

      .portfolio-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .albums-grid {
        grid-template-columns: 1fr;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .detail-box {
        border-right: none !important;
      }

      .about-title {
        font-size: 17px !important;
      }

      .booking-cta {
        flex-direction: column !important;
        align-items: flex-start !important;
      }

      .booking-cta button {
        width: 100% !important;
        justify-content: center !important;
      }
    }
  `}</style>

  {/* Navigation Tabs */}
  <div className="vendor-tabs hide-scrollbar">
    {[
      { key: 'projects', label: 'Projects' },
      { key: 'about', label: 'About' },
      { key: 'reviews', label: `Reviews ${reviews.length > 0 ? `(${reviews.length})` : ''}` },
    ].map((tab) => (
      <button
        key={tab.key}
        className="vendor-tab-btn"
        onClick={() => setActiveTab(tab.key)}
        style={{
          background: activeTab === tab.key ? '#6d28d9' : 'transparent',
          color: activeTab === tab.key ? '#ffffff' : '#374151',
          fontWeight: activeTab === tab.key ? 850 : 700,
          boxShadow:
            activeTab === tab.key
              ? '0 10px 22px rgba(109,40,217,0.26)'
              : 'none',
        }}
      >
        {tab.label}
      </button>
    ))}
  </div>

  {/* Projects Tab Content */}
  {activeTab === 'projects' && (
    <>
      {portfolio.length > 0 && (
        <motion.div
          id="portfolio-section"
          className="premium-section-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div
            className="premium-section-header"
            style={{
              background: '#6d28d9',
              color: '#ffffff',
            }}
          >
            <div
              className="premium-icon-box"
              style={{
                background: 'rgba(255,255,255,0.16)',
                color: '#ffffff',
              }}
            >
              ◉
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 850, margin: 0 }}>
                Projects & Portfolio
              </h2>
              <p style={{ fontSize: 12, opacity: 0.78, margin: '3px 0 0' }}>
                View photos, albums and work samples
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              padding: '14px 18px 0',
              borderBottom: '1px solid rgba(15,23,42,0.06)',
            }}
          >
            {[
              { key: 'portfolio', label: `PORTFOLIO (${portfolio.length})` },
              { key: 'albums', label: `ALBUMS (${Math.ceil(portfolio.length / 6)})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setPortfolioTab(tab.key)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '10px 4px 12px',
                  fontSize: 12,
                  fontWeight: portfolioTab === tab.key ? 850 : 700,
                  color: portfolioTab === tab.key ? '#6d28d9' : '#6b7280',
                  cursor: 'pointer',
                  borderBottom:
                    portfolioTab === tab.key
                      ? '3px solid #6d28d9'
                      : '3px solid transparent',
                  marginBottom: '-1px',
                  letterSpacing: '0.04em',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: 18 }}>
            {portfolioTab === 'portfolio' && (
              <div className="portfolio-grid">
                {portfolio.slice(0, 12).map((item) => (
                  <div
                    key={item.id}
                    className="portfolio-item-card"
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '1 / 1',
                      borderRadius: 10,
                      overflow: 'hidden',
                      background: '#f3f4f6',
                      cursor: 'pointer',
                      border: '1px solid rgba(15,23,42,0.08)',
                    }}
                    onClick={() => window.open(item.media_url, '_blank')}
                  >
                    {item.media_type === 'video' ? (
                      <video
                        src={item.media_url}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <img
                        src={item.media_url}
                        alt={item.caption || 'Portfolio item'}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
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
                    className="portfolio-item-card"
                    style={{
                      borderRadius: 10,
                      overflow: 'hidden',
                      background: '#fff',
                      cursor: 'pointer',
                      border: '1px solid rgba(15,23,42,0.08)',
                      boxShadow: '0 10px 24px rgba(15,23,42,0.07)',
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 2,
                      }}
                    >
                      {portfolio.slice(albumIdx * 6, (albumIdx + 1) * 6).map((item) => (
                        <div
                          key={item.id}
                          style={{
                            position: 'relative',
                            paddingTop: '100%',
                            overflow: 'hidden',
                          }}
                          onClick={() => window.open(item.media_url, '_blank')}
                        >
                          <img
                            src={item.media_url}
                            alt={item.caption || 'Album item'}
                            style={{
                              position: 'absolute',
                              inset: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <div style={{ padding: 13 }}>
                      <div style={{ fontSize: 14, fontWeight: 850, color: '#111827' }}>
                        Album {albumIdx + 1}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>
                        {portfolio.slice(albumIdx * 6, (albumIdx + 1) * 6).length} photos
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </>
  )}

  {/* About Tab Content */}
  {activeTab === 'about' && (
    <>
      {vendor.brand_description && (
        <motion.div
          className="premium-section-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div
            style={{
              background: '#6d28d9',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 900,
              }}
            >
              ●
            </div>

            <div>
              <h2
                className="about-title"
                style={{
                  fontSize: 20,
                  fontWeight: 850,
                  color: '#ffffff',
                  margin: 0,
                }}
              >
                About {vendor.business_name}
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.78)',
                  margin: '3px 0 0',
                  fontWeight: 600,
                }}
              >
                {vendor.category || 'Wedding Vendor'}
                {vendor.city ? ` • ${vendor.city}` : ''}
              </p>
            </div>
          </div>

          <div style={{ padding: '19px 22px', background: '#ffffff' }}>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.75,
                color: '#4b5563',
                whiteSpace: 'pre-wrap',
                margin: 0,
                fontWeight: 500,
              }}
            >
              {vendor.brand_description}
            </p>
          </div>
        </motion.div>
      )}

      {/* Key Details */}
      <motion.div
        className="premium-section-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.04 }}
      >
        <div className="premium-section-header">
          <div className="premium-icon-box">⌘</div>
          <h2 style={{ fontSize: 16, fontWeight: 850, color: '#374151', margin: 0 }}>
            Key Details
          </h2>
        </div>

        <div className="info-grid">
          {[
            { label: 'Category', value: vendor.category || '—' },
            { label: 'City', value: vendor.city || '—' },
            { label: 'Experience', value: vendor.years_experience ? `${vendor.years_experience} years` : '—' },
            {
              label: 'Outstation Events',
              value:
                typeof vendor.outstation_events === 'boolean'
                  ? vendor.outstation_events
                    ? 'Yes'
                    : 'No'
                  : '—',
            },
            {
              label: 'Service Areas',
              value:
                Array.isArray(vendor.service_areas) && vendor.service_areas.length > 0
                  ? vendor.service_areas.join(', ')
                  : '—',
            },
            {
              label: 'Member Since',
              value: vendor.created_at
                ? new Date(vendor.created_at).toLocaleDateString('en-IN', {
                    month: 'short',
                    year: 'numeric',
                  })
                : '—',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="detail-box"
              style={{
                borderBottom: idx < 4 ? '1px solid rgba(15,23,42,0.06)' : 'none',
                borderRight: idx % 2 === 0 ? '1px solid rgba(15,23,42,0.06)' : 'none',
              }}
            >
              <div className="detail-label">{item.label}</div>
              <div className="detail-value">{item.value}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Service Details & Pricing */}
      <motion.div
        className="premium-section-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
      >
        <div className="premium-section-header">
          <div className="premium-icon-box">◆</div>
          <h2 style={{ fontSize: 16, fontWeight: 850, color: '#374151', margin: 0 }}>
            Service Details & Pricing
          </h2>
        </div>

        <div style={{ background: '#ffffff', padding: '18px 20px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 18,
            }}
          >
            <div>
              <div
                style={{
                  borderLeft: '4px solid #6d28d9',
                  paddingLeft: 10,
                  fontWeight: 850,
                  color: '#374151',
                  fontSize: 13,
                  marginBottom: 12,
                }}
              >
                Service Areas
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Array.isArray(vendor.service_areas) && vendor.service_areas.length > 0 ? (
                  vendor.service_areas.map((area, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '7px 11px',
                        background: '#f3edff',
                        borderRadius: 5,
                        fontSize: 12,
                        color: '#6d28d9',
                        fontWeight: 850,
                      }}
                    >
                      {area}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>
                    Not provided
                  </span>
                )}

                {typeof vendor.outstation_events === 'boolean' && (
                  <span
                    style={{
                      padding: '7px 11px',
                      background: vendor.outstation_events ? '#ecfdf5' : '#fee2e2',
                      borderRadius: 5,
                      fontSize: 12,
                      color: vendor.outstation_events ? '#15803d' : '#991b1b',
                      fontWeight: 850,
                    }}
                  >
                    {vendor.outstation_events ? '✓ Outstation' : '✕ Local Only'}
                  </span>
                )}
              </div>
            </div>

            {(() => {
              const cfg = getCategoryConfig(vendor.category)
              const details = vendor.service_details || {}
              const pricing = vendor.service_pricing || {}

              if (!cfg) {
                return (
                  <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>
                    Category-specific details not available.
                  </div>
                )
              }

              return (
                <>
                  <div>
                    <div
                      style={{
                        borderLeft: '4px solid #6d28d9',
                        paddingLeft: 10,
                        fontWeight: 850,
                        color: '#374151',
                        fontSize: 13,
                        marginBottom: 12,
                      }}
                    >
                      Service Specifics
                    </div>

                    <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>
                      {cfg.detailsFields.length > 0
                        ? cfg.detailsFields.slice(0, 3).map((f) => {
                            const raw = details[f.key]
                            const val =
                              f.type === 'boolean'
                                ? typeof raw === 'boolean'
                                  ? raw
                                    ? 'Yes'
                                    : 'No'
                                  : '—'
                                : raw === undefined || raw === null || raw === ''
                                  ? '—'
                                  : String(raw)

                            return `${f.label}: ${val}`
                          }).join(' • ')
                        : 'No additional specifics listed'}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        borderLeft: '4px solid #be185d',
                        paddingLeft: 10,
                        fontWeight: 850,
                        color: '#374151',
                        fontSize: 13,
                        marginBottom: 12,
                      }}
                    >
                      Pricing
                    </div>

                    <div
                      style={{
                        background: '#f3edff',
                        borderRadius: 9,
                        padding: '18px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 700 }}>
                        {cfg.pricingFields?.[0]?.label || 'Starting Price'}
                      </span>

                      <span
                        style={{
                          fontSize: 25,
                          color: '#6d28d9',
                          fontWeight: 950,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {(() => {
                          const firstPricingKey = cfg.pricingFields?.[0]?.key
                          const raw = firstPricingKey ? pricing[firstPricingKey] : null
                          return raw === undefined || raw === null || raw === ''
                            ? '—'
                            : `₹${Number(raw).toLocaleString('en-IN')}`
                        })()}
                      </span>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      </motion.div>

      {/* Services & Facilities */}
      {(vendor.other_services || vendor.services?.length > 0) && (
        <motion.div
          className="premium-section-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
        >
          <div className="premium-section-header">
            <div className="premium-icon-box">★</div>
            <h2 style={{ fontSize: 16, fontWeight: 850, color: '#374151', margin: 0 }}>
              Services & Facilities
            </h2>
          </div>

          <div style={{ background: '#ffffff', padding: '18px 20px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {vendor.services?.map((service, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '8px 13px',
                    background: '#f3edff',
                    borderRadius: 6,
                    fontSize: 13,
                    color: '#6d28d9',
                    fontWeight: 850,
                  }}
                >
                  ⊙ {service}
                </div>
              ))}

              {vendor.other_services &&
                typeof vendor.other_services === 'string' &&
                vendor.other_services.split(',').map((s, i) => (
                  <div
                    key={`other-${i}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '8px 13px',
                      background: '#f3edff',
                      borderRadius: 6,
                      fontSize: 13,
                      color: '#6d28d9',
                      fontWeight: 850,
                    }}
                  >
                    ⊙ {s.trim()}
                  </div>
                ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Booking CTA */}
      <motion.div
        className="premium-section-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.16 }}
      >
        <div
          className="booking-cta"
          style={{
            background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 55%, #581c87 100%)',
            padding: '24px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 950,
                color: '#ffffff',
                marginBottom: 5,
                letterSpacing: '-0.5px',
              }}
            >
              Ready to Book?
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)', fontWeight: 600 }}>
              Send an enquiry or view contact details to get started.
            </div>
          </div>

          <button
            onClick={() => setShowLeadModal(true)}
            style={{
              padding: '12px 26px',
              background: '#ffffff',
              color: '#6d28d9',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 850,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 12px 24px rgba(0,0,0,0.18)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            Send Enquiry
            <span style={{ fontSize: 16 }}>→</span>
          </button>
        </div>
      </motion.div>
    </>
  )}
{/* Reviews Tab Content */}
{activeTab === 'reviews' && (
  <motion.div
    id="reviews-section"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
  >
    <div
      className="premium-section-card"
      style={{
        background:
          'linear-gradient(135deg, #6d28d9 0%, #7c3aed 52%, #581c87 100%)',
        padding: '22px 24px',
        color: '#ffffff',
        borderRadius: 18,
        marginBottom: 12,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow: '0 18px 38px rgba(109,40,217,0.28)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.10)',
          right: -45,
          top: -55,
        }}
      />

      <div
        style={{
          position: 'absolute',
          width: 90,
          height: 90,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          left: -28,
          bottom: -34,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: 86,
              height: 86,
              borderRadius: 18,
              background: 'rgba(255,255,255,0.14)',
              border: '1px solid rgba(255,255,255,0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
            }}
          >
            <div style={{ fontSize: 38, fontWeight: 950, lineHeight: 1 }}>
              {avgRating || '—'}
            </div>

            <div
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.78)',
                marginTop: 4,
              }}
            >
              rating
            </div>
          </div>

          <div>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>
              Customer Reviews
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                marginBottom: 7,
              }}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <svg
                  key={i}
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill={
                    avgRating && i <= Math.round(parseFloat(avgRating))
                      ? '#fbbf24'
                      : 'rgba(255,255,255,0.32)'
                  }
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>

            <div
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.82)',
                fontWeight: 600,
              }}
            >
              {reviews.length} review{reviews.length !== 1 ? 's' : ''} from
              verified customers
            </div>
          </div>
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
            background: 'linear-gradient(135deg, #ffffff 0%, #f3edff 100%)',
            color: '#6d28d9',
            border: '1px solid rgba(255,255,255,0.55)',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: '0 14px 26px rgba(0,0,0,0.18)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 7,
              background: '#6d28d9',
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
            }}
          >
            ✦
          </span>

          {reviewAlreadyDone ? 'Edit Review' : 'Write a Review'}
        </button>
      </div>
    </div>

    {reviews.length > 0 ? (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: 12,
        }}
      >
        {reviews.map((review, reviewIdx) => {
          const avatarColors = [
            'linear-gradient(135deg, #6d28d9, #7c3aed)',
            'linear-gradient(135deg, #be185d, #db2777)',
            'linear-gradient(135deg, #0369a1, #0ea5e9)',
            'linear-gradient(135deg, #15803d, #22c55e)',
            'linear-gradient(135deg, #b45309, #f59e0b)',
          ]

          return (
            <div
              key={review.id}
              className="review-card premium-section-card"
              style={{
                padding: '16px 18px',
                marginBottom: 0,
                borderRadius: 16,
                background: '#ffffff',
                border: '1px solid rgba(109,40,217,0.09)',
                boxShadow: '0 12px 28px rgba(15,23,42,0.07)',
              }}
            >
              <div style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    background: avatarColors[reviewIdx % avatarColors.length],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 900,
                    color: '#fff',
                    flexShrink: 0,
                    boxShadow: '0 10px 18px rgba(109,40,217,0.18)',
                  }}
                >
                  {(review.user_name || 'A').charAt(0).toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 900,
                          color: '#111827',
                        }}
                      >
                        {review.user_name || 'Anonymous'}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          marginTop: 5,
                        }}
                      >
                        {[1, 2, 3, 4, 5].map((i) => (
                          <svg
                            key={i}
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill={i <= (review.rating || 0) ? '#fbbf24' : '#e5e7eb'}
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}

                        <span
                          style={{
                            fontSize: 12,
                            color: '#6b7280',
                            marginLeft: 5,
                            fontWeight: 700,
                          }}
                        >
                          {review.rating}/5
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '5px 9px',
                        borderRadius: 999,
                        background: '#f3edff',
                        color: '#6d28d9',
                        fontSize: 11,
                        fontWeight: 850,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Verified
                    </span>
                  </div>

                  {review.review_text && (
                    <p
                      style={{
                        fontSize: 14,
                        lineHeight: 1.62,
                        color: '#374151',
                        margin: '12px 0 0',
                        padding: '12px 13px',
                        background:
                          'linear-gradient(135deg, #faf7ff 0%, #ffffff 100%)',
                        borderRadius: 12,
                        borderLeft: '4px solid #6d28d9',
                      }}
                    >
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
      <div
        className="premium-section-card"
        style={{
          textAlign: 'center',
          padding: '34px 22px',
          borderRadius: 18,
          background: 'linear-gradient(135deg, #ffffff 0%, #faf7ff 100%)',
          border: '1px solid rgba(109,40,217,0.10)',
          boxShadow: '0 14px 34px rgba(15,23,42,0.08)',
        }}
      >
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: 18,
            margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #ede9fe 0%, #f3edff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 30,
            boxShadow: '0 12px 24px rgba(109,40,217,0.14)',
          }}
        >
          💬
        </div>

        <div
          style={{
            fontSize: 19,
            fontWeight: 900,
            color: '#111827',
            marginBottom: 6,
          }}
        >
          No reviews yet
        </div>

        <div
          style={{
            fontSize: 14,
            color: '#6b7280',
            marginBottom: 18,
            fontWeight: 600,
          }}
        >
          Be the first to share your experience with this vendor.
        </div>

        <button
          onClick={() => {
            setReviewRating(5)
            setReviewText('')
            setReviewError('')
            setShowReviewModal(true)
          }}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.22)',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: '0 14px 26px rgba(109,40,217,0.28)',
          }}
        >
          ✦ Write the First Review
        </button>
      </div>
    )}
  </motion.div>
)}
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
        background: 'rgba(15,23,42,0.74)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
      onClick={() => setShowLeadModal(false)}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 14 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 14 }}
        style={{
          background: '#ffffff',
          borderRadius: 24,
          maxWidth: 620,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 0,
          boxShadow: '0 34px 90px rgba(0,0,0,0.30)',
          border: '1px solid rgba(255,255,255,0.32)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Premium Header */}
        <div
          style={{
            background:
              'linear-gradient(135deg, #6d28d9 0%, #7c3aed 55%, #581c87 100%)',
            padding: '24px 26px',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: 150,
              height: 150,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.10)',
              right: -50,
              top: -60,
            }}
          />

          <div
            style={{
              position: 'absolute',
              width: 90,
              height: 90,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              left: -28,
              bottom: -38,
            }}
          />

          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '6px 11px',
                  background: 'rgba(255,255,255,0.14)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 850,
                  marginBottom: 11,
                }}
              >
                ✦ Quick vendor enquiry
              </div>

              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 950,
                  margin: 0,
                  color: '#ffffff',
                  letterSpacing: '-0.5px',
                  lineHeight: 1.15,
                }}
              >
                Hi {vendor?.business_name},
              </h2>

              <p
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.82)',
                  margin: '7px 0 0',
                  fontWeight: 600,
                  lineHeight: 1.5,
                }}
              >
                Share your details and get a faster response from this vendor.
              </p>
            </div>

            <button
              onClick={() => {
                setShowLeadModal(false)
                if (!hasStoredCustomerDetails) {
                  setInquiryVerificationStep('form')
                  setInquiryOtpCode('')
                  setInquiryVerified(false)
                } else {
                  setInquiryVerificationStep('verified')
                }
                if (typeof window !== 'undefined') {
                  window.inquiryConfirmationResult = null
                }
              }}
              style={{
                border: '1px solid rgba(255,255,255,0.22)',
                background: 'rgba(255,255,255,0.12)',
                cursor: 'pointer',
                fontSize: 24,
                color: '#ffffff',
                padding: 0,
                width: 38,
                height: 38,
                borderRadius: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          {/* Phone Verification Steps - Only show if customer details not stored */}
          {inquiryVerificationStep === 'form' && !hasStoredCustomerDetails && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  padding: '15px 16px',
                  background: 'linear-gradient(135deg, #faf7ff 0%, #ffffff 100%)',
                  border: '1px solid rgba(109,40,217,0.12)',
                  borderRadius: 16,
                }}
              >
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    margin: 0,
                    color: '#111827',
                  }}
                >
                  Verify your phone number
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: '#6b7280',
                    margin: '6px 0 0',
                    lineHeight: 1.5,
                  }}
                >
                  Verification helps vendors respond to genuine enquiries.
                </p>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 850,
                    marginBottom: 8,
                    color: '#374151',
                  }}
                >
                  Full name *
                </label>
                <input
                  type="text"
                  required
                  value={leadForm.name}
                  onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                  placeholder="Enter your full name"
                  style={{
                    width: '100%',
                    padding: '13px 14px',
                    borderRadius: 13,
                    border: '1px solid rgba(109,40,217,0.16)',
                    fontSize: 14,
                    outline: 'none',
                    background: '#faf7ff',
                    color: '#111827',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 850,
                    marginBottom: 8,
                    color: '#374151',
                  }}
                >
                  Phone number *
                </label>

                <div style={{ display: 'flex', gap: 9 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '13px 14px',
                      borderRadius: 13,
                      border: '1px solid rgba(109,40,217,0.16)',
                      background: '#f3edff',
                      fontSize: 14,
                      fontWeight: 850,
                      color: '#6d28d9',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    🇮🇳 +91
                  </div>

                  <input
                    type="tel"
                    required
                    value={leadForm.contact_phone}
                    onChange={(e) =>
                      setLeadForm({
                        ...leadForm,
                        contact_phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                      })
                    }
                    placeholder="9876543210"
                    maxLength={10}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '13px 14px',
                      borderRadius: 13,
                      border: '1px solid rgba(109,40,217,0.16)',
                      fontSize: 14,
                      outline: 'none',
                      background: '#faf7ff',
                      color: '#111827',
                    }}
                  />
                </div>
              </div>

              <div id="recaptcha-container-inquiry"></div>

              <button
                type="button"
                onClick={handleSendInquiryOtp}
                disabled={
                  sendingInquiryOtp ||
                  !leadForm.name ||
                  !leadForm.contact_phone ||
                  leadForm.contact_phone.length !== 10
                }
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  borderRadius: 14,
                  border: 'none',
                  background:
                    sendingInquiryOtp ||
                    !leadForm.name ||
                    !leadForm.contact_phone ||
                    leadForm.contact_phone.length !== 10
                      ? '#c4b5fd'
                      : 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 900,
                  cursor:
                    sendingInquiryOtp ||
                    !leadForm.name ||
                    !leadForm.contact_phone ||
                    leadForm.contact_phone.length !== 10
                      ? 'not-allowed'
                      : 'pointer',
                  boxShadow:
                    sendingInquiryOtp ||
                    !leadForm.name ||
                    !leadForm.contact_phone ||
                    leadForm.contact_phone.length !== 10
                      ? 'none'
                      : '0 14px 28px rgba(109,40,217,0.28)',
                }}
              >
                {sendingInquiryOtp ? 'Sending...' : 'Send Verification Code'}
              </button>
            </div>
          )}

          {inquiryVerificationStep === 'otp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  padding: '15px 16px',
                  background: 'linear-gradient(135deg, #faf7ff 0%, #ffffff 100%)',
                  border: '1px solid rgba(109,40,217,0.12)',
                  borderRadius: 16,
                }}
              >
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    margin: 0,
                    color: '#111827',
                  }}
                >
                  Enter verification code
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: '#6b7280',
                    margin: '6px 0 0',
                    lineHeight: 1.5,
                  }}
                >
                  We sent a 6-digit code to +91 {leadForm.contact_phone}
                </p>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 850,
                    marginBottom: 8,
                    color: '#374151',
                  }}
                >
                  Verification code *
                </label>
                <input
                  type="text"
                  required
                  value={inquiryOtpCode}
                  onChange={(e) =>
                    setInquiryOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="000000"
                  maxLength={6}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 14,
                    border: '1px solid rgba(109,40,217,0.16)',
                    outline: 'none',
                    textAlign: 'center',
                    letterSpacing: '8px',
                    fontSize: 22,
                    fontWeight: 900,
                    background: '#faf7ff',
                    color: '#111827',
                    boxSizing: 'border-box',
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
                    padding: '14px 20px',
                    borderRadius: 14,
                    border: '1px solid rgba(109,40,217,0.16)',
                    background: '#ffffff',
                    color: '#6d28d9',
                    fontSize: 14,
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  Change Number
                </button>

                <button
                  type="button"
                  onClick={handleVerifyInquiryOtp}
                  disabled={
                    verifyingInquiryOtp || !inquiryOtpCode || inquiryOtpCode.length !== 6
                  }
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    borderRadius: 14,
                    border: 'none',
                    background:
                      verifyingInquiryOtp || !inquiryOtpCode || inquiryOtpCode.length !== 6
                        ? '#c4b5fd'
                        : 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 900,
                    cursor:
                      verifyingInquiryOtp || !inquiryOtpCode || inquiryOtpCode.length !== 6
                        ? 'not-allowed'
                        : 'pointer',
                    boxShadow:
                      verifyingInquiryOtp || !inquiryOtpCode || inquiryOtpCode.length !== 6
                        ? 'none'
                        : '0 14px 28px rgba(109,40,217,0.28)',
                  }}
                >
                  {verifyingInquiryOtp ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>
          )}

          {/* Inquiry Form (shown after verification) */}
          {inquiryVerificationStep === 'verified' && (
            <form
              onSubmit={handleSubmitLead}
              style={{ display: 'flex', flexDirection: 'column', gap: 15 }}
            >
              <div
                style={{
                  padding: '12px 14px',
                  background: 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)',
                  border: '1px solid #bbf7d0',
                  borderRadius: 14,
                  fontSize: 14,
                  color: '#166534',
                  fontWeight: 800,
                }}
              >
                ✓ Phone verified: +91 {leadForm.contact_phone}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 12,
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 850,
                      marginBottom: 8,
                      color: '#374151',
                    }}
                  >
                    Full name *
                  </label>
                  <input
                    type="text"
                    required
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    placeholder="Full name"
                    style={{
                      width: '100%',
                      padding: '13px 14px',
                      borderRadius: 13,
                      border: leadForm.name
                        ? '1px solid rgba(109,40,217,0.16)'
                        : '1px solid #ef4444',
                      fontSize: 14,
                      outline: 'none',
                      background: '#faf7ff',
                      color: '#111827',
                      boxSizing: 'border-box',
                    }}
                  />
                  {!leadForm.name && (
                    <div style={{ fontSize: 12, color: '#ef4444', marginTop: 5 }}>
                      Required
                    </div>
                  )}
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 850,
                      marginBottom: 8,
                      color: '#374151',
                    }}
                  >
                    Phone number *
                  </label>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '13px 12px',
                        borderRadius: 13,
                        border: '1px solid rgba(109,40,217,0.16)',
                        background: '#f3edff',
                        fontSize: 13,
                        fontWeight: 850,
                        color: '#6d28d9',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      +91
                    </div>

                    <input
                      type="tel"
                      required
                      value={leadForm.contact_phone}
                      onChange={(e) =>
                        setLeadForm({
                          ...leadForm,
                          contact_phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                        })
                      }
                      placeholder="9876543210"
                      maxLength={10}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        padding: '13px 14px',
                        borderRadius: 13,
                        border: '1px solid rgba(109,40,217,0.16)',
                        fontSize: 14,
                        outline: 'none',
                        background: '#faf7ff',
                        color: '#111827',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 12,
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 850,
                      marginBottom: 8,
                      color: '#374151',
                    }}
                  >
                    Email address
                  </label>
                  <input
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    placeholder="Email address"
                    style={{
                      width: '100%',
                      padding: '13px 14px',
                      borderRadius: 13,
                      border: '1px solid rgba(109,40,217,0.16)',
                      fontSize: 14,
                      outline: 'none',
                      background: '#faf7ff',
                      color: '#111827',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 850,
                      marginBottom: 8,
                      color: '#374151',
                    }}
                  >
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
                      padding: '13px 14px',
                      borderRadius: 13,
                      border: '1px solid rgba(109,40,217,0.16)',
                      fontSize: 14,
                      outline: 'none',
                      background: '#faf7ff',
                      color: '#111827',
                      boxSizing: 'border-box',
                    }}
                  />

                  {leadForm.event_date && selectedDateStatus && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: '8px 12px',
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 850,
                        background:
                          selectedDateStatus === 'available'
                            ? '#dcfce7'
                            : selectedDateStatus === 'booked'
                              ? '#fee2e2'
                              : '#f3f4f6',
                        color:
                          selectedDateStatus === 'available'
                            ? '#166534'
                            : selectedDateStatus === 'booked'
                              ? '#991b1b'
                              : '#374151',
                      }}
                    >
                      {selectedDateStatus === 'available'
                        ? '✓ Available'
                        : selectedDateStatus === 'booked'
                          ? '✗ Booked'
                          : '✗ Not Available'}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 850,
                    marginBottom: 8,
                    color: '#374151',
                  }}
                >
                  Budget
                  <span style={{ color: '#9ca3af', fontWeight: 700 }}> (optional)</span>
                </label>
                <input
                  type="text"
                  value={leadForm.budget}
                  onChange={(e) => setLeadForm({ ...leadForm, budget: e.target.value })}
                  placeholder="e.g. ₹2-3 Lakh"
                  style={{
                    width: '100%',
                    padding: '13px 14px',
                    borderRadius: 13,
                    border: '1px solid rgba(109,40,217,0.16)',
                    fontSize: 14,
                    outline: 'none',
                    background: '#faf7ff',
                    color: '#111827',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 850,
                    marginBottom: 8,
                    color: '#374151',
                  }}
                >
                  Wedding details
                </label>
                <textarea
                  value={leadForm.details}
                  onChange={(e) => setLeadForm({ ...leadForm, details: e.target.value })}
                  placeholder="Tell the vendor about your event, guest count, venue, preferences..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '13px 14px',
                    borderRadius: 13,
                    border: '1px solid rgba(109,40,217,0.16)',
                    fontSize: 14,
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    background: '#faf7ff',
                    color: '#111827',
                    lineHeight: 1.6,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '13px 14px',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
                  border: '1px solid #bbf7d0',
                  borderRadius: 14,
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, color: '#111827', fontWeight: 850 }}>
                    Notify me on WhatsApp
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                    Get vendor response updates faster.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setWhatsappNotify(!whatsappNotify)}
                  style={{
                    width: 48,
                    height: 26,
                    borderRadius: 999,
                    border: 'none',
                    background: whatsappNotify ? '#10b981' : '#d1d5db',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.3s',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'white',
                      position: 'absolute',
                      top: 2,
                      left: whatsappNotify ? 24 : 2,
                      transition: 'all 0.3s',
                      boxShadow: '0 3px 8px rgba(0,0,0,0.16)',
                    }}
                  />
                </button>
              </div>

              <button
                type="submit"
                disabled={
                  submittingLead ||
                  !leadForm.name ||
                  !leadForm.contact_phone ||
                  !leadForm.event_date ||
                  !inquiryVerified
                }
                style={{
                  width: '100%',
                  padding: '15px 24px',
                  borderRadius: 15,
                  border: 'none',
                  background:
                    submittingLead ||
                    !leadForm.name ||
                    !leadForm.contact_phone ||
                    !leadForm.event_date ||
                    !inquiryVerified
                      ? '#c4b5fd'
                      : 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 950,
                  cursor:
                    submittingLead ||
                    !leadForm.name ||
                    !leadForm.contact_phone ||
                    !leadForm.event_date ||
                    !inquiryVerified
                      ? 'not-allowed'
                      : 'pointer',
                  boxShadow:
                    submittingLead ||
                    !leadForm.name ||
                    !leadForm.contact_phone ||
                    !leadForm.event_date ||
                    !inquiryVerified
                      ? 'none'
                      : '0 16px 32px rgba(109,40,217,0.30)',
                }}
              >
                {submittingLead ? 'Submitting...' : 'Submit Inquiry'}
              </button>
            </form>
          )}
        </div>
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
        inset: 0,
        background: 'rgba(15,23,42,0.72)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
      onClick={() => setShowReviewModal(false)}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 14 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 14 }}
        style={{
          background: '#ffffff',
          borderRadius: 22,
          maxWidth: 540,
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 34px 90px rgba(0,0,0,0.28)',
          border: '1px solid rgba(255,255,255,0.35)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background:
              'linear-gradient(135deg, #6d28d9 0%, #7c3aed 55%, #581c87 100%)',
            padding: '24px 26px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.10)',
              right: -46,
              top: -54,
            }}
          />

          <div
            style={{
              position: 'absolute',
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              left: -25,
              bottom: -30,
            }}
          />

          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 14,
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '6px 11px',
                  background: 'rgba(255,255,255,0.14)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  borderRadius: 999,
                  color: 'rgba(255,255,255,0.88)',
                  fontSize: 12,
                  fontWeight: 850,
                  marginBottom: 11,
                }}
              >
                ✦ Customer review
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 950,
                  color: '#ffffff',
                  letterSpacing: '-0.4px',
                  lineHeight: 1.15,
                }}
              >
                {reviewAlreadyDone ? 'Edit your review' : 'Write a review'}
              </h2>

              <p
                style={{
                  margin: '7px 0 0',
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.80)',
                  fontWeight: 600,
                  lineHeight: 1.5,
                }}
              >
                Share your experience with {vendor?.business_name}
              </p>
            </div>

            <button
              onClick={() => setShowReviewModal(false)}
              style={{
                border: '1px solid rgba(255,255,255,0.22)',
                background: 'rgba(255,255,255,0.12)',
                cursor: 'pointer',
                padding: 0,
                color: '#ffffff',
                borderRadius: 13,
                width: 38,
                height: 38,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              aria-label="Close"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {!currentUser ? (
          <div style={{ padding: 24 }}>
            <div
              style={{
                padding: '18px 18px',
                borderRadius: 16,
                background: 'linear-gradient(135deg, #faf7ff 0%, #ffffff 100%)',
                border: '1px solid rgba(109,40,217,0.14)',
                boxShadow: '0 12px 28px rgba(15,23,42,0.06)',
              }}
            >
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 900,
                  color: '#111827',
                  marginBottom: 6,
                }}
              >
                Login required
              </div>

              <div
                style={{
                  color: '#6b7280',
                  fontSize: 14,
                  lineHeight: 1.6,
                  marginBottom: 16,
                }}
              >
                Please sign in with your phone number to write a review. One review is allowed per customer per vendor.
              </div>

              <button
                onClick={() => setShowReviewModal(false)}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: 13,
                  border: 'none',
                  background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 14px 28px rgba(109,40,217,0.28)',
                }}
              >
                Okay
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: 24 }}>
            {/* Name */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 850,
                  color: '#374151',
                  marginBottom: 8,
                }}
              >
                Your name
              </label>

              <input
                type="text"
                value={reviewCustomerName}
                onChange={(e) => setReviewCustomerName(e.target.value)}
                placeholder="Enter your full name"
                style={{
                  width: '100%',
                  padding: '13px 14px',
                  borderRadius: 13,
                  border: '1px solid rgba(109,40,217,0.16)',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: '#faf7ff',
                  color: '#111827',
                  fontWeight: 650,
                }}
              />

              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: '#8b5cf6',
                  fontWeight: 650,
                }}
              >
                This name will be visible with your review.
              </div>
            </div>

            {/* Rating */}
            <div
              style={{
                marginBottom: 16,
                padding: '15px 16px',
                background: 'linear-gradient(135deg, #faf7ff 0%, #ffffff 100%)',
                border: '1px solid rgba(109,40,217,0.12)',
                borderRadius: 16,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 850,
                  color: '#374151',
                  marginBottom: 11,
                }}
              >
                Your rating
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    style={{
                      border: 'none',
                      background: star <= reviewRating ? '#fff7ed' : '#f3f4f6',
                      cursor: 'pointer',
                      padding: 7,
                      borderRadius: 12,
                      boxShadow:
                        star <= reviewRating
                          ? '0 8px 16px rgba(251,191,36,0.20)'
                          : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <svg
                      width="30"
                      height="30"
                      viewBox="0 0 24 24"
                      fill={star <= reviewRating ? '#fbbf24' : '#d1d5db'}
                      stroke={star <= reviewRating ? '#fbbf24' : '#d1d5db'}
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                ))}

                <span
                  style={{
                    marginLeft: 8,
                    padding: '7px 12px',
                    borderRadius: 999,
                    background: '#6d28d9',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  {reviewRating}/5
                </span>
              </div>
            </div>

            {/* Review Text */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 850,
                  color: '#374151',
                  marginBottom: 8,
                }}
              >
                Your review
                <span style={{ color: '#9ca3af', fontWeight: 700 }}> (optional)</span>
              </label>

              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Write about service quality, behaviour, pricing, decoration, delivery..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '13px 14px',
                  borderRadius: 13,
                  border: '1px solid rgba(109,40,217,0.16)',
                  fontSize: 14,
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: '#faf7ff',
                  color: '#111827',
                  lineHeight: 1.6,
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {reviewError && (
              <div
                style={{
                  marginBottom: 16,
                  padding: 12,
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: 12,
                  fontSize: 13,
                  color: '#991b1b',
                  fontWeight: 700,
                }}
              >
                {reviewError}
              </div>
            )}

            {/* Buttons */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'flex-end',
                paddingTop: 4,
              }}
            >
              <button
                onClick={() => setShowReviewModal(false)}
                style={{
                  padding: '11px 20px',
                  borderRadius: 13,
                  border: '1px solid rgba(109,40,217,0.16)',
                  background: '#ffffff',
                  color: '#6b7280',
                  fontSize: 14,
                  fontWeight: 850,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleSubmitReview}
                disabled={reviewSubmitting || !reviewCustomerName.trim()}
                style={{
                  padding: '11px 24px',
                  borderRadius: 13,
                  border: 'none',
                  background:
                    reviewSubmitting || !reviewCustomerName.trim()
                      ? '#c4b5fd'
                      : 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 900,
                  cursor:
                    reviewSubmitting || !reviewCustomerName.trim()
                      ? 'not-allowed'
                      : 'pointer',
                  boxShadow:
                    reviewSubmitting || !reviewCustomerName.trim()
                      ? 'none'
                      : '0 14px 28px rgba(109,40,217,0.28)',
                }}
              >
                {reviewSubmitting
                  ? 'Submitting...'
                  : reviewAlreadyDone
                    ? 'Update Review'
                    : 'Submit Review'}
              </button>
            </div>
          </div>
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
        inset: 0,
        background: 'rgba(15,23,42,0.64)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={() => {
        if (verificationStep === 'form') {
          setShowContactModal(false)
        }
      }}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 10 }}
        style={{
          background: '#ffffff',
          borderRadius: 18,
          padding: 0,
          maxWidth: 460,
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 28px 70px rgba(15,23,42,0.28)',
          border: '1px solid rgba(255,255,255,0.35)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '22px 24px',
            background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: 110,
              height: 110,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.10)',
              right: -36,
              top: -42,
            }}
          />

          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 14,
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 10px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.16)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  fontSize: 12,
                  fontWeight: 800,
                  marginBottom: 9,
                }}
              >
                ✦ Secure access
              </div>

              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  margin: 0,
                  color: '#ffffff',
                  letterSpacing: '-0.4px',
                }}
              >
                {verificationStep === 'form'
                  ? 'Verify Your Mobile'
                  : verificationStep === 'otp'
                    ? 'Enter OTP'
                    : 'Contact Details'}
              </h2>

              <p
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.82)',
                  margin: '6px 0 0',
                  lineHeight: 1.45,
                  fontWeight: 600,
                }}
              >
                {verificationStep === 'form'
                  ? 'Verify once to view vendor contact details.'
                  : verificationStep === 'otp'
                    ? `OTP sent to +91 ${verificationForm.phone}`
                    : 'Contact details are visible for 24 hours.'}
              </p>
            </div>

            {verificationStep === 'form' && (
              <button
                onClick={() => setShowContactModal(false)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.22)',
                  background: 'rgba(255,255,255,0.12)',
                  color: '#ffffff',
                  fontSize: 22,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div style={{ padding: 24 }}>
          {verificationStep === 'form' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 800,
                    marginBottom: 7,
                    color: '#374151',
                  }}
                >
                  Full name *
                </label>

                <input
                  type="text"
                  required
                  value={verificationForm.name}
                  onChange={(e) =>
                    setVerificationForm({
                      ...verificationForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="Enter your full name"
                  style={{
                    width: '100%',
                    padding: '13px 14px',
                    borderRadius: 12,
                    border: '1px solid rgba(109,40,217,0.16)',
                    fontSize: 14,
                    outline: 'none',
                    background: '#faf7ff',
                    color: '#111827',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 800,
                    marginBottom: 7,
                    color: '#374151',
                  }}
                >
                  Phone Number *
                </label>

                <div style={{ display: 'flex', gap: 8 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '13px 12px',
                      borderRadius: 12,
                      border: '1px solid rgba(109,40,217,0.16)',
                      background: '#f3edff',
                      fontSize: 14,
                      fontWeight: 800,
                      color: '#6d28d9',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    🇮🇳 +91
                  </div>

                  <input
                    type="tel"
                    required
                    value={verificationForm.phone}
                    onChange={(e) =>
                      setVerificationForm({
                        ...verificationForm,
                        phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                      })
                    }
                    placeholder="9876543210"
                    maxLength={10}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '13px 14px',
                      borderRadius: 12,
                      border: '1px solid rgba(109,40,217,0.16)',
                      fontSize: 14,
                      outline: 'none',
                      background: '#faf7ff',
                      color: '#111827',
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '12px 13px',
                  background: '#f8fafc',
                  border: '1px solid rgba(15,23,42,0.06)',
                  borderRadius: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>
                    WhatsApp updates
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                    Get faster vendor response updates.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setWhatsappNotify(!whatsappNotify)}
                  style={{
                    width: 46,
                    height: 25,
                    borderRadius: 999,
                    border: 'none',
                    background: whatsappNotify ? '#10b981' : '#d1d5db',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.3s',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 21,
                      height: 21,
                      borderRadius: '50%',
                      background: 'white',
                      position: 'absolute',
                      top: 2,
                      left: whatsappNotify ? 23 : 2,
                      transition: 'all 0.3s',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                    }}
                  />
                </button>
              </div>

              <div id="recaptcha-container-contact" style={{ marginTop: 4 }}></div>

              <button
                onClick={handleSendOtp}
                disabled={
                  sendingOtp ||
                  !verificationForm.name ||
                  !verificationForm.phone ||
                  verificationForm.phone.length !== 10
                }
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 13,
                  border: 'none',
                  background:
                    sendingOtp ||
                    !verificationForm.name ||
                    !verificationForm.phone ||
                    verificationForm.phone.length !== 10
                      ? '#c4b5fd'
                      : 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 900,
                  cursor:
                    sendingOtp ||
                    !verificationForm.name ||
                    !verificationForm.phone ||
                    verificationForm.phone.length !== 10
                      ? 'not-allowed'
                      : 'pointer',
                  boxShadow:
                    sendingOtp ||
                    !verificationForm.name ||
                    !verificationForm.phone ||
                    verificationForm.phone.length !== 10
                      ? 'none'
                      : '0 14px 28px rgba(109,40,217,0.26)',
                }}
              >
                {sendingOtp ? 'Sending OTP...' : 'Verify & View Contact'}
              </button>
            </div>
          )}

          {verificationStep === 'otp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div
                style={{
                  padding: 14,
                  background: '#faf7ff',
                  border: '1px solid rgba(109,40,217,0.12)',
                  borderRadius: 13,
                  fontSize: 14,
                  color: '#6d28d9',
                  fontWeight: 750,
                }}
              >
                OTP sent to +91 {verificationForm.phone}
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 800,
                    marginBottom: 7,
                    color: '#374151',
                  }}
                >
                  Enter 6-digit OTP *
                </label>

                <input
                  type="text"
                  required
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="000000"
                  maxLength={6}
                  style={{
                    width: '100%',
                    padding: '13px 14px',
                    borderRadius: 12,
                    border: '1px solid rgba(109,40,217,0.16)',
                    fontSize: 20,
                    textAlign: 'center',
                    letterSpacing: '8px',
                    outline: 'none',
                    background: '#faf7ff',
                    color: '#111827',
                    fontWeight: 850,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={verifyingOtp || otpCode.length !== 6}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 13,
                  border: 'none',
                  background:
                    verifyingOtp || otpCode.length !== 6
                      ? '#c4b5fd'
                      : 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 900,
                  cursor:
                    verifyingOtp || otpCode.length !== 6
                      ? 'not-allowed'
                      : 'pointer',
                  boxShadow:
                    verifyingOtp || otpCode.length !== 6
                      ? 'none'
                      : '0 14px 28px rgba(109,40,217,0.26)',
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
                  padding: '12px',
                  borderRadius: 13,
                  border: '1px solid rgba(109,40,217,0.16)',
                  background: '#ffffff',
                  color: '#6d28d9',
                  fontSize: 14,
                  fontWeight: 850,
                  cursor: 'pointer',
                }}
              >
                Change Number
              </button>
            </div>
          )}

          {verificationStep === 'verified' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div
                style={{
                  padding: 14,
                  background: '#ecfdf5',
                  border: '1px solid #bbf7d0',
                  borderRadius: 13,
                  fontSize: 14,
                  color: '#166534',
                  textAlign: 'center',
                  fontWeight: 800,
                }}
              >
                ✓ Mobile verified! Contact visible for 24 hours.
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                {vendor.phone && (
                  <div
                    style={{
                      padding: '13px 14px',
                      borderRadius: 13,
                      background: '#faf7ff',
                      border: '1px solid rgba(109,40,217,0.12)',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#6d28d9', marginBottom: 4 }}>
                      Phone
                    </div>
                    <a
                      href={`tel:${vendor.phone}`}
                      style={{
                        fontSize: 15,
                        color: '#111827',
                        textDecoration: 'none',
                        fontWeight: 900,
                      }}
                    >
                      {vendor.phone}
                    </a>
                  </div>
                )}

                {vendor.whatsapp && (
                  <div
                    style={{
                      padding: '13px 14px',
                      borderRadius: 13,
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#16a34a', marginBottom: 4 }}>
                      WhatsApp
                    </div>
                    <a
                      href={`https://wa.me/${vendor.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 15,
                        color: '#111827',
                        textDecoration: 'none',
                        fontWeight: 900,
                      }}
                    >
                      {vendor.whatsapp}
                    </a>
                  </div>
                )}

                {vendor.email && (
                  <div
                    style={{
                      padding: '13px 14px',
                      borderRadius: 13,
                      background: '#fff7ed',
                      border: '1px solid #fed7aa',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#c2410c', marginBottom: 4 }}>
                      Email
                    </div>
                    <a
                      href={`mailto:${vendor.email}`}
                      style={{
                        fontSize: 15,
                        color: '#111827',
                        textDecoration: 'none',
                        fontWeight: 900,
                        wordBreak: 'break-word',
                      }}
                    >
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
                  borderRadius: 13,
                  border: 'none',
                  background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 14px 28px rgba(109,40,217,0.26)',
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

      <Footer />
    </div>
  )
}


