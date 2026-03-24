import { supabase } from '../../lib/supabase_server'
export default async function handler(req,res){
  const { user_id } = req.body
  const { data } = await supabase.from('user_credits').select('*').eq('user_id', user_id).single()
  if(data) await supabase.from('user_credits').update({ credits: data.credits + 1 }).eq('user_id', user_id)
  else await supabase.from('user_credits').insert([{ user_id, credits: 1 }])
  return res.json({ ok:true })
}
