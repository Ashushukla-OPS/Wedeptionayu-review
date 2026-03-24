
import { useState } from 'react'
export default function FeedCard({post, onLike}){
  const [liked, setLiked] = useState(false)
  const doLike = ()=>{
    setLiked(true)
    if(onLike) onLike(post.id)
    setTimeout(()=> setLiked(false), 700)
  }
  return (
    <div className="card" style={{overflow:'hidden'}}>
      <div style={{position:'relative'}}>
        <img className="round-photo" src={post.media_url || 'https://via.placeholder.com/600x400.png?text=Design'} style={{width:'100%', display:'block'}} alt="" />
        <button className="btn-primary" onClick={doLike} style={{position:'absolute', right:12, bottom:12, background:'rgba(255,255,255,0.9)', borderRadius:999, border:'none', padding:8}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? 'var(--accent-pink)' : 'none'} stroke={liked ? 'var(--accent-pink)' : 'currentColor'} strokeWidth="1.5">
            <path d="M12 21s-7-4.4-9-7.2C-...Z" />
          </svg>
        </button>
        {liked && <div style={{position:'absolute', right:24, bottom:36, pointerEvents:'none'}} className="animate-heart-burst">
          <svg width="48" height="48" viewBox="0 0 24 24"><path fill="var(--accent-pink)" d="M12 21s-7-4.4-9-7.2C-...Z" /></svg>
        </div>}
      </div>
      <div style={{padding:12}}>
        <h4 style={{margin:0}}>{post.caption || 'Beautiful design'}</h4>
        <p style={{marginTop:6, fontSize:13, color:'#555'}}>{post.vendor_name || 'Vendor'}</p>
      </div>
    </div>
  )
}
