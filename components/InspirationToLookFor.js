'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function InspirationToLookFor() {
  return (
    <section className="home-section" style={{ background: 'white' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 20
          }}>
            {/* Go to Inspiration Banner */}
            <Link href="/inspiration" style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
              <motion.div
                whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}
                style={{
                  position: 'relative',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  height: '320px',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: 'url(https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.8
                }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 100%)'
                }} />

                <div style={{ position: 'relative', zIndex: 1, padding: '40px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', padding: '4px 12px', borderRadius: '100px', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 16 }}>
                    ✨ IDEAS & TRENDS
                  </div>
                  <h3 className="home-section-title" style={{ fontSize: 'clamp(28px, 4vw, 36px)', color: '#fff', margin: '0 0 12px' }}>
                    Go to Inspiration
                  </h3>
                  <p className="home-section-subtitle" style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, margin: '0 0 24px', maxWidth: '280px' }}>
                    Browse thousands of photos to find the perfect style for your special day.
                  </p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#fff', fontWeight: 600, fontSize: 15 }}>
                    Explore Gallery <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                  </div>
                </div>
              </motion.div>
            </Link>

            {/* Go to Vendor Banner */}
            <Link href="/vendors" style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
              <motion.div
                whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(233,30,99,0.15)' }}
                style={{
                  position: 'relative',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  height: '320px',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #e91e63 100%)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: 'url(https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.4,
                  mixBlendMode: 'overlay'
                }} />

                <div style={{ position: 'relative', zIndex: 1, padding: '40px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', padding: '4px 12px', borderRadius: '100px', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 16 }}>
                    🤝 TRUSTED PROS
                  </div>
                  <h3 className="home-section-title" style={{ fontSize: 'clamp(28px, 4vw, 36px)', color: '#fff', margin: '0 0 12px' }}>
                    Go to Vendors
                  </h3>
                  <p className="home-section-subtitle" style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, margin: '0 0 24px', maxWidth: '280px' }}>
                    Connect with highly rated wedding professionals ready to bring your vision to life.
                  </p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#fff', fontWeight: 600, fontSize: 15, background: 'rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: '100px', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    Find Vendors <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

