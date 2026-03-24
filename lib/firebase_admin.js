import admin from 'firebase-admin'
import fs from 'fs'
import { firebaseConfig } from './config'
const SERVICE_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json'
if (!admin.apps.length) {
  if (fs.existsSync(SERVICE_PATH)) {
    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_PATH, 'utf8'))
    admin.initializeApp({ 
      credential: admin.credential.cert(serviceAccount), 
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket 
    })
  } else {
    try {
      admin.initializeApp()
    } catch(e){
      console.warn('Firebase admin init skipped:', e.message)
    }
  }
}
export const adminAuth = admin.auth()
export const adminBucket = admin.storage ? admin.storage().bucket() : null
export default admin
