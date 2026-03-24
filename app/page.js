'use client'

import Hero from '../components/Hero';
import VendorCard from '../components/VendorCard';
import Footer from '../components/Footer';
import PopularSearches from '../components/PopularSearches';
import InspirationToLookFor from '../components/InspirationToLookFor';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

export default function HomePage() {
  const [popularVendors, setPopularVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedVendorCategory, setSelectedVendorCategory] = useState('All');
  const venueScrollRef = useRef(null);
  const vendorScrollRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchData();
    // Attempt to get user location
    if (navigator.geolocation && !localStorage.getItem('selectedCity')) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state_district;
            if (city) {
              handleCityChange(city);
            }
          } catch (e) {
            console.error('Failed to get city from coordinates');
          }
        },
        () => { }
      );
    }
  }, []);

  const fetchData = async () => {
    try {
      const [vendorsRes, categoriesRes, citiesRes] = await Promise.all([
        fetch('/api/vendors?sort_by=popular&limit=16'),
        fetch('/api/categories'),
        fetch('/api/cities')
      ]);

      const vendorsData = await vendorsRes.json();
      const categoriesData = await categoriesRes.json();
      const citiesData = await citiesRes.json();

      if (vendorsRes.ok) {
        setPopularVendors(vendorsData.vendors || []);
      }

      if (categoriesRes.ok) {
        setCategories(categoriesData.categories || []);
      }

      if (citiesRes.ok) {
        setCities(citiesData.cities || []);
      }
    } catch (err) {
      // Silently handle network errors - don't spam console
      if (err.name !== 'TypeError' || !err.message.includes('fetch')) {
        console.error('Failed to fetch data:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = (city) => {
    setSelectedCity(city);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedCity', city);
    }
  };

  const scrollCarousel = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = 400;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Popular Venue Searches Data
  const venueSearches = [
    {
      title: '4 Star & Above Wedding Hotels',
      subcategory: '4 Star & Above Wedding Hotels',
      locations: ['Mumbai', 'Bangalore', 'Pune'],
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      gradient: 'linear-gradient(135deg, #FFE8ED 0%, #FFF5F7 100%)'
    },
    {
      title: 'Banquet Halls',
      subcategory: 'Banquet Halls',
      locations: ['Mumbai', 'Bangalore', 'Pune'],
      image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80',
      gradient: 'linear-gradient(135deg, #FFF5F7 0%, #FFE8ED 100%)'
    },
    {
      title: 'Marriage Garden / Lawns',
      subcategory: 'Marriage Garden / Lawns',
      locations: ['Mumbai', 'Bangalore', 'Pune'],
      image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80',
      gradient: 'linear-gradient(135deg, #FFE8ED 0%, #FFF5F7 100%)'
    },
    {
      title: 'Resort Wedding Venues',
      subcategory: 'Resort Wedding Venues',
      locations: ['Mumbai', 'Bangalore', 'Pune'],
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      gradient: 'linear-gradient(135deg, #FFF5F7 0%, #FFE8ED 100%)'
    },
    {
      title: 'Beach Wedding Venues',
      subcategory: 'Beach Wedding Venues',
      locations: ['Mumbai', 'Goa', 'Pune'],
      image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80',
      gradient: 'linear-gradient(135deg, #FFE8ED 0%, #FFF5F7 100%)'
    }
  ];

  const categoryIcons = {
    'Venues': '🏛️',
    'Photographers': '📸',
    'Caterers': '🍽️',
    'Decorators': '🎨',
    'Makeup Artists': '💄',
    'Entertainment': '🎵',
    'Videographers': '🎥',
    'Mehendi Artists': '🎨',
    'DJs': '🎧',
    'Bands': '🎸',
    'Music & Entertainment': '🎵',
    'Choreographers': '💃',
    'Cake Artists': '🎂',
    'Bartenders': '🍸',
    'Invitation Designers': '✉️',
    'Gifts & Favours': '🎁',
    'Bridal Wear': '👗',
    'Groom Wear': '👔',
    'Clothes Designers': '✂️',
    'Jewellery': '💍',
    'Accessories': '👑',
    'Pandits/Priests': '🕉️',
    'Transportation': '🚗',
    'Honeymoon Packages': '✈️',
    'Entertainment Artists': '🎭'
  };

  const filteredPopularVendors = popularVendors.filter(v => {
    const matchesCategory = selectedVendorCategory === 'All' || v.category === selectedVendorCategory;
    const matchesCity = selectedCity ? (v.city && v.city.toLowerCase() === selectedCity.toLowerCase()) : true;
    return matchesCategory && matchesCity;
  });

  return (
    <div style={{ minHeight: '100vh' }}>
      <Hero selectedCity={selectedCity} onCityChange={handleCityChange} />

      {/* Popular Searches Section */}
      <PopularSearches selectedCity={selectedCity} cities={cities} />

      {/* Popular Vendors Section */}
      <section className="home-section" style={{ background: '#fff9fb' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'end',
              marginBottom: 32,
              flexWrap: 'wrap',
              gap: 20
            }}
          >
            <div>
              <h2 className="home-section-title" style={{
                fontSize: 'clamp(26px, 4vw, 36px)',
                marginBottom: 8,
                color: 'var(--text-dark)'
              }}>
                Popular Vendors {selectedCity ? `in ${selectedCity}` : ''}
              </h2>
              <p className="home-section-subtitle" style={{
                fontSize: 15,
                color: 'var(--text-muted)',
                margin: 0
              }}>
                Handpicked premium vendors for your special day
              </p>
            </div>
            <Link href="/vendors" className="btn-secondary view-all-btn" style={{
              borderRadius: '10px'
            }}>
              View All
            </Link>
          </motion.div>

          {/* Category Filters */}
          <div style={{
            display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16, marginBottom: 24,
            scrollbarWidth: 'none', msOverflowStyle: 'none'
          }} className="hide-scrollbar">
            {(categories.length > 0 ? ['All', ...categories.map(c => c.name)] : ['All', 'Venues', 'Photographers', 'Makeup Artists', 'Decorators', 'Mehendi Artists']).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedVendorCategory(cat)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '20px',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  background: selectedVendorCategory === cat ? 'var(--accent-rose)' : 'white',
                  color: selectedVendorCategory === cat ? 'white' : 'var(--text-dark)',
                  border: selectedVendorCategory === cat ? 'none' : '1px solid var(--border-light)',
                  boxShadow: selectedVendorCategory === cat ? '0 4px 12px rgba(233,30,99,0.2)' : '0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--text-muted)'
            }}>
              Loading vendors...
            </div>
          ) : filteredPopularVendors.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--text-muted)'
            }}>
              No vendors found in this category for {selectedCity || 'your area'}.
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <div
                ref={vendorScrollRef}
                className="popular-vendors-grid hide-scrollbar"
              >
                {filteredPopularVendors.map((vendor, idx) => (
                    vendor && vendor.id ? (
                      <motion.div
                        key={vendor.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                      >
                        <VendorCard v={vendor} />
                      </motion.div>
                    ) : null
                  ))}
              </div>

              {/* Scroll Controls */}
              <button
                className="popular-vendors-scroll-btn"
                onClick={() => scrollCarousel(vendorScrollRef, 'left')}
                style={{
                  position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)',
                  width: 44, height: 44, borderRadius: '50%', background: 'white', border: '1px solid #eee',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 10, transition: 'all 0.2s', color: 'var(--text-dark)'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
              >
                ←
              </button>
              <button
                className="popular-vendors-scroll-btn"
                onClick={() => scrollCarousel(vendorScrollRef, 'right')}
                style={{
                  position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)',
                  width: 44, height: 44, borderRadius: '50%', background: 'white', border: '1px solid #eee',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 10, transition: 'all 0.2s', color: 'var(--text-dark)'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
              >
                →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="home-section" style={{
        margin: '0',
        background: 'linear-gradient(135deg, #be185d 0%, #831843 100%)',
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'url(https://www.transparenttextures.com/patterns/cubes.png)', opacity: 0.1 }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="home-section-title" style={{
              fontSize: 'clamp(32px, 5vw, 48px)',
              marginBottom: 24,
              color: 'white'
            }}>
              Join Wedeption to Upscale Your Business
            </h2>
            <p className="home-section-subtitle" style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              marginBottom: 40,
              opacity: 0.95,
              maxWidth: '600px',
              margin: '0 auto 40px',
              color: 'white'
            }}>
              Partner with us and get discovered by thousands of couples looking for top vendors.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/register-vendor" style={{
                background: 'white',
                color: 'var(--accent-rose)',
                padding: '16px 32px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: 16,
                textDecoration: 'none',
                border: '2px solid white',
                transition: 'all 0.3s ease'
              }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = 'var(--shadow-xl)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = 'var(--shadow-lg)'
                }}
              >
                Register as Vendor
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Inspiration to Look for Section */}
      <InspirationToLookFor />

      {/* Compare Banner */}
      <section className="home-section" style={{ background: '#fff' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
              borderRadius: '24px',
              padding: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 32,
              boxShadow: '0 20px 40px rgba(49,46,129,0.2)'
            }}
          >
            <div style={{ flex: '1 1 400px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', borderRadius: '100px',
                background: 'rgba(255,255,255,0.1)', color: '#e0e7ff',
                fontSize: 13, fontWeight: 700, letterSpacing: '0.05em',
                marginBottom: 16
              }}>
                ⚖️ SMART TOOLS
              </div>
              <h2 className="home-section-title" style={{ fontSize: 'clamp(32px, 4vw, 44px)', color: '#fff', margin: '0 0 16px' }}>
                Compare Vendors Side-by-Side
              </h2>
              <p className="home-section-subtitle" style={{ fontSize: 17, color: '#c7d2fe', margin: 0, maxWidth: 500 }}>
                Can't decide? Add up to 3 vendors to your comparison list and evaluate their pricing, ratings, and features in one clear view.
              </p>
            </div>

            <Link href="/compare" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '16px 36px', borderRadius: '16px',
                background: '#fff', color: '#1e1b4b',
                fontSize: 16, fontWeight: 700,
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                transition: 'all 0.25s'
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)' }}
              >
                Go to Compare Tool
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* App Coming Soon Section */}
      <section className="home-section" style={{
        background: 'white',
      }}>
        <div className="container" style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
              borderRadius: '24px',
              padding: 'clamp(30px, 5vw, 60px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 40,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '140%', background: 'radial-gradient(circle, rgba(233,30,99,0.15) 0%, transparent 70%)', zIndex: 0 }} />

            <div style={{ flex: '1 1 400px', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(255,255,255,0.1)', color: '#fbcfe8', borderRadius: '100px', fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 20 }}>
                📱 GET THE APP
              </div>
              <h2 className="home-section-title" style={{ fontSize: 'clamp(28px, 4vw, 40px)', color: '#fff', marginBottom: 16 }}>
                Plan Your Wedding <span style={{ color: '#fbcfe8' }}>On The Go</span>
              </h2>
              <p className="home-section-subtitle" style={{ fontSize: 16, color: '#9ca3af', marginBottom: 32, maxWidth: 400 }}>
                Save your favorite vendors, manage checklists, and get inspired anytime, anywhere with the Wedeption app.
              </p>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <button style={{
                  background: 'white', color: '#111827', border: 'none', borderRadius: '12px',
                  padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                  transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                  onClick={() => alert('iOS App Coming Soon!')}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.42 20.91c-1.16.85-2.36.85-3.5 0-1.53-1.12-2.99-2.2-4.13-3.07C6.07 16.51 5 15.39 5 13.92V9c0-1.1.9-2 2-2h1c.55 0 1 .45 1 1v4.5A2.5 2.5 0 0 0 11.5 15c.55 0 1.05.2 1.46.54l1.55 1.25V5c0-1.1.9-2 2-2s2 .9 2 2v10.59l1.66 1.35c.74.6 1.83.6 2.57 0 .14-.11.23-.28.23-.46v-1.1c0-.44-.21-.86-.56-1.13L16 11.6V5c0-1.1-.9-2-2-2z" style={{ display: 'none' }} />
                    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.54 6.87 18.31 7.09 19.46 8.78C19.36 8.84 17.5 9.94 17.53 12.13C17.56 14.73 19.78 15.58 19.85 15.62C19.79 15.79 19.26 17.65 18.71 19.5ZM12.02 4.67C12.72 3.82 13.19 2.65 13.06 1.48C12.03 1.52 10.79 2.17 10.07 3.01C9.44 3.76 8.88 4.96 9.03 6.1C10.18 6.19 11.32 5.52 12.02 4.67Z" />
                  </svg>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 600 }}>Download on the</div>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>App Store</div>
                  </div>
                </button>
                <button style={{
                  background: 'white', color: '#111827', border: 'none', borderRadius: '12px',
                  padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                  transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                  onClick={() => alert('Android App Coming Soon!')}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.52 14.65L14.78 13.09L13.15 14.74L17.55 17.29C17.64 17.34 17.75 17.3 17.79 17.21L17.52 14.65V14.65ZM19.64 10.35C19.82 10.45 19.98 10.58 20.1 10.74L21.78 11.7C21.93 11.79 22 11.97 22 12.15C22 12.33 21.93 12.51 21.78 12.6L20.1 13.56C19.98 13.72 19.82 13.85 19.64 13.95L19.46 12.15L19.64 10.35V10.35ZM11.08 12.67L5.58 18.06C5.45 18.19 5.38 18.37 5.4 18.55L11.58 15L11.08 12.67V12.67ZM11.08 11.63V9.3L11.58 6.3L5.4 2.75C5.38 2.93 5.45 3.11 5.58 3.24L11.08 11.63V11.63ZM13.15 9.56V11.2V14.74L14.78 13.09L13.15 9.56V9.56Z" />
                    <path d="M4.33 2.1C4.1 2.21 3.93 2.42 3.87 2.66V21.64C3.93 21.88 4.1 22.09 4.33 22.2L11 15L4.33 2.1Z" />
                  </svg>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 600 }}>GET IT ON</div>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>Google Play</div>
                  </div>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20, position: 'relative', zIndex: 1, alignItems: 'center' }}>
              <img
                src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80"
                alt="Wedeption Mobile App Mockup"
                style={{
                  width: 'auto',
                  height: '320px',
                  borderRadius: '32px',
                  border: '8px solid white',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
