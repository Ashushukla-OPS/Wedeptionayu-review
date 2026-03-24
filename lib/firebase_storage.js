import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'
import { firebaseConfig } from './config'
import fs from 'fs'

const SERVICE_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json'
let app = null
let bucket = null

try {
  // Check if app is already initialized
  const existingApps = getApps()
  if (existingApps.length > 0) {
    app = existingApps[0]
  } else if (fs.existsSync(SERVICE_PATH)) {
    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_PATH, 'utf8'))
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket
    
  app = initializeApp({ 
    credential: cert(serviceAccount), 
      storageBucket: storageBucket
  })
    console.log('Firebase Admin initialized successfully with storage bucket:', storageBucket)
} else {
  console.warn('FIREBASE_SERVICE_ACCOUNT_PATH not set and firebase-service-account.json not found')
}

  // Initialize bucket if app exists
  if (app) {
    try {
      // getStorage() uses the default app automatically
      const storage = getStorage()
      const bucketName = process.env.FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket
      if (!bucketName) {
        console.error('Storage bucket name is not configured')
        bucket = null
      } else {
        bucket = storage.bucket(bucketName)
        console.log('Firebase Storage bucket initialized:', bucket.name)
      }
    } catch (storageError) {
      console.error('Failed to initialize Firebase Storage:', storageError.message)
      console.error('Storage error stack:', storageError.stack)
      bucket = null
    }
  }
} catch (error) {
  console.error('Firebase initialization error:', error.message)
  app = null
  bucket = null
}

export { bucket }
