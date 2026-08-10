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
  firstName: string;
  course: string;
}): Promise<boolean> {
  const { to, firstName, course } = params;
  return sendMail({
    to,
    subject: "We've received your registration",
    text: `Hi ${firstName},\n\nWe've received your registration for ${course} along with your payment receipt. Our team will review it and follow up once it has been checked.\n\nYou'll receive another email once your payment has been approved.`,
    html: renderEmailHtml(`
      <p>Hi ${firstName},</p>
      <p>We've received your registration for <strong>${course}</strong> along with your payment receipt. Our team will review it and follow up once it has been checked.</p>
      <p>You'll receive another email once your payment has been approved.</p>
    `),
  });
}

export async function sendAdminNewRegistrationEmail(params: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  course: string;
}): Promise<boolean> {
  if (!ADMIN_NOTIFICATION_EMAIL) return false;
  const { firstName, lastName, email, phone, course } = params;
  return sendMail({
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: `New registration: ${firstName} ${lastName}`,
    text: `${firstName} ${lastName} submitted a registration for ${course}.\nEmail: ${email}\nPhone: ${phone}`,
    html: renderEmailHtml(`
      <p><strong>${firstName} ${lastName}</strong> submitted a registration for <strong>${course}</strong>.</p>
      <p>Email: ${email}<br/>Phone: ${phone}</p>
    `),
  });
}

export async function sendRegistrationApprovedEmail(params: {
  to: string;
  firstName: string;
  course: string;
}): Promise<boolean> {
  const { to, firstName, course } = params;
  return sendMail({
    to,
    subject: "Your payment has been approved",
    text: `Hi ${firstName},\n\nYour payment for ${course} has been approved. Your registration is now confirmed.`,
    html: renderEmailHtml(`
      <p>Hi ${firstName},</p>
      <p>Your payment for <strong>${course}</strong> has been approved. Your registration is now confirmed.</p>
    `),
  });
}

export async function sendRegistrationRejectedEmail(params: {
  to: string;
  firstName: string;
  course: string;
}): Promise<boolean> {
  const { to, firstName, course } = params;
  return sendMail({
    to,
    subject: "Update on your registration payment",
    text: `Hi ${firstName},\n\nWe were unable to verify your payment receipt for ${course}. Please reply to this email or reach out so we can resolve this.`,
    html: renderEmailHtml(`
      <p>Hi ${firstName},</p>
      <p>We were unable to verify your payment receipt for <strong>${course}</strong>. Please reply to this email or reach out so we can resolve this.</p>
    `),
  });
}
