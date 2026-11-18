import { createClient } from '@supabase/supabase-js'

// These come from .env.local (on your computer) or from Vercel's settings (live site).
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('Missing Supabase settings. Copy .env.example to .env.local and fill it in.')
}

// One shared connection to the database that every page uses.
export const supabase = createClient(url, key)
