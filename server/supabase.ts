import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variable names for Supabase connection
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
    console.log('[Supabase] Initialized Supabase client successfully with URL:', supabaseUrl);
  } catch (err) {
    console.warn('[Supabase] Failed to initialize Supabase client:', err);
  }
} else {
  console.log('[Supabase] No SUPABASE_URL / SUPABASE_KEY set in environment. Running in local JSON storage mode.');
}

export const supabase = supabaseClient;

/**
 * Helper to check if Supabase database connection is active
 */
export function isSupabaseEnabled(): boolean {
  return supabaseClient !== null;
}
