import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { ensureAdminProfile } from "@/lib/auth";
import { getServerEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = requestUrl.searchParams.get("next") || (type === "recovery" ? "/admin/reset-password" : "/admin");

  const supabase = await createSupabaseServerClient();
  const env = getServerEnv();
  let authError: Error | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authError = error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type
    });
    authError = error;
  } else {
    return NextResponse.redirect(new URL("/admin/login?error=auth", requestUrl.origin));
  }

  if (authError) {
    return NextResponse.redirect(new URL("/admin/login?error=auth", requestUrl.origin));
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const email = user?.email?.toLowerCase() || null;
  if (!user || (env.adminEmail && email !== env.adminEmail)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/admin/login?error=forbidden", requestUrl.origin));
  }

  await ensureAdminProfile(user.id, user.email || null);

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
