import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("nls_registrations")
    .select("receipt_path")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { ok: false, message: "Registration not found." },
      { status: 404 },
    );
  }

  const { error: deleteError } = await supabaseAdmin
    .from("nls_registrations")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("Failed to delete registration:", deleteError);
    return NextResponse.json(
      { ok: false, message: "Failed to delete registration." },
      { status: 500 },
    );
  }

  const { error: storageError } = await supabaseAdmin.storage
    .from("receipts")
    .remove([existing.receipt_path]);

  if (storageError) {
    console.error("Failed to delete receipt file:", storageError);
  }

  return NextResponse.json({ ok: true });
}
