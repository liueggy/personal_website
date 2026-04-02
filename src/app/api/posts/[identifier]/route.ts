import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApiUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizePostPayload } from "@/lib/validators";

type RouteContext = {
  params: Promise<{
    identifier: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { identifier } = await context.params;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", identifier)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdminApiUser();
    const { identifier } = await context.params;
    const supabase = createSupabaseAdminClient();
    const payload = normalizePostPayload(await request.json());
    const { data, error } = await supabase
      .from("posts")
      .update(payload)
      .eq("id", identifier)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${data.slug}`);
    revalidatePath("/admin/posts");

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    const message = error instanceof Error ? error.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
