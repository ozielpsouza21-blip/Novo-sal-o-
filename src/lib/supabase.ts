import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sskbgfdpkrwfstsdnvkq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_lE3PSpqyYTj2eU51k9GbWA_V3Ra1Zum';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export async function fetchRestEndpoint(endpoint: string, options: RequestInit = {}) {
  const baseUrl = supabaseUrl.replace(/\/$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}/rest/v1${path}`;

  const headers = {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  return fetch(url, {
    ...options,
    headers,
  });
}
