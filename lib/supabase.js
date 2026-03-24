import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from './config'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseConfig.url,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseConfig.anonKey
)
