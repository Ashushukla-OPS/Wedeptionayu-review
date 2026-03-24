'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Footer from '../../components/Footer'
import { auth, setupRecaptcha, signInWithPhoneNumber } from '../../lib/firebase_client'
import { normalizeIndianPhone } from '../../lib/phone-utils'
import { onAuthStateChanged } from 'firebase/auth'
import {
  VENDOR_CATEGORY_OPTIONS,
  getCategoryConfig
} from '../../lib/vendorRegistrationConfig'

function ProgressBar({ step, total = 7 }) {
  const pct = ((step - 1) / (total - 1)) * 100
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ height: 10, background: '#f3f4f6', borderRadius: 999, overflow: 'hidden' }}>
        <div
          style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#E91E63,#FF4D4D)' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, color: '#6B7280', fontSize: 12 }}>
        <span>Step {step} of {total}</span>
        <span style={{ fontWeight: 700, color: '#111827' }}>{pct.toFixed(0)}%</span>
      </div>
    </div>
  )
}

function MoneyInput({ value, onChange, placeholder }) {
  return (
    <input
      type="number"
      min={0}
      value={value ?? ''}
      onChange={(e) => {
        const raw = e.target.value
        onChange(raw === '' ? '' : Math.max(0, Number(raw)))
      }}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '12px 14px',
        borderRadius: 12,
        border: '1px solid var(--border-light)',
        fontSize: 14
      }}
    />
  )
}

