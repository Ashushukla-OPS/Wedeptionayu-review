import { bucket } from '../../lib/firebase_storage'
import { firebaseConfig } from '../../lib/config'

export default async function handler(req, res) {
  // Ensure we always return JSON, even on errors
  res.setHeader('Content-Type', 'application/json')
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Re-check bucket in case it wasn't initialized at module load
    if (!bucket) {
      console.error('Firebase Storage bucket is null')
      return res.status(500).json({ 
        error: 'Firebase Storage not configured. Please check firebase-service-account.json file and ensure it exists in the project root.',
        details: process.env.NODE_ENV === 'development' ? 'Bucket initialization failed. Check server logs and restart the dev server.' : undefined
      })
    }

  const { filename, contentType } = req.body

    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' })
    }

    // Validate content type - allow images and videos
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'
    ]
    
    const isValidType = !contentType || allowedTypes.some(type => contentType.toLowerCase().includes(type.split('/')[1]))
    if (contentType && !isValidType) {
      return res.status(400).json({ error: 'Invalid file type. Only images and videos are allowed.' })
    }

    // Determine folder based on content type
    const folder = contentType?.startsWith('video/') ? 'uploads/videos' : 'uploads/images'
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `${folder}/${Date.now()}-${sanitizedFilename}`
    const file = bucket.file(filePath)

    // Generate signed URL for upload (valid for 15 minutes)
    const expiresAt = Date.now() + 1000 * 60 * 15
    
    let url
    try {
      [url] = await file.getSignedUrl({ 
        action: 'write', 
        expires: expiresAt, 
        contentType: contentType || 'application/octet-stream'
      })
    } catch (signUrlError) {
      console.error('Failed to generate signed URL:', signUrlError)
      return res.status(500).json({ 
        error: 'Failed to generate upload URL',
        details: process.env.NODE_ENV === 'development' ? signUrlError.message : undefined
      })
    }

    // Get bucket name from bucket object or config
    const bucketName = bucket.name || process.env.FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket
    if (!bucketName) {
      return res.status(500).json({ 
        error: 'Storage bucket name not configured. Please set FIREBASE_STORAGE_BUCKET environment variable.'
      })
    }
    
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`

    return res.status(200).json({ 
      uploadUrl: url, 
      publicUrl,
      filePath
    })
  } catch (error) {
    console.error('Upload URL error:', error)
    // Ensure we always return JSON, never HTML
    return res.status(500).json({ 
      error: error.message || 'Failed to generate upload URL',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
