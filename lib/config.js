// Configuration file with all API keys
// These are used as fallbacks if environment variables are not set

export const supabaseConfig = {
  // Prefer env vars; fall back to defaults for local dev
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://asnvudnxpjrirfpmalym.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzbnZ1ZG54cGpyaXJmcG1hbHltIiwicm9zZSI6ImFub24iLCJpYXQiOjE3NjUxMDk5MTMsImV4cCI6MjA4MDY4NTkxM30.uNDr-H7W7S4ZH7TOcorfxK3OwP8a2TYRMmsIrDhDguc',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzbnZ1ZG54cGpyaXJmcG1hbHltIiwicm9zZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTEwOTkxMywiZXhwIjoyMDgwNjg1OTEzfQ.I3jRxEhiy7bRSTfTEsr0-DtxYphsd7bT0snpotV9y5w'
}

export const firebaseConfig = {
  // Prefer env vars so you can override per environment; fall back to your new Firebase project.
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAvgvukRL5rebAwXUsLH9XPAh0M8CDSSuo',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'wedeption-a40a0.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'wedeption-a40a0',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'wedeption-a40a0.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '451391554226',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:451391554226:web:eed3a7f18d96b74fc33fab',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined
}

