import { NextResponse, after } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  sendRegistrationApprovedEmail,
  sendRegistrationRejectedEmail,
} from "@/lib/email";
import { formatNlsRegistrationId } from "@/lib/nls-registration-id";

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
    .from("nls_registrations")
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
    .from("nls_registrations")
    .update({ payment_status: status })
    .eq("id", id)
    .select("email, full_name, courses, registration_number")
    .single();

  if (error) {
    console.error("Failed to update payment_status:", error);
    return NextResponse.json(
      { ok: false, message: "Failed to update status." },
      { status: 500 },
    );
  }

  // Notify the user on a genuine transition into approved/rejected — not
  // on repeat clicks of the same status, and not on "pending" (that's an
  // internal reset action, not a customer-facing outcome).
  if (
    (status === "approved" || status === "rejected") &&
    previousStatus !== status &&
    updated
  ) {
    after(async () => {
      try {
        const registrationId = formatNlsRegistrationId(
          updated.registration_number,
        );
        if (status === "approved") {
          await sendRegistrationApprovedEmail({
            to: updated.email,
            fullName: updated.full_name,
            courses: updated.courses,
            registrationId,
          });
        } else {
          await sendRegistrationRejectedEmail({
            to: updated.email,
            fullName: updated.full_name,
            courses: updated.courses,
            registrationId,
          });
        }
      } catch (err) {
        console.error("Status email dispatch failed:", err);
      }
    });
  }

  return NextResponse.json({ ok: true });
}
