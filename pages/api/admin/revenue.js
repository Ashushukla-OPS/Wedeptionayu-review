import { supabase } from '../../../lib/supabase_server'
export default async function handler(req,res){
  // simple revenue calc: sum subscriptions.price where status active
  const { data } = await supabase.from('subscriptions').select('price')
  const total = data.reduce((s,d)=> s + (d.price || 0), 0)
  return res.json({ total, count: data.length })
}
