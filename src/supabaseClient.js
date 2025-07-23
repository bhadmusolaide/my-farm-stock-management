import { createClient } from '@supabase/supabase-js'

// Supabase configuration
// Replace these with your actual Supabase project URL and anon key
const supabaseUrl = 'https://wyszlfekxikqxkjzjeqm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5c3psZmVreGlrcXhranpqZXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODk3NDQsImV4cCI6MjA2ODc2NTc0NH0.0cgKlflBUpfk8rjNaVL7GllvYddSUwQ_-ao21903-Yw'

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
