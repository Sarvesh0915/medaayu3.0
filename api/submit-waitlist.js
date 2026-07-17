import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Change this once you decide on a final sender address.
// It must be on the domain you verified in Resend (medaayu.in).
const FROM_EMAIL = 'MedAayu <hello@medaayu.in>';
const ADMIN_EMAIL = 'medaayu07@gmail.com';

// Optional: keep logging signups to your existing Google Sheet too.
const GOOGLE_SHEET_ENDPOINT = process.env.GOOGLE_SHEET_ENDPOINT || '';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { name, phone, email } = req.body || {};

  if (!name || !phone || !email) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }

  // 1) Confirmation email to the person who joined
  const firstName = name.trim().split(' ')[0];
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "You're on the MedAayu waitlist! 🎉",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#333;font-size:15px;line-height:1.6;">
          <p>Hi ${firstName},</p>
          <p>Thank you for joining our wishlist! 🎉<br>
          We've successfully received your details, and you're now on our priority list.</p>
          <p>As soon as we launch, you'll be among the first to know. We'll keep you updated with:</p>
          <ul style="padding-left:20px;">
            <li>Early access to our platform</li>
            <li>Product updates and new features</li>
            <li>Exclusive offers and announcements</li>
          </ul>
          <p>We're excited to have you with us and can't wait to share what's coming next.</p>
          <p>If you have any questions, simply reply to this email—we'd love to hear from you.</p>
          <p>Thank you for your interest!</p>
          <p>Best regards,<br>The MedAayu Team</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Resend confirmation email failed:', err);
    // Don't fail the whole request just because the email failed —
    // the person should still be counted as joined.
  }

  // 2) Notify yourself of the new signup
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New MedAayu waitlist signup: ${name}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email}</p>
      `,
    });
  } catch (err) {
    console.error('Resend admin notification failed:', err);
  }

  // 3) Keep logging to your existing Google Sheet, if configured
  if (GOOGLE_SHEET_ENDPOINT) {
    try {
      const params = new URLSearchParams({ name, phone, email });
      await fetch(GOOGLE_SHEET_ENDPOINT, {
        method: 'POST',
        body: params,
      });
    } catch (err) {
      console.error('Google Sheet logging failed:', err);
    }
  }

  return res.status(200).json({ ok: true });
}
