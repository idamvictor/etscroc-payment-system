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
    text: `Hi ${firstName},\n\nThanks for registering for ${course}. We've received your submission and payment receipt, and our team will review it shortly.\n\nWe'll email you again once your payment is approved.`,
    html: `<p>Hi ${firstName},</p>
      <p>Thanks for registering for <strong>${course}</strong>. We've received your submission and payment receipt, and our team will review it shortly.</p>
      <p>We'll email you again once your payment is approved.</p>`,
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
    text: `${firstName} ${lastName} just registered for ${course}.\nEmail: ${email}\nPhone: ${phone}`,
    html: `<p><strong>${firstName} ${lastName}</strong> just registered for <strong>${course}</strong>.</p>
      <p>Email: ${email}<br/>Phone: ${phone}</p>`,
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
    text: `Hi ${firstName},\n\nGreat news — your payment for ${course} has been approved. You're all set!`,
    html: `<p>Hi ${firstName},</p>
      <p>Great news — your payment for <strong>${course}</strong> has been approved. You're all set!</p>`,
  });
}
