// Utility helpers for Indian phone number validation/formatting.
// Returns a normalized +91XXXXXXXXXX string or null if invalid.
export function normalizeIndianPhone(raw = '') {
  const digitsOnly = raw.replace(/[^0-9]/g, '')

  // Strip leading country/zero prefixes
  let local = digitsOnly
  if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
    local = digitsOnly.slice(2)
  } else if (digitsOnly.startsWith('0') && digitsOnly.length === 11) {
    local = digitsOnly.slice(1)
  }

  if (local.length !== 10) return null
  return `+91${local}`
}

export function isValidIndianPhone(raw = '') {
  return normalizeIndianPhone(raw) !== null
}


