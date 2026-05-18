import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

/**
 * Server-side Supabase client. Used by /app/api/* routes.
 *
 * Prefers SUPABASE_SERVICE_ROLE_KEY (bypasses RLS) if set; otherwise falls back
 * to SUPABASE_ANON_KEY (works fine because we apply permissive RLS in schema.sql).
 */
export function getSupabase(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) environment variables. ' +
        'Set them in .env.local for dev or Vercel project settings for production.',
    );
  }
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}
