import { bucket } from '../../lib/firebase_storage'
import { firebaseConfig } from '../../lib/config'
import { verifyFirebaseTokenFromHeader } from '../../lib/firebase_server'
import formidable from 'formidable'
import fs from 'fs'

// Disable body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  // Ensure we always return JSON, even on errors
  res.setHeader('Content-Type', 'application/json')
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify authentication
    let userId
    try {
      userId = await verifyFirebaseTokenFromHeader(req)
    } catch (authErr) {
      const msg = authErr?.message || ''
      const isJWT = /invalid_grant|JWT|token|expired|signature/i.test(msg)
      console.error('Upload auth error:', authErr?.message)
      return res.status(401).json({
        error: isJWT
          ? 'Session expired or invalid. Please sign out, sign in again, and try uploading.'
          : 'Unauthorized. Please sign in again.'
      })
    }
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized. Please sign in again.' })
    }

    // Parse multipart form data
    const form = formidable({
      maxFileSize: 100 * 1024 * 1024, // 100MB max
      keepExtensions: true,
      uploadDir: '/tmp' // Ensure we use writable directory on Vercel
    })

    let fields, files
    try {
      [fields, files] = await form.parse(req)
    } catch (parseErr) {
      console.error('Formidable parse error:', parseErr)
      return res.status(400).json({ 
        error: 'Failed to parse file upload',
        details: parseErr.message
      })
    }
    const file = Array.isArray(files.file) ? files.file[0] : files.file
    
    if (!file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    // Get file info
    const filePath = file.filepath
    const originalName = file.originalFilename || 'upload'
    const fileSize = file.size
    const mimeType = file.mimetype || 'application/octet-stream'

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'
    ]
    
    if (!allowedTypes.some(type => mimeType.toLowerCase().includes(type.split('/')[1]))) {
      fs.unlinkSync(filePath)
      return res.status(400).json({ error: 'Invalid file type. Only images and videos are allowed.' })
    }

    // Check file size (100MB max for videos, 10MB for images)
    const maxSize = mimeType.startsWith('video/') ? 100 * 1024 * 1024 : 10 * 1024 * 1024
    if (fileSize > maxSize) {
      fs.unlinkSync(filePath)
      return res.status(400).json({ 
        error: `File size too large. Maximum size: ${mimeType.startsWith('video/') ? '100MB' : '10MB'}` 
      })
    }

    const fileBuffer = fs.readFileSync(filePath)
    const folder = mimeType.startsWith('video/') ? 'videos' : 'images'
    const sanitizedFilename = originalName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storageFilePath = `${folder}/${Date.now()}-${sanitizedFilename}`

    // Store uploads in Firebase Storage only (no Supabase fallback)
    if (!bucket) {
      fs.unlinkSync(filePath)
      console.error('Firebase Storage bucket is not configured')
      return res.status(503).json({
        error: 'Upload service unavailable. Firebase Storage is not configured. Add firebase-service-account.json in project root and set FIREBASE_STORAGE_BUCKET (e.g. your-project-id.appspot.com) so uploads are stored in Firebase.'
      })
    }

    const storageFile = bucket.file(`uploads/${storageFilePath}`)
    await storageFile.save(fileBuffer, {
      metadata: {
        contentType: mimeType,
        metadata: { uploadedBy: userId, originalName }
      }
    })
    await storageFile.makePublic()
    const bucketName = bucket.name || process.env.FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket
    const publicUrl = `https://storage.googleapis.com/${bucketName}/uploads/${storageFilePath}`

    fs.unlinkSync(filePath)

    return res.status(200).json({ 
      success: true,
      publicUrl,
      filePath: storageFilePath,
      fileName: originalName,
      fileSize: fileSize,
      contentType: mimeType
    })
  } catch (error) {
    console.error('Upload file error:', error)
    return res.status(500).json({ 
      error: error.message || 'Failed to upload file',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

