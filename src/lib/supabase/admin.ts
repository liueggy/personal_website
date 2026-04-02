import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";

let adminClient: ReturnType<typeof createClient<any>> | null = null;

export function createSupabaseAdminClient() {
  if (!adminClient) {
    const env = getServerEnv();
    adminClient = createClient<any>(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return adminClient;
}