function CategoryStep5({ category, serviceDetails, setServiceDetails, servicePricing, setServicePricing, errors }) {
  const cfg = getCategoryConfig(category)
  if (!cfg) {
    return (
      <div style={{ padding: 16, borderRadius: 14, border: '1px solid #fee2e2', background: '#fff7f7' }}>
        Category not supported for dynamic questions.
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'grid', gap: 18 }}>
        {cfg.detailsFields.map((f) => {
          const v = serviceDetails?.[f.key]
          const keyId = `details-${f.key}`
          const fieldError = errors?.[f.key]

          if (f.type === 'boolean') {
            return (
              <div key={f.key}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6, color: '#111827' }}>
                  {f.question}
                </label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {(f.options || [{ value: true, label: 'Yes' }, { value: false, label: 'No' }]).map((opt) => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setServiceDetails((prev) => ({ ...prev, [f.key]: opt.value }))}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 999,
                        border: '1px solid var(--border-light)',
                        background: v === opt.value ? 'linear-gradient(90deg,#E91E63,#FF4D4D)' : 'white',
                        color: v === opt.value ? 'white' : '#111827',
                        cursor: 'pointer',
                        fontWeight: 800
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {fieldError && <div style={{ marginTop: 6, fontSize: 12, color: '#b91c1c', fontWeight: 700 }}>{fieldError}</div>}
              </div>
            )
          }

          if (f.type === 'number') {
            return (
              <div key={f.key}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6, color: '#111827' }}>
                  {f.question}
                </label>
                <MoneyInput value={v} onChange={(val) => setServiceDetails((prev) => ({ ...prev, [f.key]: val }))} placeholder={f.label} />
                {fieldError && <div style={{ marginTop: 6, fontSize: 12, color: '#b91c1c', fontWeight: 700 }}>{fieldError}</div>}
              </div>
            )
          }

          if (f.type === 'single') {
            return (
              <div key={f.key}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6, color: '#111827' }}>
                  {f.question}
                </label>
                <select
                  id={keyId}
                  value={v ?? ''}
                  onChange={(e) => setServiceDetails((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--border-light)',
                    fontSize: 14,
                    background: 'white'
                  }}
                >
                  <option value="">Select</option>
                  {(f.options || []).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {fieldError && <div style={{ marginTop: 6, fontSize: 12, color: '#b91c1c', fontWeight: 700 }}>{fieldError}</div>}
              </div>
            )
          }

          // text
          return (
            <div key={f.key}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6, color: '#111827' }}>
                {f.question}
              </label>
              <input
                type="text"
                value={v ?? ''}
                onChange={(e) => setServiceDetails((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.label}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--border-light)',
                  fontSize: 14
                }}
              />
              {fieldError && <div style={{ marginTop: 6, fontSize: 12, color: '#b91c1c', fontWeight: 700 }}>{fieldError}</div>}
            </div>
          )
        })}

        <div style={{ height: 1, background: '#E5E7EB', margin: '6px 0' }} />

        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 10 }}>
            Pricing (Category Specific)
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            {cfg.pricingFields.map((f) => {
              const v = servicePricing?.[f.key]
              const fieldError = errors?.[f.key]
              return (
                <div key={f.key}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6, color: '#111827' }}>
                    {f.label}
                  </label>
                  <MoneyInput
                    value={v}
                    onChange={(val) => setServicePricing((prev) => ({ ...prev, [f.key]: val }))}
                    placeholder={f.label}
                  />
                  {fieldError && <div style={{ marginTop: 6, fontSize: 12, color: '#b91c1c', fontWeight: 700 }}>{fieldError}</div>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VendorRegistration7StepForm() {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [cities, setCities] = useState([])
  const [stepErrors, setStepErrors] = useState([])
  const [globalError, setGlobalError] = useState('')

  const [phoneVerified, setPhoneVerified] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const confirmationRef = useRef(null)
  const [authReady, setAuthReady] = useState(false)

  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    business_name: '',
    contact_person: '',
    phone: '',
    whatsapp: '',
    email: '',
    years_experience: '',

    city: '',
    service_areas: [],
    business_address: '',
    outstation_events: false,

    category: '',
    starting_price: '',
    service_details: {},
    service_pricing: {},

    // Step 6
    portfolio_urls: [],
    profile_photo_url: null,

    // Step 7
    brand_description: '',
    deals: '',
    instagram: '',
    facebook: '',
    youtube: ''
  })

  const categoryCfg = useMemo(() => getCategoryConfig(formData.category), [formData.category])

  useEffect(() => {
    // Auth gate + auto-fill from Firebase if phone is already verified.
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/login/vendor')
        return
      }

      try {
        const phoneFromFirebase = user.phoneNumber || ''
        const normalized = phoneFromFirebase ? phoneFromFirebase.replace(/^\+91/, '') : ''
        const isPhoneAlreadyVerified = !!user.phoneNumber

        setFormData((prev) => ({
          ...prev,
          phone: normalized,
          email: prev.email || user.email || '',
          business_name: prev.business_name || '',
          contact_person: prev.contact_person || '',
        }))
        setPhoneVerified(isPhoneAlreadyVerified)

        // If phone exists already, we still sync user so Supabase has phone/role.
        const token = await user.getIdToken()
        await fetch('/api/sync-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            uid: user.uid,
            name: user.displayName || 'User',
            email: user.email || null,
            phone: phoneFromFirebase || null
          })
        })
      } catch (e) {
        console.warn('Auth sync error:', e?.message || e)
      } finally {
        setAuthReady(true)
      }
    })
    return () => unsub()
  }, [router])

  useEffect(() => {
    // Load cities for Step 2 dropdown.
    const load = async () => {
      try {
        const res = await fetch('/api/cities')
        const data = await res.json()
        setCities(data.cities || [])
      } catch (e) {
        console.error('Failed to load cities:', e)
      }
    }
    load()
  }, [])

  useEffect(() => {
    // When category changes, reset dynamic fields to avoid mixing answers.
    setFormData((prev) => ({
      ...prev,
      service_details: {},
      service_pricing: {}
    }))
  }, [formData.category])

  const validateStep1 = () => {
    const errs = []
    if (!formData.business_name.trim()) errs.push('Business Name is required.')
    if (!formData.contact_person.trim()) errs.push('Contact Person Name is required.')
    if (!formData.email.trim()) errs.push('Email Address is required.')
    const normalizedPhone = normalizeIndianPhone(formData.phone || '')
    if (!normalizedPhone) errs.push('Valid Indian Phone Number is required.')
    if (!phoneVerified) errs.push('Please verify your phone number using OTP.')
    return errs
  }

  const validateStep2 = () => {
    const errs = []
    if (!formData.city) errs.push('City is required.')
    // service_areas optional
    return errs
  }

  const validateStep3 = () => {
    const errs = []
    if (!formData.category) errs.push('Please select exactly one service category.')
    return errs
  }

  const validateStep4 = () => {
    const errs = []
    const n = Number(formData.starting_price)
    if (!Number.isFinite(n) || n <= 0) errs.push('Starting price must be greater than 0.')
    return errs
  }

  const validateStep5 = () => {
    const cfg = getCategoryConfig(formData.category)
    const errs = []
    const fieldErrs = {}
    if (!cfg) {
      errs.push('Category is not supported for dynamic questions.')
      return { errs, fieldErrs }
    }

    for (const f of cfg.detailsFields) {
      const v = formData.service_details?.[f.key]
      if (f.type === 'boolean') {
        if (typeof v !== 'boolean') {
          fieldErrs[f.key] = 'Please select Yes/No.'
        }
      } else if (f.type === 'number') {
        const n = Number(v)
        if (!Number.isFinite(n) || n <= 0) {
          fieldErrs[f.key] = 'Enter a valid number greater than 0.'
        }
      } else if (f.type === 'single') {
        if (!v) fieldErrs[f.key] = 'Please select one option.'
      } else {
        // text
        if (!String(v || '').trim()) fieldErrs[f.key] = 'This field is required.'
      }
    }

    for (const f of cfg.pricingFields) {
      const v = formData.service_pricing?.[f.key]
      const n = Number(v)
      if (!Number.isFinite(n) || n <= 0) {
        fieldErrs[f.key] = 'Enter a valid price greater than 0.'
      }
    }

    const hasFieldErrors = Object.keys(fieldErrs).length > 0
    if (hasFieldErrors) errs.push('Please complete all category specific fields.')

    return { errs, fieldErrs }
  }

  const validateStep6 = () => {
    const errs = []
    if (!formData.profile_photo_url) errs.push('Profile photo is required.')
    if (!Array.isArray(formData.portfolio_urls) || formData.portfolio_urls.length < 3) {
      errs.push('Please upload at least 3 portfolio photos.')
    }
    return errs
  }

  const validateStep7 = () => {
    const errs = []
    // About text is required to make profile premium; but keep it flexible.
    if (!formData.brand_description.trim()) errs.push('Please tell us about your services.')
    return errs
  }

  const validateCurrentStep = () => {
    setGlobalError('')
    setStepErrors([])
    let errs = []
    if (step === 1) errs = validateStep1()
    if (step === 2) errs = validateStep2()
    if (step === 3) errs = validateStep3()
    if (step === 4) errs = validateStep4()
    if (step === 5) {
      const v = validateStep5()
      setStepErrors(v.errs)
      return v.fieldErrs ? { ok: v.errs.length === 0, fieldErrs: v.fieldErrs } : { ok: v.errs.length === 0 }
    }
    if (step === 6) errs = validateStep6()
    if (step === 7) errs = validateStep7()
    setStepErrors(errs)
    return { ok: errs.length === 0 }
  }

  const [step5FieldErrors, setStep5FieldErrors] = useState({})

  const handleNext = async () => {
    if (loading) return
    const res = validateCurrentStep()
    if (!res.ok) {
      if (step === 5 && res.fieldErrs) setStep5FieldErrors(res.fieldErrs)
      return
    }
    if (step === 5) setStep5FieldErrors({})
    setStep((s) => Math.min(7, s + 1))
  }

  const handleBack = () => {
    if (loading) return
    setStep((s) => Math.max(1, s - 1))
  }

  const handleSendOtp = async () => {
    if (sendingOtp) return
    const normalizedPhone = normalizeIndianPhone(formData.phone || '')
    if (!normalizedPhone) {
      setStepErrors(['Enter a valid Indian phone number.'])
      return
    }

    try {
      setSendingOtp(true)
      setStepErrors([])
      const verifier = setupRecaptcha('recaptcha-container', { size: 'invisible' })
      if (!verifier) throw new Error('reCAPTCHA verifier not ready')
      confirmationRef.current = await signInWithPhoneNumber(auth, normalizedPhone, verifier)
    } catch (e) {
      console.error('Send OTP error:', e)
      setStepErrors([e?.message || 'Failed to send OTP'])
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!confirmationRef.current) {
      setStepErrors(['OTP session expired. Please resend OTP.'])
      return
    }
    if (verificationCode.length !== 6) {
      setStepErrors(['Enter 6-digit OTP code.'])
      return
    }
    try {
      setStepErrors([])
      setLoading(true)
      const result = await confirmationRef.current.confirm(verificationCode)
      if (result?.user) {
        const phoneE164 = result.user.phoneNumber || normalizeIndianPhone(formData.phone)
        const digits = phoneE164 ? phoneE164.replace(/^\+91/, '') : formData.phone

        const token = await result.user.getIdToken()
        await fetch('/api/sync-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            uid: result.user.uid,
            name: result.user.displayName || 'User',
            email: result.user.email || null,
            phone: phoneE164 || null
          })
        })

        setFormData((prev) => ({ ...prev, phone: digits }))
        setPhoneVerified(true)
        setVerificationCode('')
      } else {
        setStepErrors(['OTP verification failed.'])
      }
    } catch (e) {
      console.error('OTP verify error:', e)
      setStepErrors([e?.message || 'OTP verification failed.'])
    } finally {
      setLoading(false)
    }
  }

  const getToken = async () => {
    const user = auth.currentUser
    if (!user) throw new Error('Not authenticated')
    return await user.getIdToken(true)
  }

  const uploadImageFiles = async (files) => {
    const token = await getToken()
    const urls = []

    setGlobalError('')
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload-file', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Upload failed')
      urls.push(data.publicUrl)
    }
    return urls
  }

  const handleSubmit = async () => {
    setGlobalError('')
    setStepErrors([])

    const step1Errs = validateStep1()
    const step2Errs = validateStep2()
    const step3Errs = validateStep3()
    const step4Errs = validateStep4()
    const step5 = validateStep5()
    const step6Errs = validateStep6()
    const step7Errs = validateStep7()

    const errs = [
      ...step1Errs,
      ...step2Errs,
      ...step3Errs,
      ...step4Errs,
      ...step5.errs,
      ...step6Errs,
      ...step7Errs
    ]
    if (errs.length > 0) {
      setStepErrors(errs)
      if (step5?.fieldErrs) setStep5FieldErrors(step5.fieldErrs)
      return
    }

    try {
      setLoading(true)
      const normalizedPhone = normalizeIndianPhone(formData.phone || '')
      const payload = {
        business_name: formData.business_name,
        contact_person: formData.contact_person,
        phone: normalizedPhone,
        whatsapp: formData.whatsapp || null,
        email: formData.email,
        years_experience: formData.years_experience || null,

        city: formData.city,
        service_areas: formData.service_areas,
        business_address: formData.business_address || null,
        outstation_events: !!formData.outstation_events,

        category: formData.category,
        starting_price: formData.starting_price,

        service_details: formData.service_details,
        service_pricing: {
          ...formData.service_pricing,
          starting_price: Number(formData.starting_price)
        },

        brand_description: formData.brand_description,
        deals: formData.deals || null,
        instagram: formData.instagram || null,
        facebook: formData.facebook || null,
        youtube: formData.youtube || null,

        portfolio_urls: formData.portfolio_urls,
        profile_photo_url: formData.profile_photo_url
      }

      const token = await getToken()
      const res = await fetch('/api/register-vendor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Registration failed')

      alert('Vendor registration successful! Your profile is verified.')
      router.push('/vendor/dashboard')
    } catch (e) {
      console.error('Submit error:', e)
      setGlobalError(e?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const stepTitle = useMemo(() => {
    if (step === 1) return 'Basic Information'
    if (step === 2) return 'Location Details'
    if (step === 3) return 'Services Selection'
    if (step === 4) return 'Pricing (Common)'
    if (step === 5) return 'Category Details & Pricing'
    if (step === 6) return 'Portfolio'
    return 'About + Social'
  }, [step])

  const stepSub = useMemo(() => {
    if (step === 1) return 'Premium profile starts with your core details.'
    if (step === 2) return 'Help customers find you across locations.'
    if (step === 3) return 'Choose exactly one category.'
    if (step === 4) return 'Set your starting price to build trust.'
    if (step === 5) return 'Answer questions based on your category.'
    if (step === 6) return 'Upload at least 3 photos to impress customers.'
    return 'Add your story and social links.'
  }, [step])

  const stepsList = [
    'Basic',
    'Location',
    'Services',
    'Pricing',
    'Details',
    'Portfolio',
    'About'
  ]

  if (!authReady) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-cream)' }}>
        <div className="container" style={{ maxWidth: 820, margin: '0 auto', padding: '80px 20px' }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            Loading...
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-cream)' }}>
      <div className="container" style={{ maxWidth: 900, margin: '0 auto', padding: '70px 20px' }}>
        <div
          className="card"
          style={{
            background: 'white',
            borderRadius: 18,
            padding: 'clamp(16px, 4vw, 28px)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.06)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 14, color: '#E91E63', fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                Vendor Registration
              </div>
              <h1 style={{ margin: '8px 0 6px', fontSize: 28, fontWeight: 950, color: '#111827' }}>
                {stepTitle}
              </h1>
              <div style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.6 }}>
                {stepSub}
              </div>
            </div>

            <div style={{ minWidth: 190 }}>
              <div style={{ display: 'grid', gap: 8 }}>
                {stepsList.map((t, idx) => {
                  const s = idx + 1
                  const active = s === step
                  const done = s < step
                  return (
                    <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 999,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 950,
                          fontSize: 13,
                          background: active
                            ? 'linear-gradient(90deg,#E91E63,#FF4D4D)'
                            : done
                              ? '#10b981'
                              : '#E5E7EB',
                          color: active || done ? 'white' : '#6B7280'
                        }}
                      >
                        {done ? '✓' : s}
                      </div>
                      <div style={{ fontSize: 13, color: active ? '#111827' : '#6B7280', fontWeight: active ? 800 : 600 }}>
                        {t}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <ProgressBar step={step} total={7} />

          {globalError && (
            <div style={{ marginBottom: 14, padding: 14, borderRadius: 14, border: '1px solid #fee2e2', background: '#fff7f7', color: '#b91c1c', fontWeight: 800 }}>
              {globalError}
            </div>
          )}

          {stepErrors.length > 0 && (
            <div style={{ marginBottom: 14, padding: 14, borderRadius: 14, border: '1px solid #fee2e2', background: '#fff7f7' }}>
              {stepErrors.map((e, i) => (
                <div key={i} style={{ color: '#b91c1c', fontSize: 13, fontWeight: 800 }}>
                  {e}
                </div>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {/* STEP 1 */}
              {step === 1 && (
                <div style={{ display: 'grid', gap: 18 }}>
                  <div className="vendor-form-grid">
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 900, marginBottom: 6, color: '#111827' }}>
                        Business Name *
                      </label>
                      <input
                        value={formData.business_name}
                        onChange={(e) => setFormData((p) => ({ ...p, business_name: e.target.value }))}
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-light)', fontSize: 14 }}
                        placeholder="e.g., Royal Decor"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 900, marginBottom: 6, color: '#111827' }}>
                        Contact Person Name *
                      </label>
                      <input
                        value={formData.contact_person}
                        onChange={(e) => setFormData((p) => ({ ...p, contact_person: e.target.value }))}
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-light)', fontSize: 14 }}
                        placeholder="Full name"
                      />
                    </div>
                  </div>

                  <div className="vendor-form-grid">
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 900, marginBottom: 6, color: '#111827' }}>
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-light)', fontSize: 14 }}
                        placeholder="business@example.com"
                      />
                    </div>
                  </div>

                  <div className="vendor-form-grid">
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 900, marginBottom: 6, color: '#111827' }}>
                        Phone Number *
                      </label>

                      <div style={{ display: 'flex', gap: 10 }}>
                        <input
                          type="tel"
                          value={(formData.phone || '').replace(/^\+91/, '')}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 10)
                            setFormData((p) => ({ ...p, phone: digits }))
                            setPhoneVerified(false)
                          }}
                          disabled={phoneVerified}
                          style={{
                            flex: 1,
                            padding: '12px 14px',
                            borderRadius: 12,
                            border: '1px solid var(--border-light)',
                            fontSize: 14,
                            background: phoneVerified ? '#f3f4f6' : 'white'
                          }}
                          placeholder="9876543210"
                        />
                      </div>

                      <div style={{ marginTop: 10 }}>
                        {phoneVerified ? (
                          <div style={{ color: '#059669', fontWeight: 900 }}>✓ Phone verified</div>
                        ) : (
                          <div style={{ color: '#E91E63', fontWeight: 900 }}>Phone not verified (OTP required)</div>
                        )}
                      </div>

                      {!phoneVerified && (
                        <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={handleSendOtp}
                              disabled={sendingOtp}
                            >
                              {sendingOtp ? 'Sending OTP...' : 'Send OTP'}
                            </button>
                            <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 700 }}>
                              We will send OTP to your phone.
                            </div>
                          </div>

                          <div id="recaptcha-container" />

                          <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Enter 6-digit OTP"
                            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-light)', fontSize: 14 }}
                          />
                          <button type="button" className="btn-primary" onClick={handleVerifyOtp} disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify OTP'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 900, marginBottom: 6, color: '#111827' }}>
                        WhatsApp Number (Optional)
                      </label>
                      <input
                        type="tel"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData((p) => ({ ...p, whatsapp: e.target.value.replace(/[^0-9+]/g, '') }))}
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-light)', fontSize: 14 }}
                        placeholder="9876543210"
                      />

                      <div style={{ height: 10 }} />

                      <label style={{ display: 'block', fontSize: 12, fontWeight: 900, marginBottom: 6, color: '#111827' }}>
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formData.years_experience}
                        onChange={(e) => setFormData((p) => ({ ...p, years_experience: e.target.value }))}
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-light)', fontSize: 14 }}
                        placeholder="e.g., 5"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div style={{ display: 'grid', gap: 18 }}>
                  <div className="vendor-form-grid">
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 900, marginBottom: 6, color: '#111827' }}>
                        City *
                      </label>
                      <select
                        value={formData.city}
                        onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-light)', fontSize: 14, background: 'white' }}
                      >
                        <option value="">Select City</option>
                        {cities.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 900, marginBottom: 6, color: '#111827' }}>
                        Available for Outstation Events *
                      </label>
                      <select
                        value={formData.outstation_events ? 'yes' : 'no'}
                        onChange={(e) => setFormData((p) => ({ ...p, outstation_events: e.target.value === 'yes' }))}
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-light)', fontSize: 14, background: 'white' }}
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 900, marginBottom: 6, color: '#111827' }}>
                      Service Areas
                    </label>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                      {formData.service_areas.map((a, idx) => (
                        <span
                          key={`${a}-${idx}`}
                          style={{
                            background: '#fff1f2',
                            color: '#E91E63',
                            border: '1px solid #fecdd3',
                            padding: '8px 10px',
                            borderRadius: 999,
                            fontWeight: 900,
                            fontSize: 12,
                            display: 'inline-flex',
                            gap: 8,
                            alignItems: 'center'
                          }}
                        >
                          {a}
                          <button
                            type="button"
                            onClick={() => setFormData((p) => ({ ...p, service_areas: p.service_areas.filter((_, i) => i !== idx) }))}
                            style={{ border: 'none', background: 'transparent', color: '#E91E63', cursor: 'pointer', fontWeight: 950 }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {formData.service_areas.length === 0 && (
                        <span style={{ color: '#6B7280', fontWeight: 700, fontSize: 13 }}>Add your city/areas below.</span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Type areas and press Enter (e.g., Bhopal, Indore)"
                      onKeyDown={(e) => {
                        const val = e.target.value
                        if (e.key === 'Enter' && val.trim()) {
                          e.preventDefault()
                          const parts = val.split(',').map((s) => s.trim()).filter(Boolean)
                          setFormData((p) => {
                            const merged = [...p.service_areas]
                            for (const part of parts) {
                              if (!merged.includes(part)) merged.push(part)
                            }
                            return { ...p, service_areas: merged }
                          })
                          e.currentTarget.value = ''
                        }
                      }}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-light)', fontSize: 14 }}
                    />
                    <div style={{ marginTop: 10, fontSize: 12, color: '#6B7280', fontWeight: 700 }}>
                      Tip: press Enter after typing each area (or comma-separated list).
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 900, marginBottom: 6, color: '#111827' }}>
                      Full Address
                    </label>
                    <textarea
                      rows={3}
                      value={formData.business_address}
                      onChange={(e) => setFormData((p) => ({ ...p, business_address: e.target.value }))}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-light)', fontSize: 14, resize: 'vertical' }}
                      placeholder="Complete address (optional)"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div style={{ color: '#6B7280', fontSize: 13, fontWeight: 700 }}>
                    Choose only one category.
                  </div>
                  <div className="vendor-form-grid">
                    {VENDOR_CATEGORY_OPTIONS.map((c) => {
                      const active = formData.category === c.value
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, category: c.value }))}
                          style={{
                            padding: 16,
                            borderRadius: 16,
                            border: active ? '2px solid #E91E63' : '1px solid var(--border-light)',
                            background: active ? 'linear-gradient(135deg,#fff1f2,#fff)' : 'white',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 12, background: active ? '#E91E63' : '#F3F4F6', color: active ? 'white' : '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950 }}>
                              {c.icon}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 950, color: '#111827' }}>
                              {c.value}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* STEP 4 */}
              {step === 4 && (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#111827' }}>
                    What is your starting price for your services?
                  </div>
                  <MoneyInput
                    value={formData.starting_price}
                    onChange={(val) => setFormData((p) => ({ ...p, starting_price: val }))}
                    placeholder="Enter amount in INR"
                  />
                  <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 700 }}>
                    This helps customers filter and compare vendors quickly.
                  </div>
                </div>
              )}

              {/* STEP 5 */}
              {step === 5 && (
                <div style={{ display: 'grid', gap: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 950, color: '#111827' }}>
                    Category: {formData.category}
                  </div>
                  <CategoryStep5
                    category={formData.category}
                    serviceDetails={formData.service_details}
                    setServiceDetails={(fn) => {
                      setFormData((prev) => ({ ...prev, service_details: typeof fn === 'function' ? fn(prev.service_details) : fn }))
                    }}
                    servicePricing={formData.service_pricing}
                    setServicePricing={(fn) => {
                      setFormData((prev) => ({ ...prev, service_pricing: typeof fn === 'function' ? fn(prev.service_pricing) : fn }))
                    }}
                    errors={step5FieldErrors}
                  />
                </div>
              )}

              {/* STEP 6 */}
              {step === 6 && (
                <div style={{ display: 'grid', gap: 18 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 950, color: '#111827', marginBottom: 6 }}>
                      Upload at least 3 photos of your work
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 700 }}>
                      Photos that show your quality and style get more bookings.
                    </div>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={async (e) => {
                      try {
                        const files = Array.from(e.target.files || [])
                        if (files.length === 0) return
                        if (files.some((f) => f.size > 10 * 1024 * 1024)) {
                          setStepErrors(['Each photo must be <= 10MB.'])
                          return
                        }
                        setLoading(true)
                        const urls = await uploadImageFiles(files)
                        setFormData((p) => ({ ...p, portfolio_urls: [...p.portfolio_urls, ...urls] }))
                      } catch (e2) {
                        setGlobalError(e2?.message || 'Upload failed.')
                      } finally {
                        setLoading(false)
                      }
                    }}
                    style={{}}
                    disabled={loading}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                    {(formData.portfolio_urls || []).map((url, idx) => (
                      <div key={`${url}-${idx}`} style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #E5E7EB', position: 'relative' }}>
                        <img src={url} alt={`Portfolio ${idx + 1}`} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, portfolio_urls: p.portfolio_urls.filter((_, i) => i !== idx) }))}
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            width: 28,
                            height: 28,
                            borderRadius: 999,
                            border: 'none',
                            background: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 950
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={{ height: 6 }} />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 950, color: '#111827', marginBottom: 6 }}>
                        Upload your profile photo
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          try {
                            if (file.size > 10 * 1024 * 1024) {
                              setStepErrors(['Profile photo must be <= 10MB.'])
                              return
                            }
                            setLoading(true)
                            const urls = await uploadImageFiles([file])
                            setFormData((p) => ({ ...p, profile_photo_url: urls[0] || null }))
                          } catch (e2) {
                            setGlobalError(e2?.message || 'Upload failed.')
                          } finally {
                            setLoading(false)
                          }
                        }}
                        disabled={loading}
                      />
                      {formData.profile_photo_url && (
                        <div style={{ marginTop: 12 }}>
                          <img src={formData.profile_photo_url} alt="Profile" style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 18, border: '1px solid #E5E7EB' }} />
                        </div>
                      )}
                    </div>

                    <div style={{ padding: 14, borderRadius: 14, border: '1px solid #E5E7EB', background: '#fafafa' }}>
                      <div style={{ fontWeight: 950, color: '#111827', marginBottom: 6 }}>Upload checklist</div>
                      <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 700, lineHeight: 1.7 }}>
                        <div>- Portfolio photos: {formData.portfolio_urls.length} / 3</div>
                        <div>- Profile photo: {formData.profile_photo_url ? 'Added' : 'Missing'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 7 */}
              {step === 7 && (
                <div style={{ display: 'grid', gap: 18 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 900, marginBottom: 6, color: '#111827' }}>
                      Tell us about your services *
                    </label>
                    <textarea
                      rows={4}
                      value={formData.brand_description}
                      onChange={(e) => setFormData((p) => ({ ...p, brand_description: e.target.value }))}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-light)', fontSize: 14, resize: 'vertical' }}
                      placeholder="Describe your services, experience, and what makes you different."
                    />
                  </div>

                  <div className="vendor-form-grid">
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 900, marginBottom: 6, color: '#111827' }}>
                        Instagram (optional)
                      </label>
                      <input
                        value={formData.instagram}
                        onChange={(e) => setFormData((p) => ({ ...p, instagram: e.target.value }))}
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-light)', fontSize: 14 }}
                        placeholder="@yourhandle"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 900, marginBottom: 6, color: '#111827' }}>
                        Facebook (optional)
                      </label>
                      <input
                        value={formData.facebook}
                        onChange={(e) => setFormData((p) => ({ ...p, facebook: e.target.value }))}
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-light)', fontSize: 14 }}
                        placeholder="Facebook page URL"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 900, marginBottom: 6, color: '#111827' }}>
                      YouTube (optional)
                    </label>
                    <input
                      value={formData.youtube}
                      onChange={(e) => setFormData((p) => ({ ...p, youtube: e.target.value }))}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-light)', fontSize: 14 }}
                      placeholder="https://youtube.com/@yourchannel"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 900, marginBottom: 6, color: '#111827' }}>
                      Current offers or discounts? (optional)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.deals}
                      onChange={(e) => setFormData((p) => ({ ...p, deals: e.target.value }))}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-light)', fontSize: 14, resize: 'vertical' }}
                      placeholder="e.g., 10% off on bookings before March 2026."
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Bottom navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 26, gap: 14 }}>
            <button type="button" className="btn-secondary" onClick={handleBack} disabled={step === 1 || loading}>
              Back
            </button>
            {step < 7 ? (
              <button type="button" className="btn-primary" onClick={handleNext} disabled={loading}>
                {loading ? 'Please wait...' : 'Next'}
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Registration'}
              </button>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

