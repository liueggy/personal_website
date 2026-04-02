"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient<any>> | null = null;

export function createSupabaseBrowserClient() {
  if (!browserClient) {
    const env = getPublicEnv();
    browserClient = createBrowserClient<any>(env.supabaseUrl, env.supabaseAnonKey);
  }

  return browserClient;
}
