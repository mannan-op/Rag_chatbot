import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

export const isSupabaseAdminConfigured = Boolean(
  env.supabaseUrl && env.supabaseServiceRoleKey,
);

export const supabaseAdmin = isSupabaseAdminConfigured
  ? createClient(env.supabaseUrl!, env.supabaseServiceRoleKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
