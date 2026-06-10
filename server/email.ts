import nodemailer from 'nodemailer';

// Configuration for email delivery
// These should be set in Vercel environment variables
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
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
    return false;
  }

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
    const info = await transporter.sendMail(mailOptions);
    console.log('[Email] Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return false;
  }
}
