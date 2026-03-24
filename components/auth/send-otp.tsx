'use client'

import React, { useState, useEffect } from 'react'
import { auth, setupRecaptcha, signInWithPhoneNumber } from '../../lib/firebase_client'
import { normalizeIndianPhone } from '../../lib/phone-utils'
import type { ConfirmationResult } from 'firebase/auth'

type Props = {
  containerId?: string
  onCodeSent?: (phone: string) => void
}

/**
 * Client-only Send OTP component.
 *
 * - Uses a single visible reCAPTCHA instance bound to a static container.
 * - Never auto-sends OTP; only runs on explicit button click.
 * - Saves confirmationResult to window BEFORE invoking callbacks,
 *   so it survives route transitions / hydration.
 */
export default function SendOtp ({ containerId = 'recaptcha-container', onCodeSent }: Props) {
  const [rawPhone, setRawPhone] = useState('')
  const [sending, setSending] = useState(false)
  const [recaptchaReady, setRecaptchaReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const verifier = setupRecaptcha(containerId)
    console.debug('[SEND-OTP] reCAPTCHA init result:', !!verifier, 'container:', containerId)
    setRecaptchaReady(!!verifier)
  }, [containerId])

  const handleSend = async () => {
    if (!rawPhone) {
      alert('Please enter your phone number')
      return
    }

    const formatted = normalizeIndianPhone(rawPhone)
    if (!formatted) {
      alert('Use a valid Indian mobile number (+91, 10 digits)')
      return
    }

    if (!recaptchaReady) {
      alert('Security check is still loading. Please wait a moment and try again.')
      return
    }

    try {
      setSending(true)
      console.log('[SEND-OTP] Sending OTP to', formatted)

      const recaptchaVerifier = setupRecaptcha(containerId)
      if (!recaptchaVerifier) {
        throw new Error('reCAPTCHA not initialized')
      }

      const confirmation = await signInWithPhoneNumber(auth, formatted, recaptchaVerifier)

      // Save confirmationResult globally BEFORE any navigation/parent state changes.
      if (typeof window !== 'undefined') {
        // @ts-ignore - confirmationResult is added to window via global.d.ts
        window.confirmationResult = confirmation
      }

      console.log('[SEND-OTP] OTP sent, confirmationResult stored on window')
      onCodeSent?.(formatted)
    } catch (error: any) {
      console.error('[SEND-OTP] Phone sign in error:', error)
      console.error('[SEND-OTP] Error details:', {
        code: error.code,
        message: error.message,
        phone: formatted
      })
      
      let errorMessage = 'Failed to send verification code'
      
      if (error.code === 'auth/invalid-app-credential' || error.code === 'auth/unauthorized-domain') {
        errorMessage = '🔴 Firebase Phone Auth Not Configured\n\n'
        errorMessage += 'Enable Phone Authentication in Firebase Console:\n'
        errorMessage += 'https://console.firebase.google.com/project/wedeption-a40a0/authentication/providers'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      alert(errorMessage)
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Static visible reCAPTCHA container; widget mounts here */}
      <div id={containerId} />

      <input
        type="tel"
        placeholder="9876543210"
        value={rawPhone}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, '')
          if (digits.length <= 10) {
            setRawPhone(digits)
          }
        }}
        maxLength={10}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          fontSize: 15
        }}
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={sending || !rawPhone}
        className="btn-primary"
        style={{ width: '100%' }}
      >
        {sending ? 'Sending…' : 'Send Verification Code'}
      </button>
    </div>
  )
}


