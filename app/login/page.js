'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth, googleProvider } from '../../lib/firebase_client'
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth'

// Format Indian phone number
function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '')
  if (digits.length !== 10) return null
  return `+91${digits}`
}

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [showOtp, setShowOtp] = useState(false)
  const [loading, setLoading] = useState(false)

  const confirmationResultRef = useRef(null)

  // Redirect if already logged in (customer login)
  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        syncCustomerAndRedirect()
      }
    })
  }, [router])

  const syncCustomerAndRedirect = async () => {
    if (!auth?.currentUser) return
    try {
      const token = await auth.currentUser.getIdToken()
      const vendorCheck = await fetch('/api/vendor/me', { headers: { 'Authorization': `Bearer ${token}` } })
      if (vendorCheck.ok) {
        router.push('/vendor/dashboard')
        return
      }
      await fetch('/api/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role: 'customer' })
      })
    } catch (e) {
      console.error('Sync customer error:', e)
    }
    router.push('/')
  }

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
      // Clear container before creating new verifier (prevents invalid-app-credential from stale widgets)
      const container = document.getElementById('recaptcha-container')
      if (container) container.innerHTML = ''

      // Create fresh RecaptchaVerifier every time
      const recaptchaVerifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        {
          size: 'invisible' // Invisible often works better with Next.js / SPAs
        }
      )

      await recaptchaVerifier.render()

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formatted,
        recaptchaVerifier
      )

      confirmationResultRef.current = confirmationResult
      setShowOtp(true)

      alert('OTP sent!')
    } catch (err) {
      console.error('OTP ERROR:', err)

      // auth/invalid-app-credential usually means domain not authorized in Firebase
      if (err?.code === 'auth/invalid-app-credential' || err?.message?.includes('INVALID_APP_CREDENTIAL')) {
        const origin = typeof window !== 'undefined' ? window.location.origin : ''
        const msg =
          'Phone auth failed: Domain not authorized.\n\n' +
          'Fix: Firebase Console → Authentication → Settings → Authorized Domains\n' +
          'Add: localhost AND 127.0.0.1\n\n' +
          'Then use 127.0.0.1:3000 instead of localhost:3000 in your browser.'
        alert(msg)
      } else {
        alert(err?.message || 'Failed to send OTP')
      }
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
      await syncCustomerAndRedirect()
    } catch (err) {
      console.error(err)
      alert('Invalid or expired OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
      await syncCustomerAndRedirect()
    } catch (err) {
      console.error(err)
      alert('Google sign-in failed')
    } finally {
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
        <h2 style={{ marginBottom: 8, fontSize: 24, fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>Customer Login</h2>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>Sign in to save vendors, compare, and manage your wedding planning.</p>

        {/* 🔥 MUST always exist */}
        <div id="recaptcha-container" style={{ marginBottom: 20 }}></div>

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
          Are you a vendor? <Link href="/login/vendor" style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>Vendor login</Link>
        </p>
      </div>
    </div>
  )
}