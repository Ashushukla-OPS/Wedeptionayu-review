/** Client-only helpers for Compare feature (localStorage). */

export const COMPARE_IDS_KEY = 'compareVendors'
export const COMPARE_CATEGORY_KEY = 'compareCategory'

export function getCompareIds() {
  if (typeof window === 'undefined') return []
  try {
    const v = JSON.parse(localStorage.getItem(COMPARE_IDS_KEY) || '[]')
    if (!Array.isArray(v)) return []
    return v.slice(0, 3)
  } catch {
    return []
  }
}

export function setCompareIds(ids) {
  if (typeof window === 'undefined') return
  const clamped = (Array.isArray(ids) ? ids : []).slice(0, 3)
  localStorage.setItem(COMPARE_IDS_KEY, JSON.stringify(clamped))
  if (clamped.length === 0) {
    localStorage.removeItem(COMPARE_CATEGORY_KEY)
  }
}

export function getCompareCategory() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(COMPARE_CATEGORY_KEY) || ''
}

export function setCompareCategory(cat) {
  if (typeof window === 'undefined') return
  if (cat) localStorage.setItem(COMPARE_CATEGORY_KEY, String(cat))
  else localStorage.removeItem(COMPARE_CATEGORY_KEY)
}

/**
 * Toggle vendor in compare list (max 3). Enforces same category when adding.
 * @param {string} vendorId
 * @param {string} [vendorCategory]
 * @returns {{ ok: boolean, ids: string[], error?: string, removed?: boolean }}
 */
export function tryToggleCompareVendor(vendorId, vendorCategory) {
  const ids = getCompareIds()
  const incomingCat = (vendorCategory || '').trim()

  if (ids.includes(vendorId)) {
    const next = ids.filter((i) => i !== vendorId)
    setCompareIds(next)
    return { ok: true, ids: next, removed: true }
  }

  if (ids.length >= 3) {
    return { ok: false, ids, error: 'You can compare up to 3 vendors at a time.' }
  }

  const locked = getCompareCategory()
  if (ids.length > 0 && locked && incomingCat && locked !== incomingCat) {
    return {
      ok: false,
      ids,
      error: `Compare only vendors in the same category. Your list is locked to "${locked}". Clear compare to add "${incomingCat}" vendors, or finish comparing first.`
    }
  }

  const next = [...ids, vendorId]
  setCompareIds(next)

  if (ids.length === 0) {
    if (incomingCat) setCompareCategory(incomingCat)
  } else if (!locked && incomingCat) {
    setCompareCategory(incomingCat)
  }

  return { ok: true, ids: next, removed: false }
}

export function clearCompareStorage() {
  if (typeof window === 'undefined') return
  localStorage.setItem(COMPARE_IDS_KEY, JSON.stringify([]))
  localStorage.removeItem(COMPARE_CATEGORY_KEY)
  localStorage.setItem('compareNow', 'false')
}
