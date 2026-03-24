# PowerShell script to create .env.local file with correct credentials
# Run this script: .\setup-env.ps1

$envContent = @"
# ============================================
# Supabase Configuration
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://asnvudnxpjrirfpmalym.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzbnZ1ZG54cGpyaXJmcG1hbHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDk5MTMsImV4cCI6MjA4MDY4NTkxM30.uNDr-H7W7S4ZH7TOcorfxK3OwP8a2TYRMmsIrDhDguc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzbnZ1ZG54cGpyaXJmcG1hbHltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTEwOTkxMywiZXhwIjoyMDgwNjg1OTEzfQ.I3jRxEhiy7bRSTfTEsr0-DtxYphsd7bT0snpotV9y5w

# ============================================
# Firebase Configuration
# ============================================
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA5mbNhlinSBJn3_EoyWNg-HYarQOrp034
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=wedeption-21093.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=wedeption-21093
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=wedeption-21093.firebasestorage.app
FIREBASE_STORAGE_BUCKET=wedeption-21093.firebasestorage.app
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# ============================================
# Razorpay Configuration (Optional)
# ============================================
# Get these from your Razorpay Dashboard: https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
"@

$envContent | Out-File -FilePath ".env.local" -Encoding utf8
Write-Host ""
Write-Host "✅ .env.local file created/updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Configured:" -ForegroundColor Cyan
Write-Host "   ✅ Supabase URL and Keys" -ForegroundColor Green
Write-Host "   ✅ Firebase Configuration" -ForegroundColor Green
Write-Host "   ⚠️  Razorpay (add keys when ready)" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Restart your dev server (npm run dev)" -ForegroundColor White
Write-Host "   2. Add Razorpay keys if you have them" -ForegroundColor White
Write-Host ""
