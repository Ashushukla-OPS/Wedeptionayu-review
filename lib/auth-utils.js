// Authentication utilities for client-side
import { auth } from './firebase_client'
import { onAuthStateChanged } from 'firebase/auth'

/**
 * Get current user's Firebase token
 */
export async function getAuthToken() {
  const user = auth.currentUser
  if (!user) {
    throw new Error('User not authenticated')
  }
  return await user.getIdToken()
}

/**
 * Sync current user to Supabase
 */
export async function syncUserToSupabase() {
  const user = auth.currentUser
  if (!user) {
    return null
  }
  
  try {
    const token = await user.getIdToken()
    const response = await fetch('/api/sync-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        phone: user.phoneNumber
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to sync user')
    }
    
    const data = await response.json()
    return data.user
  } catch (error) {
    console.error('Error syncing user:', error)
    return null
  }
}

/**
 * Wait for authentication state
 */
export function waitForAuth() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return auth.currentUser !== null
}

/**
 * Get current user
 */
export function getCurrentUser() {
  return auth.currentUser
}

