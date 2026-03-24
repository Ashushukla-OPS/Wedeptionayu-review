import Footer from '../../components/Footer'

export default function ContactPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-cream)' }}>
      <div className="container" style={{ maxWidth: 900, margin: '0 auto', padding: '80px 16px 40px' }}>
        <div style={{
          background: 'white',
          borderRadius: 24,
          padding: '40px 32px 36px',
          boxShadow: '0 18px 45px rgba(15,23,42,0.12)',
          border: '1px solid rgba(226,232,240,0.8)'
        }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 800,
            margin: 0,
            marginBottom: 8,
            color: 'var(--text-dark)'
          }}>
            Contact Us
          </h1>
          <p style={{ margin: 0, marginBottom: 24, fontSize: 14, color: 'var(--text-muted)' }}>
            We’re here to help with anything related to your wedding or vendor experience on Wedeption.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)', gap: 28, alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: 'var(--text-dark)' }}>Get in touch</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 14 }}>
                At Wedeption, we are committed to making your wedding and event planning experience smooth, simple, and stress-free.
                If you have any questions, concerns, feedback, or business inquiries, feel free to reach out to us.
              </p>
              <div style={{
                padding: 16,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #FEF2F2, #FFF7ED)',
                border: '1px solid rgba(248,113,113,0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 18
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '999px',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20
                }}>📧</div>
                <div>
                  <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280' }}>Email</div>
                  <a href="mailto:wedeption@gmail.com" style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent-rose)', textDecoration: 'none' }}>
                    wedeption@gmail.com
                  </a>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
                We aim to respond to all queries as quickly as possible.
              </p>

              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: 'var(--text-dark)' }}>Support & Business</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                For vendor listings, account issues, or collaboration opportunities, please write to us.
                Our team will review your request and get back to you promptly.
              </p>
            </div>

            <div style={{
              padding: 20,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #0F172A, #111827)',
              color: 'white',
              boxShadow: '0 20px 45px rgba(15,23,42,0.6)'
            }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, marginBottom: 16 }}>Connect with us</h2>
              <p style={{ fontSize: 13, color: 'rgba(249,250,251,0.8)', marginBottom: 16 }}>
                Follow Wedeption on social to discover real weddings, ideas, and vendor highlights.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a
                  href="https://www.instagram.com/wedeption/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 999,
                    background: 'rgba(248,250,252,0.06)',
                    border: '1px solid rgba(148,163,184,0.4)',
                    textDecoration: 'none',
                    color: 'inherit',
                    fontSize: 14
                  }}
                >
                  <span>Instagram</span>
                  <span style={{ opacity: 0.8 }}>@wedeption ↗</span>
                </a>
                <a
                  href="https://www.linkedin.com/company/wedeption/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 999,
                    background: 'rgba(248,250,252,0.06)',
                    border: '1px solid rgba(148,163,184,0.4)',
                    textDecoration: 'none',
                    color: 'inherit',
                    fontSize: 14
                  }}
                >
                  <span>LinkedIn</span>
                  <span style={{ opacity: 0.8 }}>Wedeption ↗</span>
                </a>
                <a
                  href="https://www.facebook.com/share/18NNqjDApo/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 999,
                    background: 'rgba(248,250,252,0.06)',
                    border: '1px solid rgba(148,163,184,0.4)',
                    textDecoration: 'none',
                    color: 'inherit',
                    fontSize: 14
                  }}
                >
                  <span>Facebook</span>
                  <span style={{ opacity: 0.8 }}>Follow page ↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

