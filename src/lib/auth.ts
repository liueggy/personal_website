import { redirect } from "next/navigation";
import { getServerEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

export async function requireAdminUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/admin/login");
  }

  const env = getServerEnv();
  const email = user.email?.trim().toLowerCase() || null;
  const admin = createSupabaseAdminClient();
  let { data: profile } = await admin
    .from("profiles")
    .select("id, role, email")
    .eq("id", user.id)
    .maybeSingle();

  if (env.adminEmail && email === env.adminEmail && (!profile || profile.role !== "admin")) {
    await ensureAdminProfile(user.id, user.email || null);
    const refreshed = await admin.from("profiles").select("id, role, email").eq("id", user.id).maybeSingle();
    profile = refreshed.data ?? null;
  }

  if (!profile || profile.role !== "admin") {
    redirect("/admin/login?error=forbidden");
  }

  return {
    user,
    profile
  };
}

export async function requireAdminApiUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const env = getServerEnv();
  const email = user.email?.trim().toLowerCase() || null;
  const admin = createSupabaseAdminClient();
  let { data: profile } = await admin
    .from("profiles")
    .select("id, role, email")
    .eq("id", user.id)
    .maybeSingle();

  if (env.adminEmail && email === env.adminEmail && (!profile || profile.role !== "admin")) {
    await ensureAdminProfile(user.id, user.email || null);
    const refreshed = await admin.from("profiles").select("id, role, email").eq("id", user.id).maybeSingle();
    profile = refreshed.data ?? null;
  }

  if (!profile || profile.role !== "admin") {
    throw new Error("FORBIDDEN");
  }

  return {
    user,
    profile
  };
}

export async function ensureAdminProfile(userId: string, email: string | null) {
  const admin = createSupabaseAdminClient();

  await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      role: "admin",
      display_name: email?.split("@")[0] ?? "admin"
    },
    {
      onConflict: "id"
    }
  );
}
