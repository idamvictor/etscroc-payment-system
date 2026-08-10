import { NextResponse, after } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  sendRegistrationConfirmationEmail,
  sendAdminNewRegistrationEmail,
} from "@/lib/email";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
import {
  courses,
  genderOptions,
  countryOptions,
  employmentOptions,
  educationOptions,
  experienceOptions,
  jobSupportOptions,
} from "@/lib/registration-options";

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

function requiredEnum(
  formData: FormData,
  field: string,
  allowed: readonly string[],
): string | null {
  const value = requiredText(formData, field);
  if (value === null || !allowed.includes(value)) return null;
  return value;
}

export async function POST(request: Request) {
  const formData = await request.formData();

  const firstName = requiredText(formData, "firstName");
  const lastName = requiredText(formData, "lastName");
  const email = requiredText(formData, "email");
  const phone = requiredText(formData, "phone");
  const gender = requiredEnum(formData, "gender", genderOptions);
  const country = requiredEnum(formData, "country", countryOptions);
  const stateCity = requiredText(formData, "stateCity");
  const employmentStatus = requiredEnum(
    formData,
    "employmentStatus",
    employmentOptions,
  );
  const educationLevel = requiredEnum(
    formData,
    "educationLevel",
    educationOptions,
  );
  const course = requiredEnum(formData, "course", courses);
  const techExperience = requiredEnum(
    formData,
    "techExperience",
    experienceOptions,
  );
  const jobSupport = requiredEnum(formData, "jobSupport", jobSupportOptions);
  const agreeTerms = formData.get("agreeTerms") === "true";

  const missing =
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !gender ||
    !country ||
    !stateCity ||
    !employmentStatus ||
    !educationLevel ||
    !course ||
    !techExperience ||
    !jobSupport;

  if (missing) {
    return NextResponse.json(
      { ok: false, message: "Please fill in all required fields." },
      { status: 400 },
    );
  }

  if (!agreeTerms) {
    return NextResponse.json(
      { ok: false, message: "You must agree to the Terms and Conditions." },
      { status: 400 },
    );
  }

  const countryOther = requiredText(formData, "countryOther");
  if (country === "Other" && !countryOther) {
    return NextResponse.json(
      { ok: false, message: "Please specify your country." },
      { status: 400 },
    );
  }

  const employmentStatusOther = requiredText(formData, "employmentStatusOther");
  if (employmentStatus === "Other" && !employmentStatusOther) {
    return NextResponse.json(
      { ok: false, message: "Please specify your employment status." },
      { status: 400 },
    );
  }

  const educationLevelOther = requiredText(formData, "educationLevelOther");
  if (educationLevel === "Other" && !educationLevelOther) {
    return NextResponse.json(
      { ok: false, message: "Please specify your education level." },
      { status: 400 },
    );
  }

  const referralCode = requiredText(formData, "referralCode");

  const receiptFile = formData.get("receiptFile");
  if (!(receiptFile instanceof File) || receiptFile.size === 0) {
    return NextResponse.json(
      { ok: false, message: "Please attach your payment receipt." },
      { status: 400 },
    );
  }
  if (receiptFile.size > MAX_RECEIPT_BYTES) {
    return NextResponse.json(
      { ok: false, message: "Receipt file must be 5MB or smaller." },
      { status: 400 },
    );
  }
  if (!ALLOWED_RECEIPT_TYPES.includes(receiptFile.type)) {
    return NextResponse.json(
      { ok: false, message: "Receipt must be a PNG, JPG, WEBP, or PDF file." },
      { status: 400 },
    );
  }

  const registrationId = crypto.randomUUID();
  const receiptPath = `${registrationId}/${sanitizeFilename(receiptFile.name)}`;

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

  const { error: insertError } = await supabaseAdmin
    .from("registrations")
    .insert({
      id: registrationId,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      gender,
      country,
      country_other: countryOther,
      state_city: stateCity,
      employment_status: employmentStatus,
      employment_status_other: employmentStatusOther,
      education_level: educationLevel,
      education_level_other: educationLevelOther,
      course,
      tech_experience: techExperience,
      job_support: jobSupport,
      referral_code: referralCode,
      agree_terms: agreeTerms,
      receipt_path: receiptPath,
      receipt_filename: receiptFile.name,
      receipt_content_type: receiptFile.type,
      receipt_size_bytes: receiptFile.size,
    });

  if (insertError) {
    console.error("Registration insert failed:", insertError);
    await supabaseAdmin.storage.from("receipts").remove([receiptPath]);
    return NextResponse.json(
      { ok: false, message: "Registration failed, please try again." },
      { status: 500 },
    );
  }

  // Insert succeeded — registration is done. Email sends are best-effort and
  // run after the response is sent, staggered a few seconds apart so two
  // emails don't leave the same Gmail account back-to-back (looks less
  // like automated/bot traffic to spam filters).
  after(async () => {
    try {
      await sendRegistrationConfirmationEmail({ to: email, firstName, course });
      await delay(4000);
      await sendAdminNewRegistrationEmail({
        firstName,
        lastName,
        email,
        phone,
        course,
      });
    } catch (err) {
      console.error("Registration email dispatch failed:", err);
    }
  });

  return NextResponse.json({ ok: true, id: registrationId }, { status: 201 });
}
