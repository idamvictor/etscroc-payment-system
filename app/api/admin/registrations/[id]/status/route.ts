import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const ALLOWED_STATUSES = ["pending", "approved", "rejected"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status;

  if (typeof status !== "string" || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { ok: false, message: "Invalid status." },
      { status: 400 },
    );
  }

  const { error } = await supabaseAdmin
    .from("registrations")
    .update({ payment_status: status })
    .eq("id", id);

  if (error) {
    console.error("Failed to update payment_status:", error);
    return NextResponse.json(
      { ok: false, message: "Failed to update status." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
