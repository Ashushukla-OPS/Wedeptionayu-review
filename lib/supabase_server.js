import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from './config'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseConfig.url,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseConfig.serviceRoleKey,
  {
    auth: { persistSession: false }
  }
)
export default supabase
