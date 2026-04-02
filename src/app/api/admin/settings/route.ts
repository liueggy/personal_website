import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApiUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { settingsPayloadSchema } from "@/lib/validators";

export async function PUT(request: Request) {
  try {
    await requireAdminApiUser();
    const payload = settingsPayloadSchema.parse(await request.json());
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("site_settings")
      .upsert({
        id: 1,
        ...payload
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidatePath("/");
    revalidatePath("/contact");
    revalidatePath("/admin/settings");

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    const message = error instanceof Error ? error.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
