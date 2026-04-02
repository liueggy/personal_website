import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { contactPayloadSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const payload = contactPayloadSchema.parse(await request.json());
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("messages").insert(payload);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
