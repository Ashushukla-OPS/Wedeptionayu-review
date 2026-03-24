'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function VenuesPage() {
  const router = useRouter()

  useEffect(() => {
    // Immediately redirect to vendors page with Venues category filter
    router.replace('/vendors?category=Venues')
  }, [router])

  // Return null to avoid flash of content
  return null
}
