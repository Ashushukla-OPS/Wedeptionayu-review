import { supabase } from '../../lib/supabase_server'
export default async function handler(req,res){
  const { data } = await supabase.from('user_credits').select('*').eq('user_id','user_demo_1').single()
  return res.json({ credits: data ? data.credits : 0 })
}
