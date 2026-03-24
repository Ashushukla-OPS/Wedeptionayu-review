'use client'

import { useEffect } from 'react'

export default function ErrorSuppressor() {
  useEffect(() => {
    // Suppress harmless browser extension errors
    const originalError = console.error
    const originalWarn = console.warn
    
    const shouldSuppress = (message) => {
      const msg = message?.toString() || ''
      return (
        msg.includes('runtime.lastError') ||
        msg.includes('message port closed') ||
        msg.includes('Extension context invalidated') ||
        msg.includes('favicon.ico') ||
        msg.includes('Unchecked runtime.lastError') ||
        msg.includes('The message port closed before a response was received')
      )
    }
    
    console.error = (...args) => {
      // Check all arguments for suppressible messages
      const shouldIgnore = args.some(arg => shouldSuppress(arg))
      if (shouldIgnore) {
        return // Silently ignore
      }
      originalError.apply(console, args)
    }
    
    console.warn = (...args) => {
      // Also suppress warnings with these messages
      const shouldIgnore = args.some(arg => shouldSuppress(arg))
      if (shouldIgnore) {
        return // Silently ignore
      }
      originalWarn.apply(console, args)
    }

    // Also catch unhandled errors
    const handleError = (event) => {
      const message = event.message || event.error?.message || ''
      if (shouldSuppress(message)) {
        event.preventDefault()
        return false
      }
    }
    
    window.addEventListener('error', handleError)
    
    // Cleanup on unmount
    return () => {
      console.error = originalError
      console.warn = originalWarn
      window.removeEventListener('error', handleError)
    }
  }, [])

  return null // This component doesn't render anything
}

