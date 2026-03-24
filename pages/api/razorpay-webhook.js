import crypto from 'crypto'
import { supabase } from '../../lib/supabase_server'
export default async function handler(req,res){
  const webhookSecret = process.env.RAZORPAY_KEY_SECRET
  const body = await buffer(req)
  const signature = req.headers['x-razorpay-signature']
  const expected = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex')
  if(signature !== expected) return res.status(400).end('invalid')
  const event = JSON.parse(body.toString())
  
  // Handle payment events (one-time payment for subscription)
  if (event.event === 'payment.captured' || event.event === 'order.paid') {
    const orderId = event.payload?.payment?.entity?.order_id || event.payload?.order?.entity?.id
    const paymentId = event.payload?.payment?.entity?.id
    
    if (orderId) {
      // Find subscription by order ID (stored in razorpay_subscription_id temporarily)
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('vendor_id, id')
        .eq('razorpay_subscription_id', orderId)
        .eq('status', 'pending')
        .single()
      
      if (subscription) {
        // Update subscription status to active
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            subscription_level: 'premium',
            razorpay_subscription_id: paymentId || orderId // Store payment ID
          })
          .eq('id', subscription.id)
        
        // Update vendor subscription_level
        await supabase
          .from('vendors')
          .update({ subscription_level: 'premium' })
          .eq('id', subscription.vendor_id)
        
        console.log('Subscription activated for vendor:', subscription.vendor_id)
      }
    }
  }
  
  // Also handle subscription.charged for recurring subscriptions (if needed later)
  if (event.event === 'subscription.charged') {
    const subscriptionId = event.payload?.subscription?.entity?.id
    
    if (subscriptionId) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('vendor_id')
        .eq('razorpay_subscription_id', subscriptionId)
        .single()
      
      if (subscription) {
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            subscription_level: 'premium'
          })
          .eq('razorpay_subscription_id', subscriptionId)
        
        await supabase
          .from('vendors')
          .update({ subscription_level: 'premium' })
          .eq('id', subscription.vendor_id)
      }
    }
  }
  
  res.json({ ok: true })
}

async function buffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}
