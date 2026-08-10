import { createClient } from "@supabase/supabase-js";

// Server-only client: uses the service_role key, which bypasses Row Level
// Security. Never import this from a "use client" component.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);
