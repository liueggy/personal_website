"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function buildCallbackUrl(searchParams: URLSearchParams) {
  const callbackUrl = new URL("/auth/callback", window.location.origin);
  const type = searchParams.get("type");
  const next = searchParams.get("next") || (type === "recovery" ? "/admin/reset-password" : "/admin");
  callbackUrl.searchParams.set("next", next);

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");

  if (code) {
    callbackUrl.searchParams.set("code", code);
  }

  if (tokenHash && type) {
    callbackUrl.searchParams.set("token_hash", tokenHash);
    callbackUrl.searchParams.set("type", type);
  }

  return callbackUrl;
}

export function AuthRedirectBridge() {
  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const query = currentUrl.searchParams;
    const hash = currentUrl.hash.startsWith("#") ? new URLSearchParams(currentUrl.hash.slice(1)) : new URLSearchParams();
    const recoveryType = query.get("type") || hash.get("type");
    const next = query.get("next") || hash.get("next") || (recoveryType === "recovery" ? "/admin/reset-password" : "/admin");

    async function syncAuth() {
      const hasServerCallbackParams = query.has("code") || (query.has("token_hash") && query.has("type"));
      if (hasServerCallbackParams && currentUrl.pathname !== "/auth/callback") {
        window.location.replace(buildCallbackUrl(query).toString());
        return;
      }

      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (!accessToken || !refreshToken) {
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (error) {
        window.location.replace(`/admin/reset-password?error=auth`);
        return;
      }

      window.location.replace(next);
    }

    void syncAuth();
  }, []);

  return null;
}
