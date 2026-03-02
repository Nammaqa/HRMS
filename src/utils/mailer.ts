import nodemailer from 'nodemailer';

export interface MailOptions {
  /** Comma-separated list of email addresses or a single address */
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Sends an email using SMTP options defined in environment variables.
 *
 * Expects the following vars to be set (see `.env.local.example`):
 *
 *   SMTP_HOST
 *   SMTP_PORT
 *   SMTP_USER
 *   SMTP_PASS
 *   FROM_EMAIL     // optional, defaults to SMTP_USER
 */
export async function sendMail(options: MailOptions) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      'SMTP configuration missing. Please set SMTP_HOST, SMTP_USER and SMTP_PASS in your environment.'
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL || user,
    ...options,
  });

  return info;
}
