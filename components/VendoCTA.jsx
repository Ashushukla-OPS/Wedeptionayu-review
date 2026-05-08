"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const BG_IMAGES = [
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1400&q=80", // wedding venue grand
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1400&q=80", // wedding decor
  "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1400&q=80", // photographer at work
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1400&q=80", // bride makeup
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1400&q=80", // wedding reception
];

const STATS = [
  { value: "500+", label: "Vendors Listed" },
  { value: "10K+", label: "Happy Couples" },
  { value: "50+", label: "Cities Covered" },
  { value: "4.9★", label: "Avg. Rating" },
];

export default function VendorCTA() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % BG_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        maxHeight: "470px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
      }}
    >
      {/* ── Rotating background images ── */}
      <AnimatePresence>
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            backgroundImage: `url(${BG_IMAGES[current]})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </AnimatePresence>

      {/* ── Deep navy overlay — like the reference image ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background: `
          linear-gradient(180deg,
            rgba(2,8,32,0.82) 0%,
            rgba(5,15,55,0.78) 40%,
            rgba(8,20,70,0.85) 100%
          )
        `,
        }}
      />

      {/* ── Glowing radial orbs (like the tech image) ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        {/* Top-center glow */}
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 600,
            height: 400,
            background:
              "radial-gradient(ellipse, rgba(190,24,93,0.18) 0%, transparent 65%)",
          }}
        />
        {/* Bottom-left glow */}
        <div
          style={{
            position: "absolute",
            bottom: "-5%",
            left: "10%",
            width: 400,
            height: 300,
            background:
              "radial-gradient(ellipse, rgba(56,189,248,0.10) 0%, transparent 65%)",
          }}
        />
        {/* Bottom-right glow */}
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            right: "5%",
            width: 350,
            height: 250,
            background:
              "radial-gradient(ellipse, rgba(244,114,182,0.12) 0%, transparent 65%)",
          }}
        />
      </div>

      {/* ── Subtle grid ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          backgroundImage: `
          linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
        `,
          backgroundSize: "52px 52px",
        }}
      />

      {/* ── Image dots indicator ── */}
      <div
        style={{
          position: "absolute",
          bottom: 28,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 8,
          zIndex: 10,
        }}
      >
        {BG_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              width: i === current ? 24 : 8,
              height: 8,
              borderRadius: 999,
              background: i === current ? "#f472b6" : "rgba(255,255,255,0.3)",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "all 0.35s ease",
            }}
          />
        ))}
      </div>

      {/* ── Content ── */}
      <div
        style={{
          position: "relative",
          zIndex: 5,
          textAlign: "center",
          maxWidth: 720,
          width: "100%",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(244,114,182,0.15)",
              border: "1px solid rgba(244,114,182,0.35)",
              backdropFilter: "blur(12px)",
              borderRadius: 999,
              padding: "7px 20px",
              marginBottom: 24,
            }}
          >
            <span style={{ fontSize: 14 }}>💼</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#f9a8d4",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              For Vendors & Businesses
            </span>
          </div>

          {/* Headline */}
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(30px, 5vw, 52px)",
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 10px",
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
            }}
          >
            Join{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #f9a8d4, #be185d)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Wedeption
            </span>{" "}
            to Upscale
            <br />
            Your Business
          </h2>

          {/* Subtext */}
          <p
            style={{
              fontSize: "clamp(14px, 1.8vw, 17px)",
              color: "rgba(255,255,255,0.65)",
              margin: "0 auto 36px",
              maxWidth: 520,
              lineHeight: 1.7,
              fontWeight: 400,
            }}
          >
            Partner with us and get discovered by thousands of couples planning
            their dream wedding. Grow your bookings, build your brand.
          </p>

          {/* Stats row */}
          {/* <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "clamp(16px, 4vw, 48px)",
              marginBottom: 44,
              flexWrap: "wrap",
            }}
          >
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                style={{ textAlign: "center" }}
              >
                <div
                  style={{
                    fontSize: "clamp(22px, 3vw, 30px)",
                    fontWeight: 800,
                    color: "#f9a8d4",
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    lineHeight: 1.1,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.5)",
                    fontWeight: 500,
                    marginTop: 3,
                    letterSpacing: "0.04em",
                  }}
                >
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div> */}

          {/* Divider */}
          <div
            style={{
              width: 60,
              height: 2,
              borderRadius: 999,
              background:
                "linear-gradient(90deg, transparent, #f472b6, transparent)",
              margin: "0 auto 40px",
            }}
          />

          {/* CTA Button */}
          <Link href="/register-vendor" style={{ textDecoration: "none" }}>
            <motion.button
              whileHover={{ scale: 1.04, y: -3 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "16px 44px",
                borderRadius: 16,
                background: "linear-gradient(135deg, #be185d 0%, #831843 100%)",
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
                border: "1px solid rgba(255,255,255,0.15)",
                cursor: "pointer",
                boxShadow:
                  "0 8px 32px rgba(190,24,93,0.35), 0 2px 8px rgba(0,0,0,0.3)",
                letterSpacing: "0.02em",
                transition: "box-shadow 0.3s",
              }}
            >
              Register as Vendor
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
