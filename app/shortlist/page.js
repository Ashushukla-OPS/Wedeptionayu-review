'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { auth } from '../../lib/firebase_client'
import { tryToggleCompareVendor } from '../../lib/compare-storage'

export default function ShortlistPage() {
  const [user, setUser] = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!auth) {
      setLoadingAuth(false)
      return
    }
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u || null)
      setLoadingAuth(false)
    })
    return () => unsub()
  }, [])

  const fetchItems = async (u) => {
    setLoading(true)
    setErr('')
    try {
      const token = await u.getIdToken(true)
      const res = await fetch('/api/shortlist', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load shortlist')
      setItems(data.items || [])
    } catch (e) {
      setErr(e.message || 'Failed to load shortlist')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    fetchItems(user)
  }, [user?.uid])

  const remove = async (vendorId) => {
    if (!user) return
    try {
      const token = await user.getIdToken(true)
      const res = await fetch('/api/shortlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vendor_id: vendorId })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to remove')
      setItems((prev) => prev.filter((it) => it.vendor_id !== vendorId))
    } catch (e) {
      alert(e.message || 'Failed to remove')
    }
  }

  const addToCompare = (vendorId, vendorCategory) => {
    const res = tryToggleCompareVendor(vendorId, vendorCategory)
    if (!res.ok) alert(res.error)
  }

  const cards = useMemo(() => {
    return (items || []).map((it) => ({ ...it, vendor: it.vendors || {} }))
  }, [items])

  if (loadingAuth) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #fff5f8 0%, #faf8ff 50%, #ffffff 100%)',
      }}>
        <div style={{ textAlign: 'center', color: 'rgba(31,41,55,0.6)' }}>Loading…</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'linear-gradient(180deg, #fff5f8 0%, #faf8ff 50%, #ffffff 100%)',
      }}>
        <div style={{
          maxWidth: 480,
          width: '100%',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 20,
          border: '1px solid rgba(212,175,55,0.15)',
          padding: 36,
          boxShadow: '0 20px 60px rgba(15,23,42,0.08)',
        }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#1f2937' }}>Your Shortlist</h1>
          <p style={{ marginTop: 12, color: 'rgba(31,41,55,0.6)', lineHeight: 1.6, fontSize: 15 }}>
            Please log in to view and manage your shortlisted vendors.
          </p>
          <Link
            href="/login"
            className="btn-primary"
            style={{
              display: 'inline-block',
              marginTop: 20,
              padding: '14px 28px',
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(1000px 500px at 0% -10%, rgba(233,30,99,0.10) 0%, transparent 55%), radial-gradient(900px 500px at 100% 0%, rgba(139,92,246,0.08) 0%, transparent 50%), linear-gradient(180deg, #fff9fb 0%, #f9f7ff 40%, #ffffff 80%)',
    }}>
      <div className="container" style={{ maxWidth: 1160, margin: '0 auto', padding: '32px 24px 80px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 20,
          flexWrap: 'wrap',
          marginBottom: 28,
          background: 'rgba(255,255,255,0.72)',
          border: '1px solid rgba(255,255,255,0.9)',
          backdropFilter: 'blur(8px)',
          borderRadius: 18,
          padding: 20,
          boxShadow: '0 14px 40px rgba(15,23,42,0.06)',
        }}>
          <div>
            <h1 className="shortlist-title">
              Your Shortlist
            </h1>
            <p className="shortlist-subtitle">
              {items.length} saved vendor{items.length !== 1 ? 's' : ''} — compare, view, and plan
            </p>
          </div>
          <div className="shortlist-action-btns">
            <Link
              href="/compare"
              className="shortlist-btn-compare"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(233,30,99,0.08)'
                e.currentTarget.style.borderColor = 'rgba(233,30,99,0.5)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.8)'
                e.currentTarget.style.borderColor = 'rgba(233,30,99,0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Compare
            </Link>
            <Link
              href="/vendors"
              className="shortlist-btn-browse"
            >
              Browse Vendors
            </Link>
          </div>
        </div>

        {err && (
          <div style={{
            padding: 16,
            borderRadius: 14,
            background: 'rgba(239,68,68,0.08)',
            color: '#b91c1c',
            border: '1px solid rgba(239,68,68,0.2)',
            marginBottom: 24,
          }}>
            {err}
          </div>
        )}

        {loading ? (
          <div style={{
            padding: 80,
            textAlign: 'center',
            color: 'rgba(31,41,55,0.6)',
            background: 'rgba(255,255,255,0.6)',
            borderRadius: 20,
            boxShadow: '0 4px 24px rgba(15,23,42,0.04)',
          }}>
            Loading your shortlist…
          </div>
        ) : cards.length === 0 ? (
          <div style={{
            padding: 60,
            textAlign: 'center',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: 20,
            border: '1px solid rgba(212,175,55,0.12)',
            boxShadow: '0 12px 40px rgba(15,23,42,0.06)',
          }}>
            <div style={{
              width: 80,
              height: 80,
              margin: '0 auto 24px',
              borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(233,30,99,0.1) 0%, rgba(212,175,55,0.08) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
            }}>
              ✨
            </div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1f2937' }}>
              No vendors saved yet
            </h2>
            <p style={{ marginTop: 10, color: 'rgba(31,41,55,0.6)', fontSize: 15, lineHeight: 1.6 }}>
              Save vendors you like to compare them later and plan your wedding.
            </p>
            <Link
              href="/vendors"
              className="btn-primary"
              style={{
                display: 'inline-block',
                marginTop: 24,
                padding: '14px 28px',
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              Browse Vendors
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 24,
          }}>
            {cards.map(({ vendor_id, vendor, created_at }) => (
              <div
                key={vendor_id}
                className="shortlist-card"
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  borderRadius: 20,
                  border: '1px solid rgba(233,30,99,0.12)',
                  overflow: 'hidden',
                  boxShadow: '0 12px 36px rgba(15,23,42,0.08)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)'
                  e.currentTarget.style.boxShadow = '0 20px 56px rgba(233,30,99,0.12)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(15,23,42,0.06)'
                }}
              >
                <div style={{
                  height: 140,
                  background: (vendor.profile_pic || vendor.logo || vendor.banner)
                    ? `url(${vendor.profile_pic || vendor.logo || vendor.banner}) center/cover no-repeat`
                    : 'linear-gradient(135deg, #ffe8f0 0%, #f5e6ff 50%, #fff7ed 100%)',
                }} />
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#1f2937',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {vendor.business_name || 'Vendor'}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 14, color: 'rgba(31,41,55,0.65)' }}>
                        {(vendor.category || 'Vendor')}{vendor.city ? ` • ${vendor.city}` : ''}
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <span style={{
                          display: 'inline-flex',
                          padding: '5px 10px',
                          borderRadius: 999,
                          background: 'rgba(139,92,246,0.08)',
                          color: '#6d28d9',
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.02em',
                        }}>
                          SAVED
                        </span>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(31,41,55,0.5)' }}>
                        Saved {new Date(created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    {vendor.verified && (
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: 999,
                        background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.08) 100%)',
                        color: '#15803d',
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}>
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="shortlist-card-actions">
                    <Link
                      href={`/vendor/${vendor_id}`}
                      style={{
                        background: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)',
                        color: '#fff',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-1px)'
                        e.target.style.boxShadow = '0 8px 24px rgba(233,30,99,0.35)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)'
                        e.target.style.boxShadow = 'none'
                      }}
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={() => addToCompare(vendor_id, vendor?.category)}
                      style={{
                        border: '1px solid rgba(233,30,99,0.25)',
                        background: 'rgba(233,30,99,0.06)',
                        color: '#E91E63',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(233,30,99,0.12)'
                        e.currentTarget.style.borderColor = 'rgba(233,30,99,0.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(233,30,99,0.06)'
                        e.currentTarget.style.borderColor = 'rgba(233,30,99,0.25)'
                      }}
                    >
                      Compare
                    </button>
                    <button
                      onClick={() => remove(vendor_id)}
                      style={{
                        border: '1px solid rgba(239,68,68,0.2)',
                        background: 'rgba(239,68,68,0.04)',
                        color: '#b91c1c',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
                        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239,68,68,0.04)'
                        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
