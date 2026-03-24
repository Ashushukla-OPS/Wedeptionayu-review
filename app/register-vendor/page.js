'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { auth, signInWithGooglePopup, setupRecaptcha, signInWithPhoneNumber } from '../../lib/firebase_client'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import Footer from '../../components/Footer'
import { motion } from 'framer-motion'
import { normalizeIndianPhone } from '../../lib/phone-utils'

import VendorRegistration7StepForm from './VendorRegistration7StepForm'

function OldRegisterVendorPage() {
  const router = useRouter()
  // Step 1: Authentication, Step 2: Vendor Details
  const [step, setStep] = useState(1) // Start with authentication
  const [loading, setLoading] = useState(false)
  const [authMethod, setAuthMethod] = useState(null) // 'google' or 'phone'
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const confirmationRef = useRef(null) // survives re-renders
  const [userName, setUserName] = useState('')
  const [recaptchaReady, setRecaptchaReady] = useState(false)
  // Re-hydrate confirmationResult if it was stored globally (prevents losing it on navigation/hydration)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!confirmationRef.current && window.confirmationResult) {
      console.debug('[REGISTER-VENDOR] Rehydrating confirmationResult from window')
      confirmationRef.current = window.confirmationResult
    }
  }, [])

  const [cities, setCities] = useState([])
  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({
    name: '',                    // Vendor name (auto-filled from phone login)
    business_name: '',
    contact_person: '',
    email: '',
    phone: '',
    whatsapp: '',
    city: '',
    category: '',
    business_address: '',
    years_experience: '',
    brand_description: '',
    price_min: '',
    price_max: '',
    website: '',
    instagram: '',
    facebook: '',
    youtube: '',
    why_choose: '',
    deals: '',
    other_services: '',
    services: []
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Not logged in: redirect to vendor login (full login page)
        router.replace('/login/vendor')
        return
      }

      // Check if user is already a vendor - if yes, redirect to dashboard
      try {
        const token = await user.getIdToken()
        const vendorCheck = await fetch('/api/vendor/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (vendorCheck.ok) {
          router.push('/vendor/dashboard')
          return
        }
      } catch (error) {
        console.error('Error checking vendor status:', error)
      }

      // Logged in but not a vendor:
      // - Always allow access to the vendor registration form.
      // - If the user already has a verified phone (phone auth), prefill and lock it.
      // - If logged in with Google/email, phone is initially unverified; user can verify via OTP inside the form.
      const formattedPhone = normalizeIndianPhone(user.phoneNumber || '')
      if (formattedPhone) {
        const phoneDigits = formattedPhone.replace(/^\+91/, '')
        setFormData((prev) => ({ ...prev, phone: phoneDigits }))
      }
      setStep(2)
    })
    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (step === 2) {
      fetchCitiesAndCategories()
    }
  }, [step])

  // Initialize visible reCAPTCHA once on client for vendor auth
  useEffect(() => {
    if (step !== 1) {
      // When step changes away from 1, don't clear the verifier - just reset ready state
      // The verifier will be reused if we come back to step 1
      setRecaptchaReady(false)
      return
    }
    if (recaptchaReady) return
    
    // Wait for DOM to be ready and container to exist
    const timer = setTimeout(() => {
      const container = document.getElementById('recaptcha-container')
      if (container && container instanceof HTMLElement) {
        // Check if container still exists and is valid
        try {
          const verifier = setupRecaptcha('recaptcha-container')
          if (verifier) {
            console.debug('[REGISTER-VENDOR] reCAPTCHA init result: ready')
            setRecaptchaReady(true)
          } else {
            console.warn('[REGISTER-VENDOR] reCAPTCHA verifier creation returned null')
            setRecaptchaReady(false)
          }
        } catch (error) {
          console.error('[REGISTER-VENDOR] Error initializing reCAPTCHA:', error)
          setRecaptchaReady(false)
        }
      } else {
        console.warn('[REGISTER-VENDOR] reCAPTCHA container not found, will retry')
        setRecaptchaReady(false)
      }
    }, 300) // Increased delay to ensure DOM is fully ready
    
    return () => clearTimeout(timer)
  }, [step, recaptchaReady])

  const fetchCitiesAndCategories = async () => {
    try {
      const [citiesRes, categoriesRes] = await Promise.all([
        fetch('/api/cities'),
        fetch('/api/categories')
      ])
      
      const citiesData = await citiesRes.json()
      const categoriesData = await categoriesRes.json()
      
      setCities(citiesData.cities || [])
      setCategories(categoriesData.categories || [])
    } catch (err) {
      console.error('Failed to fetch cities/categories:', err)
    }
  }

  const handlePhoneSignIn = async () => {
    // Prevent multiple simultaneous requests
    if (loading) {
      console.warn('[REGISTER-VENDOR] Phone sign-in already in progress, ignoring duplicate request')
      return
    }
    
    const phoneSource = (phoneNumber || formData.phone || '').toString()
    if (!phoneSource) {
      alert('Please enter your phone number')
      return
    }

    const formattedPhone = normalizeIndianPhone(phoneSource)
    if (!formattedPhone) {
      alert('Use a valid Indian mobile number (10 digits, +91 only)')
      return
    }
    
    // Validate Firebase is properly initialized
    if (!auth) {
      console.error('[REGISTER-VENDOR] Firebase auth is not initialized')
      alert('Firebase is not initialized. Please refresh the page.')
      setLoading(false)
      return
    }
    
    // Get Firebase config for debugging and error messages
    let firebaseProjectId = 'unknown'
    let firebaseAuthDomain = 'unknown'
    try {
      firebaseProjectId = auth?.app?.options?.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'wedeption-a40a0'
      firebaseAuthDomain = auth?.app?.options?.authDomain || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'wedeption-a40a0.firebaseapp.com'
    } catch (e) {
      console.warn('[REGISTER-VENDOR] Could not get Firebase config from auth instance:', e)
      firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'wedeption-a40a0'
      firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'wedeption-a40a0.firebaseapp.com'
    }
    
    // Log phone number and Firebase config for debugging
    console.log('[REGISTER-VENDOR] Sending OTP to:', formattedPhone)
    console.log('[REGISTER-VENDOR] Firebase Config:', {
      projectId: firebaseProjectId,
      authDomain: firebaseAuthDomain,
      hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authInstance: !!auth,
      apiKeyPrefix: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 20) + '...' : 'NOT SET'
    })
    
    // Set loading state early to prevent multiple simultaneous requests
    setLoading(true)
    setAuthMethod('phone')
    
    try {
      
      // Ensure reCAPTCHA container exists and is valid
      let container = document.getElementById('recaptcha-container')
      if (!container || !(container instanceof HTMLElement)) {
        // Try to wait a bit and check again
        await new Promise(resolve => setTimeout(resolve, 300))
        container = document.getElementById('recaptcha-container')
        if (!container || !(container instanceof HTMLElement)) {
          throw new Error('reCAPTCHA container not found. Please refresh the page.')
        }
      }

      // Clear any existing verifier if container was recreated
      if (window.__recaptchaVerifiers && window.__recaptchaVerifiers['recaptcha-container']) {
        const existingVerifier = window.__recaptchaVerifiers['recaptcha-container']
        // Check if the container still has the reCAPTCHA widget
        const hasRecaptchaWidget = container.querySelector('iframe') || container.children.length > 0
        if (!hasRecaptchaWidget) {
          // Container was cleared, remove the stale verifier
          try {
            existingVerifier.clear()
          } catch (e) {
            console.warn('[REGISTER-VENDOR] Error clearing stale verifier:', e)
          }
          delete window.__recaptchaVerifiers['recaptcha-container']
        }
      }

      // Get or create reCAPTCHA verifier
      let recaptchaVerifier = setupRecaptcha('recaptcha-container', { size: 'invisible' })
      
      // If verifier doesn't exist, try initializing it
      if (!recaptchaVerifier) {
        console.log('[REGISTER-VENDOR] reCAPTCHA not ready, attempting to initialize...')
        // Wait a moment for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Check container again
        container = document.getElementById('recaptcha-container')
        if (!container || !(container instanceof HTMLElement)) {
          throw new Error('reCAPTCHA container not found. Please refresh the page.')
        }
        
        recaptchaVerifier = setupRecaptcha('recaptcha-container', { size: 'invisible' })
        
        if (!recaptchaVerifier) {
          throw new Error('reCAPTCHA not initialized. Please refresh the page and try again.')
        }
        setRecaptchaReady(true)
      } else {
        // Verify the container still exists and has the widget
        container = document.getElementById('recaptcha-container')
        if (!container || !(container instanceof HTMLElement)) {
          throw new Error('reCAPTCHA container was removed. Please refresh the page.')
        }
        // Check if the verifier's container is still in the DOM
        const hasRecaptchaWidget = container.querySelector('iframe') || container.children.length > 0
        if (!hasRecaptchaWidget) {
          // Widget was cleared, recreate verifier
          try {
            recaptchaVerifier.clear()
          } catch (e) {
            console.warn('[REGISTER-VENDOR] Error clearing verifier before recreate:', e)
          }
          if (typeof window !== 'undefined' && window.__recaptchaVerifiers) {
            delete window.__recaptchaVerifiers['recaptcha-container']
          }
          recaptchaVerifier = setupRecaptcha('recaptcha-container', { size: 'invisible' })
          if (!recaptchaVerifier) {
            throw new Error('reCAPTCHA widget was removed. Please refresh the page.')
          }
        }
      }
      
      // Render widget once (required for invisible / auto reCAPTCHA flows)
      try {
        await recaptchaVerifier.render()
      } catch (e) {
        // If already rendered, Firebase may throw; safe to ignore
      }

      console.log('[REGISTER-VENDOR] reCAPTCHA verifier ready:', !!recaptchaVerifier)
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier)

      // Store confirmationResult globally to prevent loss on navigation/reload
      confirmationRef.current = confirmation
      if (typeof window !== 'undefined') {
        window.confirmationResult = confirmation
      }
      alert('Verification code sent to your phone!')
    } catch (error) {
      console.error('Phone sign in error:', error)
      console.error('Error code:', error.code)
      
      // Clear any existing confirmationResult on error
      confirmationRef.current = null
      if (typeof window !== 'undefined') {
        window.confirmationResult = null
      }
      
      // Reset recaptcha ready state (will be recreated on next useEffect run)
      setRecaptchaReady(false)
      
      // Clear stale verifier if it exists and caused the error
      if (typeof window !== 'undefined' && window.__recaptchaVerifiers && window.__recaptchaVerifiers['recaptcha-container']) {
        try {
          const verifier = window.__recaptchaVerifiers['recaptcha-container']
          // Only clear if verifier is still valid
          if (verifier && typeof verifier.clear === 'function') {
            verifier.clear()
          }
        } catch (e) {
          console.warn('[REGISTER-VENDOR] Error clearing verifier after error:', e)
        }
        delete window.__recaptchaVerifiers['recaptcha-container']
      }
      
      // Clear container only if it exists and is in the DOM
      const container = document.getElementById('recaptcha-container')
      if (container && container instanceof HTMLElement && container.isConnected) {
        // Only clear if container is still in the DOM
        try {
          container.innerHTML = ''
        } catch (e) {
          console.warn('[REGISTER-VENDOR] Error clearing container:', e)
        }
      }
      
      let errorMessage = 'Failed to send verification code. '
      if (error.message?.includes('reCAPTCHA client element has been removed') || error.message?.includes('reCAPTCHA client element')) {
        errorMessage += 'reCAPTCHA was removed. Please refresh the page and try again.'
        // Reset state to allow recreation
        setRecaptchaReady(false)
        setAuthMethod(null) // Reset auth method so user can try again
      } else if (error.code === 'auth/invalid-phone-number') {
        errorMessage += 'Please enter a valid phone number with country code (+91).'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage += 'Too many authentication attempts. Firebase has temporarily blocked requests for this number.\n\n'
        errorMessage += '⚠️ What to do:\n'
        errorMessage += '   • Wait 5-10 minutes before trying again\n'
        errorMessage += '   • Avoid clicking the button multiple times\n'
        errorMessage += '   • If using a test number, add it to Firebase Console test numbers\n'
        errorMessage += '   • For production, this rate limit helps prevent abuse\n\n'
        errorMessage += '💡 Tip: Try again after waiting a few minutes, or use a different phone number if testing.'
        
        console.error('⚠️ Rate Limit Error:', {
          code: error.code,
          message: error.message,
          phone: formattedPhone,
          recommendation: 'Wait 5-10 minutes before retrying. Avoid multiple rapid requests.',
          firebaseConsole: `https://console.firebase.google.com/project/${firebaseProjectId !== 'unknown' ? firebaseProjectId : 'wedeption-a40a0'}/authentication/providers`
        })
        
        // Reset auth method to allow user to try again after waiting
        setAuthMethod(null)
      } else if (error.code === 'auth/invalid-app-credential') {
        // Use the already-defined firebaseProjectId and firebaseAuthDomain
        const actualProjectId = firebaseProjectId !== 'unknown' ? firebaseProjectId : (auth?.app?.options?.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'wedeption-a40a0')
        const actualAuthDomain = firebaseAuthDomain !== 'unknown' ? firebaseAuthDomain : (auth?.app?.options?.authDomain || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'wedeption-a40a0.firebaseapp.com')
        const consoleLink = `https://console.firebase.google.com/project/${actualProjectId}/authentication/providers`
        const cloudConsoleLink = `https://console.cloud.google.com/apis/credentials?project=${actualProjectId}`
        
        errorMessage += 'Firebase configuration error. This usually means:\n\n'
        errorMessage += '🔴 CRITICAL: Phone Authentication is NOT enabled or NOT properly configured\n\n'
        errorMessage += `📋 Project: ${actualProjectId}\n`
        errorMessage += `📋 Auth Domain: ${actualAuthDomain}\n\n`
        errorMessage += '📋 Step-by-step fix:\n\n'
        errorMessage += '1. Go to Firebase Console: https://console.firebase.google.com/\n'
        errorMessage += `2. Select your project: ${actualProjectId}\n`
        errorMessage += '3. Go to: Authentication → Sign-in method\n'
        errorMessage += '4. Find "Phone" provider and click on it\n'
        errorMessage += '5. Click "Enable" if it\'s disabled\n'
        errorMessage += '6. Add your domain (localhost) to authorized domains\n'
        errorMessage += '7. Save and wait 2-3 minutes for changes to propagate\n\n'
        errorMessage += '⚠️ For test numbers:\n'
        errorMessage += '   Add them in: Authentication → Sign-in method → Phone → Test phone numbers\n\n'
        errorMessage += '💡 If still not working:\n'
        errorMessage += `   - Go to: ${cloudConsoleLink}\n`
        errorMessage += '   - Find your API key and enable "Identity Toolkit API"\n'
        errorMessage += '   - Make sure API restrictions allow this domain\n'
        errorMessage += '   - Verify reCAPTCHA is enabled for your domain\n'
        errorMessage += '   - Restart your dev server after Firebase changes'
        
        const apiKeyPrefix = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? `${process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 20)}...` : 'NOT SET'
        
        console.error('❌ Firebase Configuration Error:', {
          code: error.code,
          message: error.message,
          phone: formattedPhone,
          firebaseProject: actualProjectId,
          firebaseAuthDomain: actualAuthDomain,
          apiKeyPrefix: apiKeyPrefix,
          actionRequired: 'Enable Phone Authentication in Firebase Console',
          firebaseConsoleLink: consoleLink,
          cloudConsoleLink: cloudConsoleLink
        })
        
        // Also log to console for easier debugging with clickable links
        console.error('\n🔗 Quick Fix Links:')
        console.error(`   📱 Firebase Console (Auth): ${consoleLink}`)
        console.error(`   🔑 Cloud Console (API Key): ${cloudConsoleLink}`)
        console.error('\n📝 Required Steps:')
        console.error('   1. Enable Phone Authentication in Firebase Console')
        console.error('   2. Add localhost to authorized domains')
        console.error('   3. Enable Identity Toolkit API in Google Cloud Console')
        console.error('   4. Verify API key permissions\n')
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage += 'Invalid credentials. Please check your phone number format (+91XXXXXXXXXX) and try again.'
      } else if (error.code === 'auth/captcha-check-failed') {
        errorMessage += 'Security check failed. Please refresh the page and try again.'
      } else if (error.message?.includes('invalid') || error.message?.includes('credential')) {
        errorMessage += 'Invalid credentials. Please check your phone number and try again.'
      } else {
        errorMessage += (error.message || error.code || 'Please try again.')
      }
      
      console.error('Full error details:', {
        code: error.code,
        message: error.message,
        phone: formattedPhone
      })
      
      alert(errorMessage)
    } finally {
      // Always stop "Sending..." spinner once the attempt finished (success or error)
      setLoading(false)
    }
  }

  const verifyPhoneCode = async () => {
    // Prevent multiple simultaneous requests
    if (loading) {
      console.warn('[REGISTER-VENDOR] Verification already in progress, ignoring duplicate request')
      return
    }
    
    if (!verificationCode) {
      alert('Please enter the verification code')
      return
    }
    
    // Get confirmationResult from ref or global window object (safer than React state)
    const confirmation = confirmationRef.current ||
      (typeof window !== 'undefined' ? window.confirmationResult : null)
    
    if (!confirmation) {
      alert('Verification session expired. Please request a new code.')
      setLoading(false)
      return
    }
    
    // Validate confirmation object has confirm method
    if (typeof confirmation.confirm !== 'function') {
      console.error('Invalid confirmationResult:', confirmation)
      alert('Verification session is invalid. Please request a new code.')
      // Clear invalid confirmation
      confirmationRef.current = null
      if (typeof window !== 'undefined') {
        window.confirmationResult = null
      }
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      console.log('[REGISTER-VENDOR] Verifying code:', verificationCode)
      console.log('[REGISTER-VENDOR] ConfirmationResult exists:', !!confirmation)
      
      // Add timeout to prevent infinite loading (longer for obvious test numbers)
      const rawPhone = (phoneNumber || '').toString()
      const isTestNumber = rawPhone.includes('999') || rawPhone.includes('888') || rawPhone.includes('777')
      const timeoutDuration = isTestNumber ? 60000 : 30000 // 60s for test, 30s for real
      
      const confirmPromise = confirmation.confirm(verificationCode)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Verification timeout. Please try again.')), timeoutDuration)
      )
      
      console.log('Verifying code, timeout:', timeoutDuration, 'ms', isTestNumber ? '(test number)' : '(real number)')
      const result = await Promise.race([confirmPromise, timeoutPromise])
      const user = result.user
      const formattedPhone = normalizeIndianPhone(user.phoneNumber || phoneNumber)
      if (!formattedPhone) {
        alert('Use a valid Indian mobile number (10 digits, +91 only)')
        setLoading(false)
        return
      }

      // Get token and sync user to Supabase
      const token = await user.getIdToken()
      const syncResponse = await fetch('/api/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          uid: user.uid,
          name: userName || 'User',
          phone: formattedPhone
        })
      })
      
      if (!syncResponse.ok) {
        console.error('Failed to sync user:', await syncResponse.text())
      }
      
      // Clear global confirmationResult after successful verification
      confirmationRef.current = null
      if (typeof window !== 'undefined') {
        window.confirmationResult = null
      }
      
      // Reset verification state (keep form phone intact; user will see it locked after auth updates)
      setVerificationCode('')
      setPhoneNumber('')
      
      // Ensure we are on the form step
      setStep(2)
      // Extract just the digits from formattedPhone (remove +91 prefix) for form display
      // The form stores only digits, and we normalize again on submit
      // formattedPhone is guaranteed to be valid here (checked above)
      const phoneDigits = formattedPhone.replace(/^\+91/, '')
      setFormData(prev => ({
        ...prev,
        name: userName || '',           // Auto-fill name from phone login
        phone: phoneDigits,             // Store just digits (form expects this format)
        contact_person: userName || ''  // Also fill contact_person
      }))
      
      // Reset recaptcha ready state to allow new verification if needed
      setRecaptchaReady(false)
    } catch (error) {
      console.error('Verification error:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      
      // Clear invalid confirmation on error
      confirmationRef.current = null
      if (typeof window !== 'undefined') {
        window.confirmationResult = null
      }
      
      // Show user-friendly error message
      let errorMessage = 'Verification failed. '
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage += 'Invalid code. Please check and try again.'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage += 'Too many verification attempts. Firebase has temporarily blocked requests.\n\n'
        errorMessage += '⚠️ What to do:\n'
        errorMessage += '   • Wait 5-10 minutes before trying again\n'
        errorMessage += '   • Request a new verification code if your code expired\n'
        errorMessage += '   • Avoid entering incorrect codes multiple times\n\n'
        errorMessage += '💡 Tip: Double-check the code sent to your phone before entering.'
        
        console.error('⚠️ Rate Limit Error (Verification):', {
          code: error.code,
          message: error.message,
          recommendation: 'Wait 5-10 minutes before retrying. Request a new code if needed.'
        })
        
        // Clear confirmation to force new request
        confirmationRef.current = null
        if (typeof window !== 'undefined') {
          window.confirmationResult = null
        }
        setVerificationCode('')
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage += 'Invalid credentials. Please try with a different phone number or request a new code.'
        // Clear confirmation to force new request
        confirmationRef.current = null
        if (typeof window !== 'undefined') {
          window.confirmationResult = null
        }
        setVerificationCode('')
      } else if (error.code === 'auth/invalid-app-credential') {
        errorMessage += 'Firebase configuration error. Please check Firebase Console settings.'
        // Clear confirmation
        confirmationRef.current = null
        if (typeof window !== 'undefined') {
          window.confirmationResult = null
        }
        setVerificationCode('')
      } else if (error.code === 'auth/code-expired') {
        errorMessage += 'Code expired. Please request a new code.'
        // Clear expired confirmation
        confirmationRef.current = null
        if (typeof window !== 'undefined') {
          window.confirmationResult = null
        }
        setVerificationCode('')
      } else if (error.message?.includes('timeout')) {
        errorMessage += 'Request timed out. Please try again.'
      } else {
        errorMessage += error.message || 'Please try again.'
      }
      
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.business_name || !formData.contact_person || !formData.email || !formData.phone || !formData.city || !formData.category) {
      alert('Please fill in all required fields (marked with *)')
      return
    }

    const formattedPhone = normalizeIndianPhone(formData.phone)
    if (!formattedPhone) {
      alert('Use a valid Indian mobile number (+91, 10 digits)')
      return
    }
    
    // Normalize WhatsApp number if provided
    const formattedWhatsApp = formData.whatsapp ? (normalizeIndianPhone(formData.whatsapp) || formData.whatsapp) : ''
    
    try {
      setLoading(true)
      const token = await auth.currentUser?.getIdToken()
      
      const response = await fetch('/api/register-vendor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, phone: formattedPhone, whatsapp: formattedWhatsApp })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert('Vendor registration successful! Your profile is verified.')
        router.push('/vendor/dashboard')
      } else {
        alert(data.error || 'Failed to register vendor')
      }
    } catch (error) {
      console.error('Registration error:', error)
      alert('Failed to register: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleServiceToggle = (serviceName) => {
    setFormData(prev => {
      const services = prev.services || []
      if (services.includes(serviceName)) {
        return { ...prev, services: services.filter(s => s !== serviceName) }
      } else {
        return { ...prev, services: [...services, serviceName] }
      }
    })
  }

  // Determine if a confirmationResult is available (ref or global)
  const hasConfirmation =
    (typeof window !== 'undefined' && !!window.confirmationResult) || !!confirmationRef.current

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-cream)' }}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 20px' }}>
        {step === 1 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', padding: '48px 24px' }}
          >
            <p style={{ fontSize: 16, color: 'var(--text-muted)' }}>
              Redirecting to vendor login...
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 12 }}>
              <a href="/login/vendor" style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>Click here</a> if you are not redirected.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="card" style={{ padding: 'clamp(20px, 5vw, 48px)' }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <h1 style={{
                  fontSize: 32,
                  fontWeight: 700,
                  marginBottom: 8,
                  color: 'var(--text-dark)'
                }}>
                  Vendor Registration
                </h1>
                <p style={{
                  fontSize: 15,
                  color: 'var(--text-muted)'
                }}>
                  Complete your vendor profile
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: 'var(--text-dark)', borderBottom: '2px solid var(--accent-rose)', paddingBottom: 8 }}>
                  Basic Information
                </h3>
                
                <div className="vendor-form-grid-lg">
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      Business Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      placeholder="Enter your business name"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        fontSize: 15
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="Full name of contact person"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        fontSize: 15
                      }}
                    />
                  </div>
                </div>

                <div className="vendor-form-grid-lg">
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="business@example.com"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        fontSize: 15
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                      <label style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>
                        Phone Number *
                      </label>
                      {auth?.currentUser?.phoneNumber ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          color: '#065f46',
                          fontSize: 12,
                          fontWeight: 800,
                          whiteSpace: 'nowrap'
                        }}>
                          ✓ Verified
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: '#fff7ed',
                          border: '1px solid #fed7aa',
                          color: '#9a3412',
                          fontSize: 12,
                          fontWeight: 800,
                          whiteSpace: 'nowrap'
                        }}>
                          Not verified
                        </span>
                      )}
                    </div>
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
                        fontSize: 15,
                        fontWeight: 500,
                        color: 'var(--text-dark)',
                        whiteSpace: 'nowrap'
                      }}>
                        <span style={{ marginRight: 4 }}>🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        required
                        value={(formData.phone || '').toString().replace(/^\+91/, '')}
                        disabled={!!auth?.currentUser?.phoneNumber}
                        onChange={(e) => {
                          // Only allow digits
                          const digits = e.target.value.replace(/[^0-9]/g, '')
                          // Limit to 10 digits
                          if (digits.length <= 10) {
                            setFormData({ ...formData, phone: digits })
                          }
                        }}
                        maxLength={10}
                        placeholder="9876543210"
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          border: 'none',
                          outline: 'none',
                          fontSize: 15
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Phone verification for Google/email users */}
                {!auth?.currentUser?.phoneNumber && (
                  <div style={{
                    marginBottom: 24,
                    padding: 16,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-cream)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--text-dark)' }}>Verify phone with OTP</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                          After verification, the phone field will lock and show ✓ Verified.
                        </div>
                      </div>
                    </div>

                    <div id="recaptcha-container" style={{ marginTop: 12 }} />

                    {!hasConfirmation ? (
                      <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => {
                            handlePhoneSignIn()
                          }}
                          disabled={loading || !(formData.phone || '').toString().replace(/\D/g, '').slice(-10).length === 10}
                          className="btn-primary"
                          style={{ padding: '12px 14px' }}
                        >
                          {loading ? 'Sending OTP…' : 'Send OTP'}
                        </button>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', alignSelf: 'center' }}>
                          Enter your phone above, then click Send OTP.
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Enter OTP"
                          style={{
                            width: 200,
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-light)',
                            fontSize: 16,
                            textAlign: 'center',
                            letterSpacing: 2,
                            background: 'white'
                          }}
                        />
                        <button
                          type="button"
                          onClick={verifyPhoneCode}
                          disabled={loading || verificationCode.length !== 6}
                          className="btn-primary"
                          style={{ padding: '12px 14px' }}
                        >
                          {loading ? 'Verifying…' : 'Verify OTP'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            confirmationRef.current = null
                            if (typeof window !== 'undefined') window.confirmationResult = null
                            setVerificationCode('')
                          }}
                          style={{
                            padding: '12px 14px',
                            background: 'white',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontWeight: 700
                          }}
                        >
                          Resend
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="vendor-form-grid-lg">
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      WhatsApp Number
                    </label>
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
                        fontSize: 15,
                        fontWeight: 500,
                        color: 'var(--text-dark)',
                        whiteSpace: 'nowrap'
                      }}>
                        <span style={{ marginRight: 4 }}>🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        value={(formData.whatsapp || '').toString().replace(/^\+91/, '')}
                        onChange={(e) => {
                          // Only allow digits
                          const digits = e.target.value.replace(/[^0-9]/g, '')
                          // Limit to 10 digits
                          if (digits.length <= 10) {
                            setFormData({ ...formData, whatsapp: digits })
                          }
                        }}
                        maxLength={10}
                        placeholder="9876543210"
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          border: 'none',
                          outline: 'none',
                          fontSize: 15
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.years_experience}
                      onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                      placeholder="e.g., 5"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        fontSize: 15
                      }}
                    />
                  </div>
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 30, marginBottom: 20, color: 'var(--text-dark)', borderBottom: '2px solid var(--accent-rose)', paddingBottom: 8 }}>
                  Location & Category
                </h3>

                <div className="vendor-form-grid-lg">
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      City *
                    </label>
                    <select
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        fontSize: 15,
                        background: 'white'
                      }}
                    >
                      <option value="">Select City</option>
                      {cities.map(city => (
                        <option key={city.id} value={city.name}>{city.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      Category *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        fontSize: 15,
                        background: 'white'
                      }}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    Business Address
                  </label>
                  <textarea
                    value={formData.business_address}
                    onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                    rows={3}
                    placeholder="Complete business address"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      fontSize: 15,
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 30, marginBottom: 20, color: 'var(--text-dark)', borderBottom: '2px solid var(--accent-rose)', paddingBottom: 8 }}>
                  Services Offered
                </h3>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                    Select Services (Multiple selection)
                  </label>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                    gap: 12,
                    padding: '16px',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-cream)'
                  }}>
                    {categories.map(cat => (
                      <label
                        key={cat.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          cursor: 'pointer',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: formData.services?.includes(cat.name) ? 'var(--accent-rose)' : 'white',
                          color: formData.services?.includes(cat.name) ? 'white' : 'var(--text-dark)',
                          border: `1px solid ${formData.services?.includes(cat.name) ? 'var(--accent-rose)' : 'var(--border-light)'}`,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.services?.includes(cat.name) || false}
                          onChange={() => handleServiceToggle(cat.name)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: 14 }}>{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    Other Services (if not listed above)
                  </label>
                  <input
                    type="text"
                    value={formData.other_services}
                    onChange={(e) => setFormData({ ...formData, other_services: e.target.value })}
                    placeholder="Comma-separated list of other services"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      fontSize: 15
                    }}
                  />
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 30, marginBottom: 20, color: 'var(--text-dark)', borderBottom: '2px solid var(--accent-rose)', paddingBottom: 8 }}>
                  Pricing
                </h3>

                <div className="vendor-form-grid-lg">
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      Minimum Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.price_min}
                      onChange={(e) => setFormData({ ...formData, price_min: e.target.value })}
                      placeholder="e.g., 10000"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        fontSize: 15
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      Maximum Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.price_max}
                      onChange={(e) => setFormData({ ...formData, price_max: e.target.value })}
                      placeholder="e.g., 100000"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        fontSize: 15
                      }}
                    />
                  </div>
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 30, marginBottom: 20, color: 'var(--text-dark)', borderBottom: '2px solid var(--accent-rose)', paddingBottom: 8 }}>
                  Business Description
                </h3>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    Brand Description
                  </label>
                  <textarea
                    value={formData.brand_description}
                    onChange={(e) => setFormData({ ...formData, brand_description: e.target.value })}
                    rows={4}
                    placeholder="Tell us about your business, your style, and what makes you unique..."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      fontSize: 15,
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    Why Choose Us?
                  </label>
                  <textarea
                    value={formData.why_choose}
                    onChange={(e) => setFormData({ ...formData, why_choose: e.target.value })}
                    rows={3}
                    placeholder="What makes your services special? List key differentiators..."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      fontSize: 15,
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    Current Deals & Offers
                  </label>
                  <textarea
                    value={formData.deals}
                    onChange={(e) => setFormData({ ...formData, deals: e.target.value })}
                    rows={2}
                    placeholder="Any special offers, discounts, or packages you're currently running..."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      fontSize: 15,
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 30, marginBottom: 20, color: 'var(--text-dark)', borderBottom: '2px solid var(--accent-rose)', paddingBottom: 8 }}>
                  Online Presence
                </h3>

                <div className="vendor-form-grid-lg">
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://www.example.com"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        fontSize: 15
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      Instagram Handle
                    </label>
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="@yourhandle or full URL"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        fontSize: 15
                      }}
                    />
                  </div>
                </div>

                <div className="vendor-form-grid-lg">
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      Facebook Page
                    </label>
                    <input
                      type="url"
                      value={formData.facebook}
                      onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                      placeholder="https://facebook.com/yourpage"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        fontSize: 15
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      YouTube Channel
                    </label>
                    <input
                      type="url"
                      value={formData.youtube}
                      onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                      placeholder="https://youtube.com/@yourchannel"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        fontSize: 15
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ width: '100%', padding: '16px', marginTop: 30 }}
                >
                  {loading ? 'Registering...' : 'Complete Registration'}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  )
}

export default function RegisterVendorPage() {
  return <VendorRegistration7StepForm />
}

