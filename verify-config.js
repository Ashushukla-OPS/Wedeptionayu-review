// Configuration Verification Script
// Run: node verify-config.js

const requiredEnvVars = {
  'NEXT_PUBLIC_SUPABASE_URL': 'https://asnvudnxpjrirfpmalym.supabase.co',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzbnZ1ZG54cGpyaXJmcG1hbHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDk5MTMsImV4cCI6MjA4MDY4NTkxM30.uNDr-H7W7S4ZH7TOcorfxK3OwP8a2TYRMmsIrDhDguc',
  'SUPABASE_SERVICE_ROLE_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzbnZ1ZG54cGpyaXJmcG1hbHltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTEwOTkxMywiZXhwIjoyMDgwNjg1OTEzfQ.I3jRxEhiy7bRSTfTEsr0-DtxYphsd7bT0snpotV9y5w',
  'NEXT_PUBLIC_FIREBASE_API_KEY': 'AIzaSyA5mbNhlinSBJn3_EoyWNg-HYarQOrp034',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': 'wedeption-21093.firebaseapp.com',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID': 'wedeption-21093',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': 'wedeption-21093.firebasestorage.app',
  'FIREBASE_STORAGE_BUCKET': 'wedeption-21093.firebasestorage.app'
}

console.log('🔍 Verifying Configuration...\n')

let allCorrect = true

for (const [key, expectedValue] of Object.entries(requiredEnvVars)) {
  const actualValue = process.env[key]
  
  if (!actualValue) {
    console.log(`❌ ${key}: NOT SET`)
    allCorrect = false
  } else if (actualValue === expectedValue) {
    console.log(`✅ ${key}: Correct`)
  } else {
    console.log(`⚠️  ${key}: Different value`)
    console.log(`   Expected: ${expectedValue.substring(0, 50)}...`)
    console.log(`   Actual:   ${actualValue.substring(0, 50)}...`)
    allCorrect = false
  }
}

console.log('\n' + (allCorrect ? '✅ All configurations are correct!' : '❌ Some configurations need updating.'))
console.log('\n💡 Make sure to restart your dev server after updating .env.local')

