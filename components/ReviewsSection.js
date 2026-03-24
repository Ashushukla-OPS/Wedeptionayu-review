import { useEffect, useState } from 'react'
export default function ReviewsSection({vendorId, userId, token}){
  const [reviews, setReviews] = useState([])
  const [canReview, setCanReview] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  useEffect(()=>{ fetch('/api/reviews/list?vendor_id='+vendorId).then(r=>r.json()).then(d=>setReviews(d.reviews)) 
    // check lead
    fetch('/api/reviews/can-review?vendor_id='+vendorId, { headers: { Authorization: 'Bearer '+(token||'') } }).then(r=>r.json()).then(d=>setCanReview(d.canReview))
  },[vendorId])
  const submit = async ()=>{
    const res = await fetch('/api/reviews/submit',{ method:'POST', headers:{'content-type':'application/json', Authorization: 'Bearer '+(token||'')}, body: JSON.stringify({ vendor_id: vendorId, rating, comment }) })
    const data = await res.json()
    if(data.ok) alert('Review submitted for moderation')
    else alert(JSON.stringify(data))
  }
  return (<div style={{marginTop:12}}>
    <h4>Reviews</h4>
    {reviews.map(r=> (<div key={r.id} style={{border:'1px solid #eee',padding:8,margin:6}}>
      <b>{r.user_name || r.user_id}</b> - Rating: {r.rating}
      <div>{r.comment}</div>
    </div>))}
    {canReview ? (<div style={{marginTop:12}}>
      <h5>Leave a review</h5>
      <label>Rating:</label>
      <select value={rating} onChange={e=>setRating(e.target.value)}><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select><br/>
      <textarea placeholder="Comment" value={comment} onChange={e=>setComment(e.target.value)} /><br/>
      <button className="btn-primary" onClick={submit}>Submit Review</button>
    </div>) : (<div><i>You can leave a review only after contacting this vendor.</i></div>)}
  </div>)
}
