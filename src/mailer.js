// src/mailer.js
// Sends the digest email via Nodemailer + Gmail SMTP (100% free)
//
// Gmail one-time setup:
//   1. Enable 2-Step Verification on your Google account
//   2. Go to myaccount.google.com → Security → App Passwords
//   3. Create an App Password for "Mail" → copy the 16-char password
//   4. Add to GitHub Secrets:
//        GMAIL_USER        → you@gmail.com
//        GMAIL_APP_PASSWORD → xxxx xxxx xxxx xxxx
//        TO_EMAIL          → recipient@gmail.com (can be same as GMAIL_USER)

import nodemailer from 'nodemailer';

/**
 * Build a Gmail SMTP transporter.
 */
function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      'Missing GMAIL_USER or GMAIL_APP_PASSWORD env vars.\n' +
      'Generate an App Password at: https://myaccount.google.com/apppasswords'
    );
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

/**
 * Send the daily digest email.
 *
 * @param {{ html: string, text: string, subject: string }} params
 */
export async function sendEmail({ html, text, subject }) {
  const from = process.env.GMAIL_USER;
  const to   = process.env.TO_EMAIL ?? from; // defaults to sending to yourself

  const transporter = createTransporter();

  const info = await transporter.sendMail({
    from: `"Tech Digest 📬" <${from}>`,
    to,
    subject,
    text,
    html,
  });

  console.log(`✅ Email sent! Message-ID: ${info.messageId}`);
  return info;
}
