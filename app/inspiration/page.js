'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Footer from '../../components/Footer'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { auth } from '../../lib/firebase_client'

function InspirationContent() {
  const searchParams = useSearchParams()
  const categoryFromUrl = searchParams.get('category')
  const [selectedFilter, setSelectedFilter] = useState(categoryFromUrl || 'All')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [likedPosts, setLikedPosts] = useState(new Set())
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [selectedPost, setSelectedPost] = useState(null)
  const [comments, setComments] = useState({})
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const observerRef = useRef(null)

  const filters = ['All', 'Decor', 'Photography', 'Catering', 'Venues', 'Fashion', 'Flowers']

  useEffect(() => {
    // Get current user
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    // Update filter when URL parameter changes
    if (categoryFromUrl) {
      setSelectedFilter(categoryFromUrl)
    }
  }, [categoryFromUrl])

  useEffect(() => {
    // Reset when filter changes
    setPosts([])
    setPage(1)
    setHasMore(true)
  }, [selectedFilter])

  useEffect(() => {
    fetchPosts()
  }, [selectedFilter, page])

  const fetchPosts = async () => {
    try {
      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const response = await fetch(`/api/inspiration-feed?page=${page}&limit=10&category=${selectedFilter === 'All' ? '' : selectedFilter}`)
      const data = await response.json()

      if (response.ok) {
        const newPosts = data.posts || []

        // Track views for new posts
        if (page === 1) {
          setPosts(newPosts)
          // Track views for first page posts
          newPosts.slice(0, 5).forEach(post => {
            fetch('/api/inspiration-feed/track-view', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ post_id: post.id })
            }).catch(() => { }) // Silently fail
          })
        } else {
          setPosts(prev => [...prev, ...newPosts])
        }
        setHasMore(newPosts.length >= 10)
      }
    } catch (error) {
      console.error('Failed to fetch inspiration feed:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Infinite scroll observer
  const lastPostElementRef = useCallback((node) => {
    if (loading || loadingMore) return
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1)
      }
    })

    if (node) observerRef.current.observe(node)
  }, [loading, loadingMore, hasMore])

  const handleLike = async (postId) => {
    // Check if user is logged in
    if (!currentUser) {
      const shouldLogin = window.confirm('Please login to like posts. Would you like to login now?')
      if (shouldLogin) {
        window.location.href = '/login'
      }
      return
    }

    try {
      // Get Firebase token for authentication
      const token = await currentUser.getIdToken()
      const response = await fetch('/api/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ post_id: postId, post_type: 'inspiration' })
      })
      const data = await response.json()
      if (response.ok) {
        setPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, likes: data.likes, liked: data.liked } : p
        ))
        if (data.liked) {
          setLikedPosts(prev => new Set([...prev, postId]))
        } else {
          setLikedPosts(prev => {
            const newSet = new Set(prev)
            newSet.delete(postId)
            return newSet
          })
        }
      } else if (response.status === 401) {
        // Handle authentication error
        const shouldLogin = window.confirm('Your session has expired. Please login again to like posts. Would you like to login now?')
        if (shouldLogin) {
          window.location.href = '/login'
        }
      }
    } catch (error) {
      console.error('Failed to like post:', error)
      alert('Failed to like post. Please try again.')
    }
  }

  const fetchComments = async (postId) => {
    if (comments[postId]) return // Already loaded

    try {
      const response = await fetch(`/api/inspiration-feed/comments?post_id=${postId}`)
      const data = await response.json()
      if (response.ok) {
        setComments(prev => ({ ...prev, [postId]: data.comments || [] }))
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }

  const handleCommentClick = (post) => {
    setSelectedPost(post)
    fetchComments(post.id)
  }

  const handleAddComment = async () => {
    if (!currentUser || !commentText.trim() || !selectedPost) return

    setSubmittingComment(true)
    try {
      const token = await currentUser.getIdToken()
      const response = await fetch('/api/inspiration-feed/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          post_id: selectedPost.id,
          comment_text: commentText
        })
      })
      const data = await response.json()
      if (response.ok) {
        setComments(prev => ({
          ...prev,
          [selectedPost.id]: [...(prev[selectedPost.id] || []), data.comment]
        }))
        setPosts(prev => prev.map(p =>
          p.id === selectedPost.id
            ? { ...p, comments_count: (p.comments_count || 0) + 1 }
            : p
        ))
        setCommentText('')
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
      alert('Please login to comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleShare = async (post) => {
    const url = `${window.location.origin}/inspiration#post-${post.id}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: post.caption || 'Wedeption Inspiration',
          text: post.description || '',
          url: url
        })
      } catch (err) {
        // User cancelled or error occurred
        copyToClipboard(url)
      }
    } else {
      copyToClipboard(url)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Link copied to clipboard!')
    }).catch(() => {
      alert('Failed to copy link')
    })
  }

  const handleContact = (vendorId, postId) => {
    const qs = postId ? `?from_post=${postId}` : ''
    window.location.href = `/vendor/${vendorId}${qs}`
  }

  const filteredPosts = selectedFilter === 'All'
    ? posts
    : posts.filter(p => p.category === selectedFilter)

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(900px 500px at 20% 10%, rgba(233,30,99,0.14) 0%, rgba(233,30,99,0) 60%), radial-gradient(700px 420px at 90% 25%, rgba(212,175,55,0.14) 0%, rgba(212,175,55,0) 60%), linear-gradient(180deg, #fff 0%, #fff7fb 55%, #f7f7ff 100%)',
        scrollBehavior: 'smooth',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      }}
    >
      {/* Header with Title and Filters */}
      <section style={{ padding: '16px 0 10px', background: 'transparent' }}>
        <div
          className="container"
          style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 16px' }}
        >
          {/* Title */}
          <h1 className="inspo-page-title">
            Wedeption Inspiration
          </h1>

          {/* Sticky Filters (premium pills) - no Wedeption label, semi-bold */}
          <div
            className="inspo-filter-bar"
            style={{
              position: 'sticky',
              top: 82,
              zIndex: 40,
              borderRadius: 18,
              background: 'rgba(255, 251, 242, 0.70)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(212, 175, 55, 0.22)',
              boxShadow: '0 12px 40px rgba(15, 23, 42, 0.06)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 10,
                overflowX: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                paddingBottom: 2,
                flex: 1,
              }}
            >
              {filters.map((filter) => (
                <button
                  key={filter}
                  className="inspo-filter-btn"
                  onClick={() => setSelectedFilter(filter)}
                  style={{
                    border: selectedFilter === filter ? 'none' : '1px solid rgba(15, 23, 42, 0.08)',
                    background:
                      selectedFilter === filter
                        ? 'linear-gradient(135deg, rgba(233,30,99,1) 0%, rgba(139,92,246,0.95) 42%, rgba(212,175,55,1) 100%)'
                        : 'rgba(255,255,255,0.72)',
                    color: selectedFilter === filter ? 'white' : '#1f2937',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxShadow:
                      selectedFilter === filter ? '0 12px 28px rgba(233, 30, 99, 0.18)' : 'none',
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Instagram-style Long Scroll Feed */}
      <section style={{ padding: '18px 0 80px', background: 'transparent' }}>
        <div className="container" style={{ maxWidth: '680px', margin: '0 auto', padding: '0 16px' }}>
          {loading && posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8e8e8e' }}>
              Loading posts...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8e8e8e' }}>
              No posts found. Check back soon!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {filteredPosts.map((post, idx) => {
                const vendor = post.vendors || {}
                const isLiked = likedPosts.has(post.id) || post.liked
                const isLast = idx === filteredPosts.length - 1

                return (
                  <motion.div
                    key={post.id}
                    ref={isLast ? lastPostElementRef : null}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="inspo-card"
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.92)',
                      border: '1px solid rgba(15, 23, 42, 0.06)',
                      borderRadius: 18,
                    }}
                  >
                    {/* Post Header - Profile Section */}
                    <div style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: 'white',
                      borderBottom: '1px solid #efefef'
                    }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: '#efefef',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#262626',
                        flexShrink: 0
                      }}>
                        {vendor.business_name ? vendor.business_name.charAt(0).toUpperCase() : 'V'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#262626',
                          marginBottom: '2px'
                        }}>
                          {vendor.business_name || 'Vendor'}
                        </div>
                        {vendor.city && (
                          <div style={{
                            fontSize: '12px',
                            color: '#8e8e8e'
                          }}>
                            {vendor.city}
                          </div>
                        )}
                      </div>
                      {vendor.id && (
                        <button
                          onClick={() => handleContact(vendor.id, post.id)}
                          style={{
                            padding: '6px 16px',
                            borderRadius: '4px',
                            background: '#e91e63',
                            color: 'white',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#c2185b'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = '#e91e63'
                          }}
                        >
                          Contact
                        </button>
                      )}
                    </div>

                    {/* Post Image */}
                    <div className="inspo-card-media" style={{ position: 'relative', width: '100%', background: '#efefef' }}>
                      <img
                        src={post.media_url}
                        alt={post.caption || 'Inspiration post'}
                        style={{
                          width: '100%',
                          height: 'auto',
                          display: 'block'
                        }}
                      />
                    </div>

                    {/* Post Footer - Engagement Section */}
                    <div style={{ padding: '12px 16px', background: 'white' }}>
                      {/* Action Icons */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        marginBottom: '8px'
                      }}>
                        <button
                          onClick={() => handleLike(post.id)}
                          title={!currentUser ? 'Login to like' : isLiked ? 'Unlike' : 'Like'}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: currentUser ? 'pointer' : 'not-allowed',
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                            color: isLiked ? '#ed4956' : (!currentUser ? '#8e8e8e' : '#262626'),
                            opacity: !currentUser ? 0.6 : 1,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (currentUser) {
                              e.currentTarget.style.opacity = 0.8
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (currentUser) {
                              e.currentTarget.style.opacity = 1
                            }
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </button>

                        <button
                          onClick={() => handleCommentClick(post)}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                            color: '#262626'
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        </button>

                        <button
                          onClick={() => handleShare(post)}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                            color: '#262626'
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                            <polyline points="16 6 12 2 8 6" />
                            <line x1="12" y1="2" x2="12" y2="15" />
                          </svg>
                        </button>
                      </div>

                      {/* Likes and Views Count */}
                      <div style={{ marginBottom: '8px' }}>
                        {(post.likes || 0) > 0 && (
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#262626', marginBottom: '4px' }}>
                            {post.likes || 0} likes
                          </div>
                        )}
                        {post.views_count > 0 && (
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#262626' }}>
                            {post.views_count} views
                          </div>
                        )}
                      </div>

                      {/* Caption */}
                      <div style={{ marginBottom: '4px' }}>
                        <div style={{ fontSize: '14px', lineHeight: '18px' }}>
                          <span style={{ fontWeight: 600, color: '#262626', marginRight: 6 }}>
                            {vendor.business_name || 'Vendor'}
                          </span>
                          <span style={{ color: '#262626' }}>
                            {post.caption || ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}

              {loadingMore && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#8e8e8e'
                }}>
                  Loading more posts...
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Comments Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20
            }}
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'white',
                borderRadius: '12px',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #efefef',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#262626' }}>
                  Comments
                </h3>
                <button
                  onClick={() => setSelectedPost(null)}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '24px',
                    color: '#8e8e8e',
                    padding: 0,
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>

              {/* Comments List */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                minHeight: '200px'
              }}>
                {comments[selectedPost.id]?.length > 0 ? (
                  comments[selectedPost.id].map((comment) => (
                    <div key={comment.id} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#efefef',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#262626',
                          flexShrink: 0
                        }}>
                          {comment.users?.name ? comment.users.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', lineHeight: '18px' }}>
                            <span style={{ fontWeight: 600, color: '#262626', marginRight: 8 }}>
                              {comment.users?.name || 'User'}
                            </span>
                            <span style={{ color: '#262626' }}>{comment.comment_text}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#8e8e8e', marginTop: 4 }}>
                            {new Date(comment.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8e8e8e' }}>
                    No comments yet. Be the first to comment!
                  </div>
                )}
              </div>

              {/* Comment Input */}
              {currentUser && (
                <div style={{
                  padding: '16px 20px',
                  borderTop: '1px solid #efefef',
                  display: 'flex',
                  gap: 12
                }}>
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid #dbdbdb',
                      borderRadius: '4px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleAddComment()
                      }
                    }}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!commentText.trim() || submittingComment}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '4px',
                      background: commentText.trim() ? '#e91e63' : '#efefef',
                      color: commentText.trim() ? 'white' : '#8e8e8e',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: commentText.trim() ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {submittingComment ? 'Posting...' : 'Post'}
                  </button>
                </div>
              )}

              {!currentUser && (
                <div style={{
                  padding: '16px 20px',
                  borderTop: '1px solid #efefef',
                  textAlign: 'center',
                  fontSize: '14px',
                  color: '#8e8e8e'
                }}>
                  <Link href="/login" style={{ color: '#e91e63', textDecoration: 'none', fontWeight: 600 }}>
                    Login to comment
                  </Link>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  )
}

export default function InspirationPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <p style={{ color: '#8e8e8e' }}>Loading inspiration...</p>
      </div>
    }>
      <InspirationContent />
    </Suspense>
  )
}
