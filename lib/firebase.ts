// Client-side Firebase initialization in modern, single-responsibility form.
// Phone auth / reCAPTCHA logic must live in client components only – this file
// just exposes the initialized app + auth instance.

import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { firebaseConfig as defaultFirebaseConfig } from './config'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || defaultFirebaseConfig.measurementId
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const firebaseApp = app
export const firebaseAuth = getAuth(app)

export default app


