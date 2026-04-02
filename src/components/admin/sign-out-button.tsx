"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  return (
    <button
      type="button"
      className="button-secondary"
      onClick={async () => {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        window.location.href = "/admin/login";
      }}
    >
      退出登录
    </button>
  );
}
