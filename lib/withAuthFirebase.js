import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase_client'

export default function withAuthFirebase(Component) {
  return function Protected(props) {
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          router.push('/login')
          setLoading(false)
          return
        }
        
        try {
          // Get Firebase token
          const token = await user.getIdToken()
          
          // Sync user to Supabase
          const response = await fetch('/api/sync-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              uid: user.uid,
              name: user.displayName,
              email: user.email,
              phone: user.phoneNumber
            })
          })
          
          if (!response.ok) {
            console.error('Failed to sync user:', await response.text())
          }
        } catch (error) {
          console.error('Error syncing user:', error)
        } finally {
          setLoading(false)
        }
      })
      
      return () => unsubscribe()
    }, [router])
    
    if (loading) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16
        }}>
          <div style={{ fontSize: 24 }}>⏳</div>
          <div style={{ color: 'var(--text-muted)' }}>Checking authentication...</div>
        </div>
      )
    }
    
    return <Component {...props} />
  }
}
