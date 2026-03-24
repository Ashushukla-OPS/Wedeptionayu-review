import { adminAuth } from './firebase_admin'
export async function verifyFirebaseTokenFromHeader(req){
  const auth = req.headers.authorization || ''
  const token = auth.replace('Bearer ','')
  if(!token) throw new Error('No token provided')
  const decoded = await adminAuth.verifyIdToken(token)
  return decoded.uid
}
export async function getFirebaseUserFromHeader(req){
  const auth = req.headers.authorization || ''
  const token = auth.replace('Bearer ','')
  if(!token) throw new Error('No token provided')
  const decoded = await adminAuth.verifyIdToken(token)
  const user = await adminAuth.getUser(decoded.uid)
  return { uid: decoded.uid, phone: decoded.phone_number || null, email: decoded.email || null }
}
