import type { ConfirmationResult } from 'firebase/auth'

export {}

declare global {
  interface Window {
    confirmationResult?: ConfirmationResult | null
  }
}
