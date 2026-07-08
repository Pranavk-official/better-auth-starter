import nodemailer, { type Transporter } from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "Better Auth Starter <no-reply@example.com>";

// Reuse a single transporter across invocations (survives HMR in dev).
const globalForMail = globalThis as unknown as {
  mailTransporter?: Transporter | null;
};

function getTransporter(): Transporter | null {
  if (!SMTP_HOST) return null;
  if (globalForMail.mailTransporter === undefined) {
    globalForMail.mailTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // 465 = implicit TLS; 587/others = STARTTLS
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
  }
  return globalForMail.mailTransporter ?? null;
}

export type SendEmailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
  const transporter = getTransporter();

  if (!transporter) {
    // No SMTP configured. In development, surface the message (including any
    // verification link) to the server console so the flow still works locally.
    // In production a missing mail server is a misconfiguration — fail loudly.
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SMTP is not configured (set SMTP_HOST). Cannot send email in production.",
      );
    }
    console.info(
      `[email] SMTP_HOST not set — email not sent.\n  to: ${to}\n  subject: ${subject}\n\n${text}\n`,
    );
    return;
  }

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html: html ?? text,
  });
}
