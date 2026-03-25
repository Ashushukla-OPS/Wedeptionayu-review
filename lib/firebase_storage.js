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
  } else {
    let serviceAccount = null
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket

    // 1. Try single environment variable (JSON string)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      } catch (e) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env var in storage:', e.message)
      }
    }
    // 1b. Try separate environment variables
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      serviceAccount = {
        project_id: process.env.FIREBASE_PROJECT_ID,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      }
    }

    // 2. Try file-based
    if (!serviceAccount && fs.existsSync(SERVICE_PATH)) {
      try {
        serviceAccount = JSON.parse(fs.readFileSync(SERVICE_PATH, 'utf8'))
      } catch (e) {
        console.error('Failed to read/parse service account file in storage:', e.message)
      }
    }

    if (serviceAccount) {
      app = initializeApp({ 
        credential: cert(serviceAccount), 
        storageBucket: storageBucket
      })
      console.log('Firebase Admin initialized for Storage with service account')
    } else {
      try {
        app = initializeApp({ storageBucket })
        console.log('Firebase Admin initialized for Storage with default credentials')
      } catch (e) {
        console.warn('Firebase Admin Storage initialization fallback failed:', e.message)
      }
    }
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
