import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client that reads/writes cookies for session management
// This works seamlessly with the server-side auth callback
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
