import { MailOptions } from "./mailer";

const stripTrailingSlash = (url: string) => url.replace(/\/$/, "");

export async function sendMailViaVercel(options: MailOptions) {
  const baseUrl = process.env.VERCEL_MAIL_URL;
  if (!baseUrl) {
    throw new Error("VERCEL_MAIL_URL not set. Set it in your environment variables.");
  }

  const url = `${stripTrailingSlash(baseUrl)}/api/send-email`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Optional: use a shared secret header for security
      ...(process.env.VERCEL_MAIL_SECRET
        ? { "x-mail-secret": process.env.VERCEL_MAIL_SECRET }
        : {}),
    },
    body: JSON.stringify(options),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `Vercel mail API error (${response.status}): ${
        (body && body.error) || response.statusText
      }`
    );
  }

  return body;
}
