// Client-side only Firebase initialization
// Import ONLY inside 'use client' components

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  onAuthStateChanged
} from "firebase/auth";
import { firebaseConfig as defaultConfig } from "./config";

// --------------------------------------------
// 🔥 Firebase Configuration (fallbacks for phone auth to avoid invalid-app-credential)
// --------------------------------------------

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || defaultConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || defaultConfig.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || defaultConfig.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || defaultConfig.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || defaultConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || defaultConfig.appId,
};

// --------------------------------------------
// 🔒 Client-only safe initialization
// --------------------------------------------

let app;
let auth;
let googleProvider;

if (typeof window !== "undefined") {
  try {
    // Prevent duplicate initialization (important in Next.js)
    app = getApps().length === 0
      ? initializeApp(firebaseConfig)
      : getApp();

    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();

    console.log("🔥 Firebase Initialized");
    console.log("Project:", firebaseConfig.projectId);
    console.log("Origin:", window.location.origin);
  } catch (error) {
    console.error("❌ Firebase Initialization Error:", error);
  }
}

// --------------------------------------------
// 🔹 Exports
// --------------------------------------------

export { auth, googleProvider };

// 🔹 Google Sign-in
export async function signInWithGooglePopup() {
  if (!auth || !googleProvider) {
    throw new Error("Firebase not initialized.");
  }
  return await signInWithPopup(auth, googleProvider);
}

// 🔹 Phone Auth reCAPTCHA Setup (Correct Order for v10+)
export function setupRecaptcha(containerId, options = {}) {
  if (!auth) return null;

  const { size = "normal", callback } = options || {};

  return new RecaptchaVerifier(
    auth,
    containerId,
    {
      size,
      ...(callback ? { callback } : {})
    }
  );
}

export { signInWithPhoneNumber, onAuthStateChanged };