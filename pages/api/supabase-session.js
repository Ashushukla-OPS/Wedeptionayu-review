// Verify Firebase ID token and return user info
import { adminAuth } from '../../lib/firebase_admin'

export default async function handler(req,res){
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ','').trim()
  if(!token) return res.status(401).json({ error: 'no token' })
  try{
    const decoded = await adminAuth.verifyIdToken(token)
    return res.json({ ok:true, uid: decoded.uid, email: decoded.email, name: decoded.name })
  }catch(e){
    return res.status(401).json({ error: e.message })
  }
}
