import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase_client'

export default function withAuth(Component){
  return function Protected(props){
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    useEffect(()=>{
      const unsub = onAuthStateChanged(auth, async (user)=>{
        if(!user){
          router.push('/signin')
        } else {
          try{
            const token = await user.getIdToken()
            // sync server session (replace previous Clerk-based flow)
            await fetch('/api/supabase-session', { method: 'POST', headers: { Authorization: 'Bearer '+token } })
          }catch(e){
            console.error('Error syncing session', e)
          }
        }
        setLoading(false)
      })
      return ()=>unsub()
    },[])
    if(loading) return <div>Checking authentication...</div>
    return <Component {...props} />
  }
}
