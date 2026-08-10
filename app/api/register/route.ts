import { NextResponse, after } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  sendRegistrationConfirmationEmail,
  sendAdminNewRegistrationEmail,
} from "@/lib/email";
import { formatNlsRegistrationId } from "@/lib/nls-registration-id";
import { nlsCourses } from "@/lib/registration-options";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
const ALLOWED_RECEIPT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
];

function sanitizeFilename(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned.slice(-100);
}

function requiredText(formData: FormData, field: string): string | null {
  const value = formData.get(field);
  if (typeof value !== "string" || value.trim().length === 0) return null;
  return value.trim();
}

export async function POST(request: Request) {
  const formData = await request.formData();

  const fullName = requiredText(formData, "fullName");
  const whatsappPhone = requiredText(formData, "whatsappPhone");
  const email = requiredText(formData, "email");
  const matricNumber = requiredText(formData, "matricNumber");
  const campus = requiredText(formData, "campus");
  const selectedCourses = formData
    .getAll("courses")
    .filter(
      (c): c is string => typeof c === "string" && nlsCourses.includes(c),
    );
  const totalAmountPaidRaw = requiredText(formData, "totalAmountPaid");
  const totalAmountPaid = totalAmountPaidRaw ? Number(totalAmountPaidRaw) : NaN;
  const paymentReference = requiredText(formData, "paymentReference");

  const missing =
    !fullName ||
    !whatsappPhone ||
    !email ||
    !matricNumber ||
    !campus ||
    !paymentReference;

  if (missing) {
    return NextResponse.json(
      { ok: false, message: "Please fill in all required fields." },
      { status: 400 },
    );
  }

  if (selectedCourses.length === 0) {
    return NextResponse.json(
      { ok: false, message: "Please select at least one course." },
      { status: 400 },
    );
  }

  if (!Number.isFinite(totalAmountPaid) || totalAmountPaid <= 0) {
    return NextResponse.json(
      { ok: false, message: "Please enter a valid amount paid." },
      { status: 400 },
    );
  }

  const receiptFile = formData.get("receiptFile");
  if (!(receiptFile instanceof File) || receiptFile.size === 0) {
    return NextResponse.json(
      { ok: false, message: "Please attach your payment evidence." },
      { status: 400 },
    );
  }
  if (receiptFile.size > MAX_RECEIPT_BYTES) {
    return NextResponse.json(
      { ok: false, message: "Payment evidence must be 5MB or smaller." },
      { status: 400 },
    );
  }
  if (!ALLOWED_RECEIPT_TYPES.includes(receiptFile.type)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Payment evidence must be a PNG, JPG, WEBP, or PDF file.",
      },
      { status: 400 },
    );
  }

  const rowId = crypto.randomUUID();
  const receiptPath = `${rowId}/${sanitizeFilename(receiptFile.name)}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("receipts")
    .upload(receiptPath, receiptFile, {
      contentType: receiptFile.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Receipt upload failed:", uploadError);
    return NextResponse.json(
      { ok: false, message: "Registration failed, please try again." },
      { status: 500 },
    );
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("nls_registrations")
    .insert({
      id: rowId,
      full_name: fullName,
      whatsapp_phone: whatsappPhone,
      email,
      matric_number: matricNumber,
      campus,
      courses: selectedCourses,
      total_amount_paid: totalAmountPaid,
      payment_reference: paymentReference,
      receipt_path: receiptPath,
      receipt_filename: receiptFile.name,
      receipt_content_type: receiptFile.type,
      receipt_size_bytes: receiptFile.size,
    })
    .select("registration_number")
    .single();

  if (insertError || !inserted) {
    console.error("Registration insert failed:", insertError);
    await supabaseAdmin.storage.from("receipts").remove([receiptPath]);
    return NextResponse.json(
      { ok: false, message: "Registration failed, please try again." },
      { status: 500 },
    );
  }

  const registrationId = formatNlsRegistrationId(inserted.registration_number);

  // Insert succeeded — registration is done. Email sends are best-effort and
  // run after the response is sent, staggered a few seconds apart so two
  // emails don't leave the same Gmail account back-to-back (looks less
  // like automated/bot traffic to spam filters).
  after(async () => {
    try {
      await sendRegistrationConfirmationEmail({
        to: email,
        fullName,
        courses: selectedCourses,
        registrationId,
      });
      await delay(4000);
      await sendAdminNewRegistrationEmail({
        fullName,
        whatsappPhone,
        email,
        matricNumber,
        courses: selectedCourses,
        totalAmountPaid,
        paymentReference,
        registrationId,
      });
    } catch (err) {
      console.error("Registration email dispatch failed:", err);
    }
  });

  return NextResponse.json({ ok: true, id: registrationId }, { status: 201 });
}
