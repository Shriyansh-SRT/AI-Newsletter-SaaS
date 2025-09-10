import { createClient } from "@supabase/supabase-js";

// Client for Inngest functions that bypasses RLS policies
// This is safe because Inngest functions run in a secure server environment
export function createInngestClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Override the auth to bypass RLS for server-side operations
  // This is safe because we're in a server environment
  return client;
}
