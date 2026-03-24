import Razorpay from 'razorpay'
import { supabase } from '../../lib/supabase_server'
export default async function handler(req,res){
  if(req.method !== 'POST') return res.status(405).end()
  const { vendor_id, plan } = req.body
  try {
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
    // create order
    const order = await razorpay.orders.create({ amount: 39900, currency: 'INR', receipt: 'rcpt_'+Date.now() })
    return res.json({ order })
  } catch(e){
    return res.status(500).json({ error: e.message })
  }
}
