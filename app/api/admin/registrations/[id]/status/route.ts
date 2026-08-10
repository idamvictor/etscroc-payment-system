import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendRegistrationApprovedEmail } from "@/lib/email";

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

  // Read prior status first so we only send the "approved" email on a
  // genuine pending/rejected -> approved transition, not on repeat clicks.
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("registrations")
    .select("payment_status")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    console.error(
      "Failed to load registration before status update:",
      fetchError,
    );
    return NextResponse.json(
      { ok: false, message: "Failed to update status." },
      { status: 500 },
    );
  }

  const previousStatus = existing.payment_status;

  const { data: updated, error } = await supabaseAdmin
    .from("registrations")
    .update({ payment_status: status })
    .eq("id", id)
    .select("email, first_name, course")
    .single();

  if (error) {
    console.error("Failed to update payment_status:", error);
    return NextResponse.json(
      { ok: false, message: "Failed to update status." },
      { status: 500 },
    );
  }

  if (status === "approved" && previousStatus !== "approved" && updated) {
    try {
      await sendRegistrationApprovedEmail({
        to: updated.email,
        firstName: updated.first_name,
        course: updated.course,
      });
    } catch (err) {
      console.error("Approval email dispatch failed:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
