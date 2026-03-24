import { adminAuth } from '../../lib/firebase_admin'
import { supabase } from '../../lib/supabase_server'

export default async function handler(req, res) {
  const normalizeEmail = (v) => (v ? String(v).trim().toLowerCase() : null)
  const normalizePhone = (v) => (v ? String(v).trim() : null)

  if (req.method === 'POST') {
    try {
      let userData = null
      
      // Check if we have auth header (token-based)
      const authHeader = req.headers.authorization || ''
      const token = authHeader.replace('Bearer ', '').trim()
      
      if (token) {
        // Get user from Firebase token
        try {
          const decoded = await adminAuth.verifyIdToken(token)
          const user = await adminAuth.getUser(decoded.uid)
          
          userData = {
            uid: user.uid,
            name: user.displayName || user.customClaims?.name || req.body?.name || null,
            email: user.email || null,
            phone: user.phoneNumber || null,
            photoURL: user.photoURL || null
          }
        } catch (tokenError) {
          // If token verification fails, try body data
          const { uid, name, email, phone, role } = req.body
          if (uid) {
            userData = { uid, name: name || null, email: email || null, phone: phone || null }
          } else {
            return res.status(401).json({ error: 'Invalid token or missing uid' })
          }
        }
      } else {
        // No token, use body data
        const { uid, name, email, phone } = req.body
        if (!uid) {
          return res.status(400).json({ error: 'uid is required' })
        }
        userData = { uid, name: name || null, email: email || null, phone: phone || null }
      }

      const { role: bodyRole } = req.body
      const role = bodyRole === 'vendor' || bodyRole === 'customer' ? bodyRole : 'user'
      const email = normalizeEmail(userData.email)
      const phone = normalizePhone(userData.phone)
      const name = req.body?.name ? String(req.body.name).trim() : userData.name

      // Prevent duplicate accounts with the same email/phone across different user ids.
      if (email) {
        const { data: existingByEmail, error: emailCheckError } = await supabase
          .from('users')
          .select('id')
          .ilike('email', email)
          .neq('id', userData.uid)
          .limit(1)
          .maybeSingle()
        if (emailCheckError) {
          return res.status(500).json({ error: emailCheckError.message })
        }
        if (existingByEmail) {
          return res.status(409).json({ error: 'This email is already linked to another account. Please use the same login account.' })
        }
      }

      if (phone) {
        const { data: existingByPhone, error: phoneCheckError } = await supabase
          .from('users')
          .select('id')
          .eq('phone', phone)
          .neq('id', userData.uid)
          .limit(1)
          .maybeSingle()
        if (phoneCheckError) {
          return res.status(500).json({ error: phoneCheckError.message })
        }
        if (existingByPhone) {
          return res.status(409).json({ error: 'This phone number is already linked to another account. Please use the same login account.' })
        }
      }
      
      // Sync to Supabase
      const profile = {
        id: userData.uid,
        name: name || null,
        email,
        phone,
        profile_pic: userData.photoURL || null,
        role
      }
      
      const { data, error } = await supabase
        .from('users')
        .upsert(profile, { onConflict: 'id' })
        .select()
        .single()
      
      if (error) {
        console.error('Supabase sync error:', error)
        return res.status(500).json({ error: error.message })
      }
      
      return res.json({ ok: true, user: data })
    } catch (e) {
      console.error('Sync user error:', e)
      return res.status(500).json({ error: e.message })
    }
  } else {
    // GET request - verify token and return user
    try {
      const authHeader = req.headers.authorization || ''
      const token = authHeader.replace('Bearer ', '').trim()
      
      if (!token) {
        return res.status(401).json({ error: 'No token provided' })
      }
      
      const decoded = await adminAuth.verifyIdToken(token)
      const user = await adminAuth.getUser(decoded.uid)
      
      // Get user from Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.uid)
        .single()
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        return res.status(500).json({ error: error.message })
      }
      
      return res.json({ ok: true, user: data || null, firebaseUser: {
        uid: user.uid,
        email: user.email,
        phone: user.phoneNumber,
        name: user.displayName
      }})
    } catch (e) {
      return res.status(401).json({ error: e.message })
    }
  }
}
