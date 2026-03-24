'use client'

import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    'For Couples': [
      { name: 'Browse Vendors', href: '/vendors' },
      { name: 'Wedeption Inspiration', href: '/inspiration' },
      { name: 'Compare Vendors', href: '/compare' },
      { name: 'AI Wedding Planner', href: '/ai-planner' },
    ],
    'For Vendors': [
      { name: 'Join as Vendor', href: '/register-vendor' },
      { name: 'Vendor Dashboard', href: '/vendor/dashboard' },
    ],
    'Legal': [
      { name: 'About', href: '/about' },
      { name: 'Contact', href: '/contact' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms & Conditions', href: '/terms' },
    ],
  }

  return (
    <footer style={{
      marginTop: 20,
      padding: '40px 0 24px',
      background: 'white',
      borderTop: '1px solid #f3f4f6'
    }}>
      <div className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 40,
          marginBottom: 40
        }}>
          {/* Brand Section */}
          <div style={{ flex: '1 1 300px', maxWidth: 400 }}>
            <div style={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #e91e63 0%, #be185d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: 28,
              letterSpacing: '-0.02em',
              marginBottom: 16
            }}>
              Wedeption
            </div>
            <p style={{
              fontSize: 14,
              color: '#6b7280',
              lineHeight: 1.6,
              marginBottom: 24
            }}>
              Your trusted partner in planning the perfect Events and Wedding. Discover premium vendors, save inspirations, and create unforgettable memories effortlessly.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <a href="https://facebook.com/wedeption" target="_blank" rel="noopener noreferrer" style={{
                width: 40, height: 40, borderRadius: '50%', background: '#FFF5F7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#e91e63', transition: 'all 0.2s', textDecoration: 'none', fontWeight: 600
              }} onMouseEnter={e => { e.currentTarget.style.background = '#e91e63'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FFF5F7'; e.currentTarget.style.color = '#e91e63' }}>f</a>
              <a href="https://linkedin.com/company/wedeption" target="_blank" rel="noopener noreferrer" style={{
                width: 40, height: 40, borderRadius: '50%', background: '#FFF5F7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#e91e63', transition: 'all 0.2s', textDecoration: 'none', fontWeight: 600
              }} onMouseEnter={e => { e.currentTarget.style.background = '#e91e63'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FFF5F7'; e.currentTarget.style.color = '#e91e63' }}>in</a>
              <a href="https://instagram.com/wedeption" target="_blank" rel="noopener noreferrer" style={{
                width: 40, height: 40, borderRadius: '50%', background: '#FFF5F7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#e91e63', transition: 'all 0.2s', textDecoration: 'none', fontWeight: 600
              }} onMouseEnter={e => { e.currentTarget.style.background = '#e91e63'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FFF5F7'; e.currentTarget.style.color = '#e91e63' }}>ig</a>
            </div>
          </div>

          {/* Links Sections */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '32px',
            flex: '2 1 400px'
          }}>
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h4 style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#111827',
                  marginBottom: 20,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase'
                }}>
                  {title}
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {links.map((link) => (
                    <li key={link.name} style={{ marginBottom: 12 }}>
                      <Link href={link.href} style={{
                        fontSize: 14, color: '#6b7280', textDecoration: 'none', transition: 'color 0.2s', fontWeight: 500
                      }} onMouseEnter={e => e.currentTarget.style.color = '#e91e63'}
                        onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          paddingTop: 24,
          borderTop: '1px solid #f3f4f6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>
            © {currentYear} Wedeption. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#9ca3af' }}>
            <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#111827'} onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>Privacy</Link>
            <Link href="/terms" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#111827'} onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>Terms</Link>
            <Link href="/sitemap" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#111827'} onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
