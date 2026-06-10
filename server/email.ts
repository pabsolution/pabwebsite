import nodemailer from 'nodemailer';
import { createConnection } from 'net';

// Configuration for email delivery
// These should be set in Render/Vercel environment variables
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // Office 365 uses STARTTLS (port 587), not TLS (port 465)
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false, // Required for some corporate email servers
  },
  family: 4, // Force IPv4 to avoid ENETUNREACH errors on cloud hosting
};

const FROM_EMAIL = process.env.SMTP_FROM || SMTP_CONFIG.auth.user;
const TO_EMAIL = process.env.SMTP_TO || 'pabsolutions@outlook.com';

/**
 * Sends an email notification for a new contact form submission.
 */
export async function sendContactEmail(data: {
  name: string;
  email: string;
  company?: string | null;
  projectDetails?: string | null;
}) {
  // If SMTP is not configured, log and return
  if (!SMTP_CONFIG.host || !SMTP_CONFIG.auth.user || !SMTP_CONFIG.auth.pass) {
    console.warn('[Email] SMTP is not configured. Submission saved to DB but email not sent.');
    console.warn('[Email] Expected env vars: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT');
    return false;
  }

  console.log('[Email] Attempting to send email...');
  console.log('[Email] From:', FROM_EMAIL);
  console.log('[Email] To:', TO_EMAIL);
  console.log('[Email] SMTP Host:', SMTP_CONFIG.host);
  console.log('[Email] SMTP Port:', SMTP_CONFIG.port);
  console.log('[Email] Using IPv4 (family: 4)');

  const transporter = nodemailer.createTransport(SMTP_CONFIG);

  const mailOptions = {
    from: `"PAB Website" <${FROM_EMAIL}>`,
    to: TO_EMAIL,
    subject: `New Project Inquiry from ${data.name}`,
    text: `
New Contact Form Submission

Name: ${data.name}
Email: ${data.email}
Company: ${data.company || 'N/A'}

Project Details:
${data.projectDetails || 'No details provided'}
    `,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">New Project Inquiry</h2>
        <div style="margin: 20px 0;">
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
          <p><strong>Company:</strong> ${data.company || 'N/A'}</p>
        </div>
        <div style="background: #f9fafb; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <h3 style="margin-top: 0; font-size: 16px;">Project Details:</h3>
          <p style="white-space: pre-wrap; color: #4b5563;">${data.projectDetails || 'No details provided'}</p>
        </div>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 30px; text-align: center;">
          Sent from PAB Solutions Website
        </p>
      </div>
    `,
  };

  try {
    console.log('[Email] Verifying SMTP connection...');
    await transporter.verify();
    console.log('[Email] SMTP connection verified successfully');

    console.log('[Email] Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('[Email] Message sent successfully: %s', info.messageId);
    console.log('[Email] Response:', info.response);
    return true;
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    if (error instanceof Error) {
      console.error('[Email] Error message:', error.message);
      console.error('[Email] Error code:', (error as any).code);
    }
    return false;
  }
}
