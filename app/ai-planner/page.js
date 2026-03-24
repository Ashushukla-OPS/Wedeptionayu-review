'use client'

import Footer from '../../components/Footer'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function AIPlannerPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-cream)' }}>
      {/* Hero Section */}
      <section style={{
        padding: '80px 0 60px',
        background: 'linear-gradient(135deg, rgba(233,30,99,0.05) 0%, rgba(212,175,55,0.03) 100%)'
      }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}
          >
            <div style={{ fontSize: 64, marginBottom: 24 }}>🤖</div>
            <h1 style={{
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 700,
              marginBottom: 16,
              color: 'var(--text-dark)'
            }}>
              AI Wedding Planner
            </h1>
            <p style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              color: 'var(--text-muted)',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Get personalized wedding planning recommendations powered by AI. Tell us about your dream wedding and we'll create a custom plan.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section style={{ padding: '60px 0' }}>
        <div className="container">
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="card"
              style={{
                padding: '80px 48px',
                textAlign: 'center'
              }}
            >
              <div style={{
                fontSize: '72px',
                marginBottom: 24,
                lineHeight: 1
              }}>
                🚀
              </div>
              <h2 style={{
                fontSize: 'clamp(32px, 4vw, 48px)',
                fontWeight: 700,
                marginBottom: 16,
                color: 'var(--text-dark)',
                letterSpacing: '-0.02em'
              }}>
                Coming Soon
              </h2>
              <p style={{
                fontSize: 'clamp(16px, 2vw, 20px)',
                color: 'var(--text-muted)',
                marginBottom: 32,
                lineHeight: 1.6,
                maxWidth: '600px',
                margin: '0 auto 32px'
              }}>
                We're working hard to bring you an amazing AI-powered wedding planning experience. 
                Stay tuned for updates!
              </p>
              <div style={{
                display: 'flex',
                gap: 16,
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <Link href="/vendors" className="btn-primary">
                  Browse Vendors
                </Link>
                <Link href="/inspiration" className="btn-secondary">
                  View Inspiration
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

