import nodemailer from 'nodemailer';

// Try to import Resend if available
let Resend: any;
try {
  const resendModule = await import('resend');
  Resend = resendModule.Resend;
} catch (e) {
  console.log('[Email] Resend not installed, will use SMTP fallback');
}

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.SMTP_FROM || SMTP_USER || 'noreply@pabsolutions.com';
const TO_EMAIL = process.env.SMTP_TO || 'hello-pabsolutions@outlook.com';

/**
 * Sends an email using Resend API (preferred) or SMTP fallback
 */
export async function sendContactEmail(data: {
  name: string;
  email: string;
  company?: string | null;
  projectDetails?: string | null;
}) {
  const emailContent = {
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

  // Try Resend first (preferred method for cloud hosting)
  if (RESEND_API_KEY && Resend) {
    try {
      console.log('[Email] Attempting to send via Resend API...');
      const resend = new Resend(RESEND_API_KEY);
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: TO_EMAIL,
        subject: emailContent.subject,
        html: emailContent.html,
        replyTo: data.email,
      });

      if (result.error) {
        console.error('[Email] Resend API error:', result.error);
        console.log('[Email] Falling back to SMTP...');
        return await sendViaSMTP(emailContent, data.email);
      }

      console.log('[Email] Message sent successfully via Resend: %s', result.data?.id);
      return true;
    } catch (error) {
      console.error('[Email] Resend error:', error);
      console.log('[Email] Falling back to SMTP...');
      return await sendViaSMTP(emailContent, data.email);
    }
  }

  // Fallback to SMTP
  console.log('[Email] Using SMTP fallback...');
  return await sendViaSMTP(emailContent, data.email);
}

/**
 * Fallback SMTP email sending
 */
async function sendViaSMTP(
  emailContent: { subject: string; text: string; html: string },
  replyTo: string
) {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('[Email] Neither Resend nor SMTP is configured. Email not sent.');
    console.warn('[Email] To use Resend: Set RESEND_API_KEY environment variable');
    console.warn('[Email] To use SMTP: Set SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT');
    return false;
  }

  try {
    console.log('[Email] Attempting to send via SMTP...');
    console.log('[Email] SMTP Host:', SMTP_HOST);
    console.log('[Email] SMTP Port:', SMTP_PORT);

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      family: 4, // Force IPv4
      connectionTimeout: 5000,
      socketTimeout: 5000,
    });

    console.log('[Email] Verifying SMTP connection...');
    await transporter.verify();
    console.log('[Email] SMTP connection verified');

    console.log('[Email] Sending email...');
    const info = await transporter.sendMail({
      from: `"PAB Website" <${FROM_EMAIL}>`,
      to: TO_EMAIL,
      replyTo: replyTo,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });

    console.log('[Email] Message sent successfully via SMTP: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('[Email] SMTP error:', error);
    if (error instanceof Error) {
      console.error('[Email] Error message:', error.message);
      console.error('[Email] Error code:', (error as any).code);

      if (error.message.includes('timeout')) {
        console.error('[Email] Hint: Connection timeout. Render may block SMTP port 587.');
        console.error('[Email] Solution: Use Resend API instead (set RESEND_API_KEY)');
      }
    }
    return false;
  }
}
