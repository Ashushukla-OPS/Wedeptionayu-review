// Basic Firebase client for Firestore chat (client-side)
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore'
import { firebaseConfig as defaultFirebaseConfig } from './config'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
}
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const chatCollection = (chatId) => collection(db, 'chats', chatId, 'messages')
export const sendMessage = async (chatId, msg) => {
  return await addDoc(chatCollection(chatId), { text: msg.text, sender: msg.sender, timestamp: new Date().toISOString() })
}
export const listenMessages = (chatId, cb) => {
  const q = query(chatCollection(chatId), orderBy('timestamp','asc'))
  return onSnapshot(q, snap => { const msgs = snap.docs.map(d=>d.data()); cb(msgs) })
}
