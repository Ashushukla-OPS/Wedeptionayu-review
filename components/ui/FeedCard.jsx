
import { useState } from 'react'
export default function FeedCard({post}){
  const [liked, setLiked] = useState(false)
  async function like(){
    try {
      await fetch('/api/like',{method:'POST',headers:{'content-type':'application/json'},body: JSON.stringify({ post_id: post.id })})
      setLiked(true)
    } catch(e){ console.error(e) }
  }
  return (
    <article className="card" aria-labelledby={'post-'+post.id}>
      <img className="round-photo" src={post.media_url} alt={post.caption || 'Inspiration image'} style={{width:'100%',height:'auto',display:'block'}} />
      <div className="card" style={{paddingTop:8}}>
        <h3 id={'post-'+post.id} style={{margin:0}}>{post.caption || 'Beautiful work'}</h3>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
          <div style={{color:'#6b6b6b'}}>By vendor</div>
          <div>
            <button aria-pressed={liked} onClick={like} className="btn" style={{background:'#fff', color:'#d77fa3', border:'1px solid rgba(215,127,163,0.12)'}}>Like</button>
          </div>
        </div>
      </div>
    </article>
  )
}
