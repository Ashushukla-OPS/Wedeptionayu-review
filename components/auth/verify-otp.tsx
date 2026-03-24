'use client'

import React, { useState } from 'react'
import type { ConfirmationResult } from 'firebase/auth'

type Props = {
  onVerified?: (user: any) => void
}

/**
 * Client-only Verify OTP component.
 *
 * - Never auto-verifies on mount.
 * - Only calls confirmationResult.confirm on explicit button click.
 * - Reads confirmationResult from window so it survives route transitions.
 */
export default function VerifyOtp ({ onVerified }: Props) {
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)

  const handleVerify = async () => {
    if (!code) {
      alert('Please enter the verification code')
      return
    }

    const confirmation: ConfirmationResult | null | undefined =
      typeof window !== 'undefined' ? window.confirmationResult : null

    if (!confirmation || typeof confirmation.confirm !== 'function') {
      alert('Verification session expired. Please request a new code.')
      return
    }

    try {
      setVerifying(true)
      console.log('[VERIFY-OTP] Verifying code:', code)
      const result = await confirmation.confirm(code)

      if (typeof window !== 'undefined') {
        window.confirmationResult = null
      }

      console.log('[VERIFY-OTP] Verification succeeded, user:', result.user)
      onVerified?.(result.user)
    } catch (error) {
      console.error('[VERIFY-OTP] Verification error:', error)
      alert(error.message || 'Verification failed. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        type="text"
        placeholder="Enter 6-digit code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={6}
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
        onClick={handleVerify}
        disabled={verifying || !code}
        className="btn-primary"
        style={{ width: '100%' }}
      >
        {verifying ? 'Verifying…' : 'Verify Code'}
      </button>
    </div>
  )
}


