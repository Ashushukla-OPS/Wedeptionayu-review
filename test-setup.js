// Quick setup verification script
// Run: node test-setup.js

const fs = require('fs')
const path = require('path')

console.log('🔍 Verifying Setup...\n')

// Check .env.local
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local exists')
  const envContent = fs.readFileSync(envPath, 'utf8')
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
  ]
  
  let missing = []
  requiredVars.forEach(varName => {
    if (envContent.includes(varName + '=')) {
      console.log(`✅ ${varName} configured`)
    } else {
      console.log(`❌ ${varName} missing`)
      missing.push(varName)
    }
  })
  
  if (missing.length === 0) {
    console.log('\n✅ All environment variables configured!')
  } else {
    console.log(`\n⚠️  Missing ${missing.length} environment variables`)
  }
} else {
  console.log('❌ .env.local not found')
  console.log('💡 Run: powershell -ExecutionPolicy Bypass -File setup-env.ps1')
}

// Check config.js
const configPath = path.join(process.cwd(), 'lib', 'config.js')
if (fs.existsSync(configPath)) {
  console.log('\n✅ lib/config.js exists with fallback keys')
} else {
  console.log('\n❌ lib/config.js not found')
}

// Check firebase-service-account.json
const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json')
if (fs.existsSync(serviceAccountPath)) {
  console.log('✅ firebase-service-account.json exists')
} else {
  console.log('⚠️  firebase-service-account.json not found (may be in .gitignore)')
}

// Check key files
const keyFiles = [
  'lib/firebase_client.js',
  'lib/firebase_admin.js',
  'lib/supabase.js',
  'lib/supabase_server.js',
  'pages/api/sync-user.js',
  'app/login/page.js',
  'app/register-vendor/page.js'
]

console.log('\n📁 Checking key files:')
keyFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file)
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`)
  } else {
    console.log(`❌ ${file} missing`)
  }
})

console.log('\n✨ Setup verification complete!')
console.log('\n📚 Next steps:')
console.log('   1. Run database migrations in Supabase')
console.log('   2. Enable Phone Auth in Firebase Console')
console.log('   3. Restart dev server: npm run dev')
console.log('   4. Test authentication flow')

