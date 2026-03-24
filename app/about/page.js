import Footer from '../../components/Footer'

export default function AboutPage() {
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
            About Wedeption
          </h1>
          <p style={{ margin: 0, marginBottom: 24, fontSize: 14, color: 'var(--text-muted)' }}>
            A modern platform to plan weddings and events with confidence.
          </p>

          <div style={{ height: 1, background: 'linear-gradient(to right, rgba(233,30,99,0.3), transparent)' , marginBottom: 24 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 15, lineHeight: 1.7, color: 'var(--text-dark)' }}>
            <p>
              Wedeption is a modern wedding and event-planning platform designed to simplify one of the most important moments of your life.
            </p>
            <p>
              In India, planning a wedding often means endless phone calls, price confusion, unreliable vendors, and budget overruns. Wedeption was created to solve this exact problem.
            </p>
            <p>
              Our platform helps users discover, compare, and book trusted wedding and event service providers — all in one place. From wedding halls and caterers to decorators, photographers, and pandits, Wedeption brings everything together with smart AI-powered recommendations based on your budget and requirements.
            </p>
          </div>

          <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            <div style={{
              padding: 18,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #FEF2F7, #FFF7ED)',
              border: '1px solid rgba(248,113,150,0.25)'
            }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, marginBottom: 8, color: 'var(--text-dark)' }}>Our Mission</h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--text-muted)' }}>
                To make wedding and event planning simple, transparent, and stress-free for everyone.
              </p>
            </div>
            <div style={{
              padding: 18,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #EEF2FF, #ECFEFF)',
              border: '1px solid rgba(129,140,248,0.25)'
            }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, marginBottom: 8, color: 'var(--text-dark)' }}>Our Vision</h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--text-muted)' }}>
                To become India’s most trusted digital platform for weddings and events by empowering users with technology and helping local vendors grow online.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

