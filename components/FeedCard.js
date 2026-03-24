
import { motion } from 'framer-motion'
export default function FeedCard({post, onLike}){
  return (
    <motion.div layout whileHover={{ y: -6 }} className="card">
      <div className="card">
        <img src={post.media_url} className="w-full h-64 object-cover rounded-xl" alt={post.caption} />
        <div className="absolute top-3 right-3">
          <button className="btn-primary" onClick={()=>onLike(post.id)} className="bg-white px-3 py-1 rounded-full shadow">❤ {post.likes||0}</button>
        </div>
      </div>
      <div className="mt-3">
        <div className="text-sm text-gray-600">{post.caption}</div>
      </div>
    </motion.div>
  )
}
