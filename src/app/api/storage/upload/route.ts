import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const allowedBuckets = new Set(["post-covers", "project-assets", "site-assets"]);

function getExtension(filename: string) {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.at(-1) : "bin";
}

export async function POST(request: Request) {
  try {
    await requireAdminApiUser();
    const supabase = createSupabaseAdminClient();
    const formData = await request.formData();
    const bucket = String(formData.get("bucket") || "");
    const file = formData.get("file");

    if (!allowedBuckets.has(bucket)) {
      return NextResponse.json({ error: "Unsupported bucket" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = getExtension(file.name);
    const path = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const {
      data: { publicUrl }
    } = supabase.storage.from(bucket).getPublicUrl(path);

    return NextResponse.json({
      data: {
        bucket,
        path,
        publicUrl
      }
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
