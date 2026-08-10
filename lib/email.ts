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

// Shared wrapper so all three emails look like they come from the same
// place instead of bare unstyled text.
function renderEmailHtml(bodyHtml: string): string {
  return `<div style="background:#f4f4f5;padding:32px 16px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e4e4e7;">
    <div style="background:#111827;padding:20px 24px;">
      <span style="color:#ffffff;font-size:16px;font-weight:600;letter-spacing:0.02em;">Etscroctech</span>
    </div>
    <div style="padding:24px;color:#27272a;font-size:14px;line-height:1.6;">
      ${bodyHtml}
    </div>
    <div style="padding:16px 24px;border-top:1px solid #e4e4e7;color:#a1a1aa;font-size:12px;">
      This is a transactional email regarding your registration with Etscroctech.
    </div>
  </div>
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
    html: renderEmailHtml(`
      <p>Hi ${fullName},</p>
      <p>We've received your Nigeria Law School × ETSCROC Tech Training registration for <strong>${courseList}</strong> along with your proof of payment.</p>
      <p>Your Registration ID is <strong>${registrationId}</strong> — please keep this for your records.</p>
      <p>Our team will review your payment and follow up once it has been checked.</p>
    `),
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
    html: renderEmailHtml(`
      <p><strong>${fullName}</strong> submitted a Nigeria Law School × ETSCROC Tech Training registration.</p>
      <p>Registration ID: <strong>${registrationId}</strong><br/>
      Courses: ${courseList}<br/>
      Amount paid: ${amount}<br/>
      Payment reference: ${paymentReference}<br/>
      WhatsApp: ${whatsappPhone}<br/>
      Email: ${email}<br/>
      Matric number: ${matricNumber}</p>
    `),
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
    html: renderEmailHtml(`
      <p>Hi ${fullName},</p>
      <p>Your payment for your Nigeria Law School × ETSCROC Tech Training registration (<strong>${registrationId}</strong>) for <strong>${courseList}</strong> has been approved. Your registration is now confirmed.</p>
    `),
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
    html: renderEmailHtml(`
      <p>Hi ${fullName},</p>
      <p>We were unable to verify the payment for your Nigeria Law School × ETSCROC Tech Training registration (<strong>${registrationId}</strong>) for <strong>${courseList}</strong>. Please reply to this email or reach out so we can resolve this.</p>
    `),
  });
}
