import nodemailer from "nodemailer";

// Server-only module: holds Gmail SMTP credentials. Never import from a
// "use client" component.

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const ADMIN_NOTIFICATION_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL || GMAIL_USER;

const transporter =
  GMAIL_USER && GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
      })
    : null;

// Shared wrapper — mirrors the brand card look used on the registration
// form's payment-details card (orange border, light orange/white gradient,
// pill badge) so emails and the web form feel like the same product.
function renderEmailHtml(params: { badge: string; bodyHtml: string }): string {
  const { badge, bodyHtml } = params;
  return `<div style="background:#f4f4f5;padding:32px 16px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background-color:#ffffff;background-image:linear-gradient(135deg,#fff7ed 0%,#ffffff 45%,#fff7ed 100%);border:2px solid #f97316;border-radius:20px;overflow:hidden;box-shadow:0 8px 24px rgba(234,88,12,0.12);">
    <div style="padding:32px 32px 8px 32px;">
      <span style="display:inline-block;background-color:#ea580c;color:#ffffff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;padding:6px 14px;border-radius:999px;">${badge}</span>
    </div>
    <div style="padding:8px 32px 24px 32px;color:#27272a;font-size:14px;line-height:1.65;">
      ${bodyHtml}
    </div>
    <div style="padding:16px 32px;border-top:1px solid #fed7aa;background-color:#fffaf5;color:#a1a1aa;font-size:12px;">
      This is a transactional email regarding your registration with Etscroctech.
    </div>
  </div>
</div>`;
}

// Bordered, tinted key/value box — mirrors the Bank / Account Number /
// Account Name grid on the form's payment-details card. Rows stack label
// above value (rather than side-by-side table columns) so long values —
// the registration ID, a multi-course list — wrap cleanly at any width
// instead of being squeezed into a narrow column on mobile.
function renderDetailsBox(rows: { label: string; value: string }[]): string {
  const rowsHtml = rows
    .map(
      ({ label, value }, index) => `
        <div style="${index > 0 ? "margin-top:10px;padding-top:10px;border-top:1px solid #fed7aa;" : ""}">
          <div style="color:#9a3412;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">${label}</div>
          <div style="color:#18181b;font-size:14px;font-weight:600;line-height:1.4;word-break:break-word;overflow-wrap:anywhere;margin-top:2px;">${value}</div>
        </div>`,
    )
    .join("");
  return `<div style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 18px;margin:16px 0;">
    ${rowsHtml}
  </div>`;
}

async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  if (!transporter) {
    console.error("Email not sent (Gmail SMTP not configured):", opts.subject);
    return false;
  }
  try {
    await transporter.sendMail({
      from: `"Etscroctech" <${GMAIL_USER}>`,
      replyTo: GMAIL_USER,
      ...opts,
    });
    return true;
  } catch (err) {
    console.error("Failed to send email:", opts.subject, err);
    return false;
  }
}

export async function sendRegistrationConfirmationEmail(params: {
  to: string;
  fullName: string;
  courses: string[];
  registrationId: string;
}): Promise<boolean> {
  const { to, fullName, courses, registrationId } = params;
  const courseList = courses.join(", ");
  return sendMail({
    to,
    subject: `We've received your registration (${registrationId})`,
    text: `Hi ${fullName},\n\nWe've received your Nigeria Law School × ETSCROC Tech Training registration for ${courseList} along with your proof of payment.\n\nYour Registration ID is ${registrationId} — please keep this for your records.\n\nOur team will review your payment and follow up once it has been checked.`,
    html: renderEmailHtml({
      badge: "Registration Received",
      bodyHtml: `
        <p>Hi ${fullName},</p>
        <p>We've received your Nigeria Law School × ETSCROC Tech Training registration along with your proof of payment.</p>
        ${renderDetailsBox([
          { label: "Registration ID", value: registrationId },
          { label: "Courses", value: courseList },
        ])}
        <p>Our team will review your payment and follow up once it has been checked. Please keep your Registration ID for your records.</p>
      `,
    }),
  });
}

export async function sendAdminNewRegistrationEmail(params: {
  fullName: string;
  whatsappPhone: string;
  email: string;
  matricNumber: string;
  courses: string[];
  totalAmountPaid: number;
  paymentReference: string;
  registrationId: string;
}): Promise<boolean> {
  if (!ADMIN_NOTIFICATION_EMAIL) return false;
  const {
    fullName,
    whatsappPhone,
    email,
    matricNumber,
    courses,
    totalAmountPaid,
    paymentReference,
    registrationId,
  } = params;
  const courseList = courses.join(", ");
  const amount = `₦${totalAmountPaid.toLocaleString()}`;
  return sendMail({
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: `New NLS registration: ${fullName} (${registrationId})`,
    text: `${fullName} submitted a Nigeria Law School × ETSCROC Tech Training registration.\nRegistration ID: ${registrationId}\nCourses: ${courseList}\nAmount paid: ${amount}\nPayment reference: ${paymentReference}\nWhatsApp: ${whatsappPhone}\nEmail: ${email}\nMatric number: ${matricNumber}`,
    html: renderEmailHtml({
      badge: "New Registration",
      bodyHtml: `
        <p><strong>${fullName}</strong> submitted a Nigeria Law School × ETSCROC Tech Training registration.</p>
        ${renderDetailsBox([
          { label: "Registration ID", value: registrationId },
          { label: "Courses", value: courseList },
          { label: "Amount paid", value: amount },
          { label: "Payment reference", value: paymentReference },
          { label: "WhatsApp", value: whatsappPhone },
          { label: "Email", value: email },
          { label: "Matric number", value: matricNumber },
        ])}
      `,
    }),
  });
}

export async function sendRegistrationApprovedEmail(params: {
  to: string;
  fullName: string;
  courses: string[];
  registrationId: string;
}): Promise<boolean> {
  const { to, fullName, courses, registrationId } = params;
  const courseList = courses.join(", ");
  return sendMail({
    to,
    subject: "Your payment has been approved",
    text: `Hi ${fullName},\n\nYour payment for your Nigeria Law School × ETSCROC Tech Training registration (${registrationId}) for ${courseList} has been approved. Your registration is now confirmed.`,
    html: renderEmailHtml({
      badge: "Payment Approved",
      bodyHtml: `
        <p>Hi ${fullName},</p>
        <p>Your payment for your Nigeria Law School × ETSCROC Tech Training registration has been approved. Your registration is now confirmed.</p>
        ${renderDetailsBox([
          { label: "Registration ID", value: registrationId },
          { label: "Courses", value: courseList },
        ])}
      `,
    }),
  });
}

export async function sendRegistrationRejectedEmail(params: {
  to: string;
  fullName: string;
  courses: string[];
  registrationId: string;
}): Promise<boolean> {
  const { to, fullName, courses, registrationId } = params;
  const courseList = courses.join(", ");
  return sendMail({
    to,
    subject: "Update on your registration payment",
    text: `Hi ${fullName},\n\nWe were unable to verify the payment for your Nigeria Law School × ETSCROC Tech Training registration (${registrationId}) for ${courseList}. Please reply to this email or reach out so we can resolve this.`,
    html: renderEmailHtml({
      badge: "Payment Update",
      bodyHtml: `
        <p>Hi ${fullName},</p>
        <p>We were unable to verify the payment for your Nigeria Law School × ETSCROC Tech Training registration. Please reply to this email or reach out so we can resolve this.</p>
        ${renderDetailsBox([
          { label: "Registration ID", value: registrationId },
          { label: "Courses", value: courseList },
        ])}
      `,
    }),
  });
}
