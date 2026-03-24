'use client'

import { useEffect, useState } from 'react'
import { auth } from '../../lib/firebase_client'

export default function SettingsPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u || null)
      if (!u) {
        setLoading(false)
        return
      }
      try {
        const token = await u.getIdToken(true)
        const res = await fetch('/api/sync-user', { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        const existingName = data?.user?.name || u.displayName || ''
        setName(existingName)
      } catch (_) {
        setName(u.displayName || '')
      } finally {
        setLoading(false)
      }
    })
    return () => unsub()
  }, [])

  const saveName = async () => {
    setMessage('')
    setError('')
    if (!user) return
    const cleanName = name.trim()
    if (!cleanName) {
      setError('Please enter your name.')
      return
    }
    setSaving(true)
    try {
      const token = await user.getIdToken(true)
      const res = await fetch('/api/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: 'customer', name: cleanName })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save settings')
      setMessage('Your name has been saved.')
    } catch (e) {
      setError(e.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="container" style={{ padding: '48px 24px' }}>Loading settings...</div>
  }

  if (!user) {
    return <div className="container" style={{ padding: '48px 24px' }}>Please login to open settings.</div>
  }

  return (
    <div style={{ minHeight: '80vh', background: 'linear-gradient(180deg, #fff5f8 0%, #faf8ff 50%, #fff 100%)' }}>
      <div className="container" style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eee', padding: 24, boxShadow: '0 8px 30px rgba(15,23,42,0.06)' }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#111827' }}>Profile Settings</h1>
          <p style={{ marginTop: 8, color: '#6b7280' }}>Set your name for reviews and profile display.</p>

          <label style={{ display: 'block', marginTop: 20, marginBottom: 8, fontWeight: 600, color: '#111827' }}>
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            maxLength={80}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 15 }}
          />

          {error && <div style={{ marginTop: 12, color: '#b91c1c', fontSize: 14 }}>{error}</div>}
          {message && <div style={{ marginTop: 12, color: '#166534', fontSize: 14 }}>{message}</div>}

          <button
            type="button"
            onClick={saveName}
            disabled={saving}
            className="btn-primary"
            style={{ marginTop: 18 }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
