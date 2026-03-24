
async function loadReviews(vendorId){
  const res = await fetch('/api/reviews?vendor_id=' + vendorId)
  const data = await res.json()
  const el = document.getElementById('reviews-section')
  if(!data.reviews || data.reviews.length === 0) el.innerHTML = '<p>No reviews yet.</p>'
  else el.innerHTML = data.reviews.map(r => `<div style="border:1px solid #eee;padding:8;margin:8"><b>Rating: ${r.rating}/5</b><div>${r.review_text || ''}</div><small>${new Date(r.created_at).toLocaleString()}</small></div>`).join('')
}

async function showReviewForm(vendorId){
  const el = document.getElementById('leave-review')
  el.innerHTML = `<div style="border:1px solid #ddd;padding:12"><h4>Leave a review</h4>
    <label>Rating: <input id="rv-rating" type="number" min="1" max="5" value="5" /></label><br/><br/>
    <textarea id="rv-text" placeholder="Write your review"></textarea><br/><br/>
    <button className="btn-primary" id="rv-submit">Submit Review</button>
  </div>`
  document.getElementById('rv-submit').onclick = async ()=>{
    const rating = parseInt(document.getElementById('rv-rating').value)
    const review_text = document.getElementById('rv-text').value
    // get firebase token
    const user = window.firebaseAuth && window.firebaseAuth.currentUser
    if(!user) return alert('Please login to leave a review.')
    const token = await user.getIdToken()
    const res = await fetch('/api/reviews-submit', { method: 'POST', headers: { 'content-type':'application/json', 'authorization': 'Bearer '+token }, body: JSON.stringify({ vendor_id: vendorId, rating, review_text }) })
    const j = await res.json()
    if(j.ok) { alert('Review submitted for moderation'); loadReviews(vendorId) } else alert('Error: ' + (j.error||JSON.stringify(j)))
  }
}

// Expose functions to window
window.loadReviews = loadReviews
window.showReviewForm = showReviewForm
