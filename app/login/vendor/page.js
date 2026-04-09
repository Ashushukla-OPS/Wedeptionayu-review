'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth, googleProvider } from '../../../lib/firebase_client'
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth'

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '')
  if (digits.length !== 10) return null
  return `+91${digits}`
}

export default function VendorLoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [showOtp, setShowOtp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [isVendor, setIsVendor] = useState(false)

  const confirmationResultRef = useRef(null)

  const syncVendorAndRedirect = async (goToDashboard) => {
    if (!auth?.currentUser) return
    try {
      const token = await auth.currentUser.getIdToken()
      await fetch('/api/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role: 'vendor' })
      })
      if (goToDashboard) {
        router.push('/vendor/dashboard')
      } else {
        router.push('/register-vendor')
      }
    } catch (e) {
      console.error('Vendor sync/redirect error:', e)
      router.push('/register-vendor')
    }
  }

  // When user just logged in (OTP/Google), redirect; do NOT auto-redirect on page load
  const handleJustLoggedIn = async () => {
    if (!auth?.currentUser) return
    try {
      const token = await auth.currentUser.getIdToken()
      const vendorCheck = await fetch('/api/vendor/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (vendorCheck.ok) {
        await syncVendorAndRedirect(true)
      } else {
        await syncVendorAndRedirect(false)
      }
    } catch (e) {
      console.error('Vendor redirect error:', e)
      router.push('/register-vendor')
    }
  }

  useEffect(() => {
    if (!auth) return
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoading(true)
        await handleJustLoggedIn()
      }
    })
    return () => unsubscribe()
  }, [])

  const sendOtp = async () => {
    const formatted = formatPhone(phone)
    if (!formatted) {
      alert('Enter valid 10-digit number')
      return
    }
    if (!auth) {
      alert('Firebase not initialized. Refresh the page.')
      return
    }
    setLoading(true)
    try {
      const container = document.getElementById('recaptcha-container-vendor')
      if (container) container.innerHTML = ''
      const recaptchaVerifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container-vendor',
        { size: 'invisible' }
      )
      await recaptchaVerifier.render()
      const confirmationResult = await signInWithPhoneNumber(auth, formatted, recaptchaVerifier)
      confirmationResultRef.current = confirmationResult
      setShowOtp(true)
      alert('OTP sent!')
    } catch (err) {
      console.error('OTP ERROR:', err)
      alert(err?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      alert('Enter valid OTP')
      return
    }
    setLoading(true)
    try {
      await confirmationResultRef.current.confirm(otp)
      // Redirect is handled by onAuthStateChanged
    } catch (err) {
      console.error(err)
      alert('Invalid or expired OTP')
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
      // Redirect is handled by onAuthStateChanged
    } catch (err) {
      console.error(err)
      alert('Google sign-in failed')
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(1000px 600px at 10% 10%, rgba(233,30,99,0.12) 0%, rgba(233,30,99,0) 50%), linear-gradient(135deg, #fff1f2 0%, #fff7ed 45%, #eef2ff 100%)'
      }}
    >
      <div style={{ width: 420, padding: 32, background: 'white', borderRadius: 16, boxShadow: '0 12px 30px rgba(0,0,0,0.08)', border: '1px solid #f1f1f1' }}>
        <div style={{ height: 6, borderRadius: 999, background: 'linear-gradient(90deg, #E91E63, #C2185B)', marginBottom: 18 }} />
        <h2 style={{ marginBottom: 8, fontSize: 24, fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>Vendor Login</h2>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>Sign in to access your vendor dashboard or register as a vendor.</p>

        <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
          Sign in with your account:
        </p>

        <div id="recaptcha-container-vendor" style={{ marginBottom: 20 }}></div>

        {!showOtp ? (
          <>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{
                width: '100%',
                padding: 14,
                marginBottom: 20,
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                color: 'white',
                background: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)'
              }}
            >
              Continue with Google
            </button>

            <div style={{ marginBottom: 16 }}>
              <input
                type="tel"
                placeholder="Enter 10 digit number"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                }
                style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #e5e7eb', outline: 'none', fontSize: 14 }}
              />
            </div>

            <button
              onClick={sendOtp}
              disabled={loading || phone.length !== 10}
              style={{
                width: '100%',
                padding: 14,
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                color: 'white',
                background: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)'
              }}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #e5e7eb', outline: 'none', fontSize: 14, textAlign: 'center' }}
              />
            </div>

            <button
              onClick={verifyOtp}
              disabled={loading || otp.length !== 6}
              style={{
                width: '100%',
                padding: 14,
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                color: 'white',
                background: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)'
              }}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </>
        )}

        <p style={{ marginTop: 24, fontSize: 14, color: '#666', textAlign: 'center' }}>
          Not a vendor? <Link href="/login" style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>Customer login</Link>
        </p>
        <p style={{ marginTop: 8, fontSize: 14, color: '#666', textAlign: 'center' }}>
          New vendor? <Link href="/register-vendor" style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>Register here</Link>
        </p>
      </div>
    </div>
  )
}
