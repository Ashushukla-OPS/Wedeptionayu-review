'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const BG_IMAGES = [
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80',
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
  'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&q=80',
  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80',
]

export default function InspirationToLookFor() {
  const [current, setCurrent] = useState(0)
  const [activeCard, setActiveCard] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setCurrent((p) => (p + 1) % BG_IMAGES.length)
    }, 4000)

    return () => clearInterval(t)
  }, [])

  return (
    <>
      <style>{`
        .inspire-section {
          background: #f1e8e8;
          color: #000;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow: hidden;
        }

        .inspire-label {
          font-size: 15px;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(18, 18, 18, 0.94);
          margin: 0 0 36px;
          text-align: center;
        }

        .inspire-grid {
          display: flex;
          gap: 20px;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          align-items: stretch;
        }

        .inspire-grid > div {
          flex: 1 1 0;
        }

        .inspire-card-link {
          text-decoration: none;
          height: 100%;
          display: block;
          color: inherit;
        }

        .inspire-card {
          height: 320px;
          min-height: 320px;
          border-radius: 24px;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px;
          cursor: pointer;
        }

        .vendors-card {
          background: linear-gradient(145deg, #0f0f0f 0%, #1a0a2e 60%, #0f0f0f 100%);
          border: 1px solid rgba(255,255,255,0.07);
        }

        .ideas-card {
          background: #111;
        }

        .inspire-badge {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 5px 14px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          align-self: flex-start;
        }

        .vendors-badge {
          background: rgba(190,24,93,0.2);
          border: 1px solid rgba(190,24,93,0.35);
          color: #f9a8d4;
        }

        .ideas-badge {
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.25);
          backdrop-filter: blur(8px);
          color: #fff;
        }

        .vendors-abstract {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .vendors-glow {
          position: absolute;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(190,24,93,0.18) 0%, transparent 70%);
        }

        .glass-content {
          position: relative;
          z-index: 2;
          padding: 34px 30px;
          border-radius: 28px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.22);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(255, 255, 255, 0.45);
          box-shadow:
            0 24px 70px rgba(0,0,0,0.16),
            inset 0 1px 0 rgba(255,255,255,0.55);
          animation: floatCard 4s ease-in-out infinite;
        }

        .flash-light {
          position: absolute;
          top: -40%;
          left: -80%;
          width: 70%;
          height: 180%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.65), transparent);
          transform: rotate(18deg);
          animation: flashMove 3.2s ease-in-out infinite;
          pointer-events: none;
        }

        .vendors-text {
          position: relative;
          font-size: clamp(24px, 3vw, 36px);
          font-weight: 700;
          color: #1f1d1d;
          line-height: 1.12;
          margin: 0 0 22px;
          font-family: 'Cormorant Garamond', Georgia, serif;
          letter-spacing: -0.02em;
          text-shadow: 0 2px 18px rgba(255,255,255,0.55);
        }

        .vendors-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.86);
          border: 1px solid rgba(255,255,255,0.75);
          border-radius: 999px;
          padding: 12px 24px;
          font-size: 12px;
          font-weight: 800;
          color: #111;
          letter-spacing: 0.06em;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(0,0,0,0.14);
          transition: all 0.3s ease;
        }

        .vendors-btn:hover {
          transform: translateY(-3px) scale(1.04);
          box-shadow: 0 18px 38px rgba(0,0,0,0.22);
        }

        .ideas-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          background-size: cover;
          background-position: center;
        }

        .ideas-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.72) 100%);
        }

        .ideas-content {
          position: relative;
          z-index: 2;
        }

        .ideas-text {
          font-size: clamp(20px, 2.8vw, 30px);
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
          margin: 0 0 20px;
          font-family: 'Cormorant Garamond', Georgia, serif;
          letter-spacing: -0.01em;
        }

        .ideas-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .ideas-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.18);
          border: 1px solid rgba(255,255,255,0.3);
          backdrop-filter: blur(8px);
          border-radius: 999px;
          padding: 10px 22px;
          font-size: 12px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        .dots {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .mobile-card-toggle {
          display: none;
        }

        @keyframes flashMove {
          0% {
            left: -80%;
            opacity: 0;
          }
          35% {
            opacity: 1;
          }
          70% {
            left: 120%;
            opacity: 0;
          }
          100% {
            left: 120%;
            opacity: 0;
          }
        }

        @keyframes floatCard {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @media (max-width: 768px) {
          .inspire-section {
            padding: 0;
          }

          .inspire-label {
            font-size: 13px;
            margin-bottom: 22px;
          }

          .inspire-grid {
            flex-direction: column;
            max-width: 430px;
            gap: 20px;
            padding: 0 20px;
          }

          .inspire-card-link {
            flex: none;
          }

          .mobile-card-toggle {
            display: flex;
            width: 100%;
            min-height: 58px;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            border: none;
            border-radius: 18px;
            padding: 0 18px;
            background: #fff;
            color: #111827;
            font-size: 16px;
            font-weight: 900;
            cursor: pointer;
            box-shadow: 0 12px 30px rgba(17, 24, 39, 0.08);
          }

          .mobile-card-toggle span:last-child {
            color: #be185d;
            font-size: 26px;
            line-height: 1;
          }

          .inspire-card {
            display: none;
            height: 320px;
            min-height: 320px;
            padding: 40px;
            border-radius: 24px;
            margin-top: 10px;
          }

          .inspire-card.active {
            display: flex;
            animation: openCard 0.24s ease;
          }

          .glass-content {
            padding: 24px 20px;
            border-radius: 22px;
          }

          .vendors-text {
            font-size: 29px;
          }

          .ideas-text {
            font-size: 27px;
          }

          .ideas-bottom {
            flex-direction: column;
            align-items: flex-start;
          }

          .ideas-btn,
          .vendors-btn {
            width: 100%;
            justify-content: center;
          }

          @keyframes openCard {
            from {
              opacity: 0;
              transform: translateY(-8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        }

        @media (max-width: 480px) {
          .inspire-section {
            padding: 0;
          }

          .inspire-grid {
            max-width: 100%;
            padding: 0 20px;
          }

          .mobile-card-toggle {
            min-height: 54px;
            border-radius: 16px;
            font-size: 15px;
            padding: 0 16px;
          }

          .inspire-card {
            height: 320px;
            min-height: 320px;
            padding: 40px;
            border-radius: 24px;
          }

          .glass-content {
            padding: 22px 18px;
          }

          .vendors-text {
            font-size: 26px;
          }

          .ideas-text {
            font-size: 25px;
          }

          .inspire-badge {
            font-size: 9.5px;
          }
        }
      `}</style>

      <section className="inspire-section">
        <motion.p
          className="inspire-label"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Discover · Inspire · Connect
        </motion.p>

        <div className="inspire-grid">
          {/* Card 1 */}
          <div>
            <button
              type="button"
              className="mobile-card-toggle"
              onClick={() => setActiveCard(activeCard === 0 ? null : 0)}
            >
              <span>🤝 Trusted Pros</span>

              <span className="mobile-toggle-btn">
                {activeCard === 0 ? 'Close' : 'view'}
              </span>
            </button>

            <Link href="/vendors" className="inspire-card-link">
              <motion.div
                className={`inspire-card vendors-card ${
                  activeCard === 0 ? 'active' : ''
                }`}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="vendors-abstract">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        width: `${120 - i * 24}px`,
                        height: `${175 - i * 24}px`,
                        borderRadius:
                          '40% 40% 50% 50% / 30% 30% 70% 70%',
                        background: `rgba(190,24,93,${
                          0.1 + i * 0.07
                        })`,
                        transform: `translateY(${i * 16}px)`,
                      }}
                    />
                  ))}
                  <div className="vendors-glow" />
                </div>

                <div className="inspire-badge vendors-badge">
                  🤝 Trusted Pros
                </div>

                <div className="glass-content">
                  <div className="flash-light" />

                  <p className="vendors-text">
                    Find the perfect vendor for your special day.
                  </p>

                  <div className="vendors-btn">
                    Find Vendors
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>

          {/* Card 2 */}
          <div>
            <button
              type="button"
              className="mobile-card-toggle"
              onClick={() => setActiveCard(activeCard === 1 ? null : 1)}
            >
              <span>✨ Ideas & Trends</span>
              <span>{activeCard === 1 ? '−' : '+'}</span>
            </button>

            <Link href="/inspiration" className="inspire-card-link">
              <motion.div
                className={`inspire-card ideas-card ${
                  activeCard === 1 ? 'active' : ''
                }`}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <AnimatePresence>
                  <motion.div
                    key={current}
                    className="ideas-bg"
                    initial={{ opacity: 0, scale: 1.06 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.4, ease: 'easeInOut' }}
                    style={{
                      backgroundImage: `url(${BG_IMAGES[current]})`,
                    }}
                  />
                </AnimatePresence>

                <div className="ideas-overlay" />

                <div className="inspire-badge ideas-badge">
                  ✨ Ideas & Trends
                </div>

                <div className="ideas-content">
                  <p className="ideas-text">
                    Browse thousands of ideas for your dream wedding.
                  </p>

                  <div className="ideas-bottom">
                    <div className="ideas-btn">Explore Gallery →</div>

                    <div className="dots">
                      {BG_IMAGES.map((_, i) => (
                        <div
                          key={i}
                          style={{
                            width: i === current ? 20 : 6,
                            height: 6,
                            borderRadius: 999,
                            background:
                              i === current
                                ? '#fff'
                                : 'rgba(255,255,255,0.3)',
                            transition: 'all 0.35s ease',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}