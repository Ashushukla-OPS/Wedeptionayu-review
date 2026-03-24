import Razorpay from 'razorpay'
import { supabase } from '../../lib/supabase_server'
export default async function handler(req,res){
  if(req.method !== 'POST') return res.status(405).end()
  const { vendor_id, plan = 'premium' } = req.body
  const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  
  try {
    // Create a payment order (one-time payment of ₹399)
    const order = await razorpay.orders.create({
      amount: 39900, // ₹399 in paise
      currency: 'INR',
      receipt: `sub_${vendor_id}_${Date.now()}`,
      notes: {
        vendor_id,
        plan,
        type: 'subscription'
      }
    })
    
    // Store pending subscription in DB
    await supabase.from('subscriptions').insert([{ 
      vendor_id, 
      plan, 
      price: 399, 
      start_date: new Date(), 
      status: 'pending', 
      subscription_level: 'premium',
      razorpay_subscription_id: order.id // Store order ID temporarily
    }])
    
    return res.json({ 
      ok: true, 
      order_id: order.id,
      amount: 39900,
      key: process.env.RAZORPAY_KEY_ID
    })
  } catch(e){
    console.error(e)
    return res.status(500).json({ error: e.message })
  }
}
