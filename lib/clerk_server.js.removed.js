import Clerk from '@clerk/clerk-sdk-node'
const clerk = Clerk({ apiKey: process.env.CLERK_SECRET_KEY })
export async function verifyClerkTokenFromHeader(req) {
  const auth = req.headers.authorization || ''
  const token = auth.replace('Bearer ','')
  if(!token) throw new Error('No token')
  const session = await clerk.sessions.verifySessionToken(token)
  return session.userId
}
export default clerk
