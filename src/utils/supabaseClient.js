import { createClient } from '@supabase/supabase-js'

// These environment variables will be set in the .env file
// For development, we'll use placeholder values if env vars are not set
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-project-url.supabase.co'
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)