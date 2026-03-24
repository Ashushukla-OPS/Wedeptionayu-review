'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { auth } from '../lib/firebase_client'
import { onAuthStateChanged, signOut } from 'firebase/auth'

export default function SiteHeader() {
  const router = useRouter()
  const pathname = usePathname()

  const [scrolled, setScrolled] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [isVendor, setIsVendor] = useState(false)

  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const profileWrapRef = useRef(null)

  const navItems = useMemo(
    () => [
      { label: 'Home', href: '/' },
      { label: 'Vendors', href: '/vendors' },
      { label: 'Inspiration', href: '/inspiration' },
      { label: 'Compare', href: '/compare' },
      { label: 'AI Planner', href: '/ai-planner' },
    ],
    []
  )

  const isActive = (href) => {
    if (!pathname) return false
    if (pathname === href) return true
    return pathname.startsWith(`${href}/`)
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(true)
      setFirebaseUser(user || null)
      setIsVendor(false)
      setProfileOpen(false)

      if (!user) {
        setAuthLoading(false)
        return
      }

      try {
        const token = await user.getIdToken()
        const vendorCheck = await fetch('/api/vendor/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setIsVendor(vendorCheck.ok)
      } catch (e) {
        console.error('Error checking vendor status:', e)
        setIsVendor(false)
      } finally {
        setAuthLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    // Re-check vendor status when navigating to vendor flows.
    // This keeps "Start a Business" -> "My Business" in sync right after registration.
    if (!firebaseUser || !pathname) return
    const shouldRecheck = pathname.startsWith('/vendor/') || pathname === '/register-vendor'
    if (!shouldRecheck) return

    let cancelled = false
    const run = async () => {
      setAuthLoading(true)
      try {
        const token = await firebaseUser.getIdToken()
        const vendorCheck = await fetch('/api/vendor/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!cancelled) setIsVendor(vendorCheck.ok)
      } catch (e) {
        console.error('Error re-checking vendor status:', e)
        if (!cancelled) setIsVendor(false)
      } finally {
        if (!cancelled) setAuthLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [firebaseUser, pathname])

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!profileOpen) return
      const el = profileWrapRef.current
      if (!el) return
      if (!el.contains(e.target)) setProfileOpen(false)
    }

    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [profileOpen])

  useEffect(() => {
    // Close mobile menu when route changes
    setMobileOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    try {
      setProfileOpen(false)
      await signOut(auth)
      router.push('/')
    } catch (e) {
      console.error('Logout error:', e)
      alert('Failed to logout')
    }
  }

  const guest = !firebaseUser
  const primaryLabel = guest ? 'Start a Business' : isVendor ? 'My Business' : 'Start a Business'
  const primaryHref = guest ? '/register-vendor' : isVendor ? '/vendor/dashboard' : '/register-vendor'
  const showStartBusinessIcon = primaryLabel === 'Start a Business'

  return (
    <header
      className={`header ${scrolled ? 'scrolled' : ''}`}
      style={{
        padding: 0,
        minHeight: 72,
        background: 'linear-gradient(180deg, rgba(255, 237, 246, 0.92) 0%, rgba(255, 251, 242, 0.78) 100%)',
        borderBottom: '1px solid rgba(212, 175, 55, 0.28)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          gap: 12,
          width: '100%',
        }}
      >
        {/* LEFT: Logo + Wedeption title */}
        <div className="wede-brand-wrap" style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none' }}>
            <img
              src="/Photos/lOGO.png"
              alt="Wedeption"
              className="wede-logo-img"
              style={{ height: 56, width: 'auto', objectFit: 'contain' }}
            />
            <span
              className="wede-logo-text"
              style={{
                fontSize: 32,
                fontWeight: 900,
                letterSpacing: '0.01em',
                background: 'linear-gradient(135deg, #B8860B 0%, #D4AF37 35%, #E8C547 60%, #F5E6D3 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                whiteSpace: 'nowrap',
                filter: 'none',
              }}
            >
              Wedeption
            </span>
          </Link>
        </div>

        {/* CENTER: Desktop nav */}
        <div className="header-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
          <nav className="wede-nav-desktop" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`wede-nav-link ${isActive(item.href) ? 'wede-nav-link-active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* RIGHT: Dynamic action area - pushed to far right */}
        <div className="wede-actions-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14, flex: '0 0 auto', justifySelf: 'end' }}>
          {authLoading ? null : guest ? (
            <>
              <Link href="/login" className="wede-nav-ghost desktop-only">
                Login
              </Link>
              <Link
                href={primaryHref}
                className="wede-nav-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}
              >
                {showStartBusinessIcon && (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="7" r="4" />
                    <path d="M5.5 21c1.5-4.5 4.5-6.5 6.5-6.5s5 2 6.5 6.5" />
                  </svg>
                )}
                {primaryLabel}
              </Link>
            </>
          ) : (
            <>
              <Link
                href={primaryHref}
                className="wede-nav-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}
              >
                {showStartBusinessIcon && (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="7" r="4" />
                    <path d="M5.5 21c1.5-4.5 4.5-6.5 6.5-6.5s5 2 6.5 6.5" />
                  </svg>
                )}
                {primaryLabel}
              </Link>

              {/* Profile Avatar + Dropdown */}
              <div ref={profileWrapRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="wede-profile-btn"
                  aria-label="Open profile menu"
                  aria-expanded={profileOpen}
                  onClick={() => setProfileOpen((v) => !v)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c1.8-4 4.8-6 8-6s6.2 2 8 6" />
                  </svg>
                  <span>Profile</span>
                </button>

                <div className={`wede-profile-dropdown ${profileOpen ? 'open' : ''}`}>
                  <Link
                    href="/shortlist"
                    className="wede-profile-item"
                    onClick={() => setProfileOpen(false)}
                  >
                    Shortlist
                  </Link>
                  <Link
                    href="/settings"
                    className="wede-profile-item"
                    onClick={() => setProfileOpen(false)}
                  >
                    Settings
                  </Link>
                  <button type="button" className="wede-profile-item" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}

          {/* MOBILE: Hamburger */}
          <button
            type="button"
            className="wede-hamburger"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      <div className={`wede-mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <div className="wede-mobile-menu-inner">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`wede-mobile-link ${isActive(item.href) ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {(!authLoading && guest) && (
            <Link
              href="/login"
              className={`wede-mobile-link ${isActive('/login') ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
