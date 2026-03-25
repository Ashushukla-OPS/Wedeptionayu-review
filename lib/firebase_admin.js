import admin from 'firebase-admin'
import fs from 'fs'
import { firebaseConfig } from './config'

const SERVICE_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json'

if (!admin.apps.length) {
  let serviceAccount = null

  // 1. Try single environment variable (JSON string)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', e.message)
    }
  } 
  // 1b. Try separate environment variables (like Vercel screenshot)
  else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    serviceAccount = {
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      // Handle the cases where Vercel escapes newlines as literal \n characters
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }
  }
  
  // 2. Try file-based if env var not present or failed to parse
  if (!serviceAccount && fs.existsSync(SERVICE_PATH)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(SERVICE_PATH, 'utf8'))
    } catch (e) {
      console.error('Failed to read/parse service account file:', e.message)
    }
  }

  if (serviceAccount) {
    admin.initializeApp({ 
      credential: admin.credential.cert(serviceAccount), 
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket 
    })
    console.log('Firebase Admin initialized successfully')
  } else {
    try {
      // Last resort: default initialization
      admin.initializeApp()
      console.log('Firebase Admin initialized with default credentials')
    } catch(e){
      console.warn('Firebase admin initialization failed:', e.message)
    }
  }
}

export const adminAuth = admin.auth()
export const adminBucket = admin.storage ? admin.storage().bucket() : null
export default admin
