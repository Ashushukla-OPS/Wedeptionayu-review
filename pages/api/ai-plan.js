import fetch from 'node-fetch'
import { supabase } from '../../lib/supabase_server'
export default async function handler(req,res){
  if(req.method !== 'POST') return res.status(405).end()
  const { user_id, budget, city, guests } = req.body
  // Check credits
  const { data: u } = await supabase.from('user_credits').select('credits').eq('user_id', user_id).single()
  if(!u || u.credits <= 0) return res.status(402).json({ error: 'Not enough credits' })
  // Deduct 1 credit
  await supabase.from('user_credits').update({ credits: u.credits - 1 }).eq('user_id', user_id)
  // Build prompt
  const prompt = `You are an Indian wedding planner. User budget ${budget} in ${city}. Guests ${guests}. Give a breakdown: venue, food, decor, photography, outfits, misc.`
  // Call Gemini (MakerSuite) - placeholder: user must set GEMINI_API_KEY
  const apiKey = process.env.GEMINI_API_KEY
  if(!apiKey) return res.status(500).json({ error: 'Gemini key not configured' })
  const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  })
  const data = await resp.json()
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, no reply'
  // Save plan
  await supabase.from('ai_plans').insert([{ user_id, budget, city, guests, plan: reply }])
  return res.json({ plan: reply })
}
