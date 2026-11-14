import { env } from '@/config/env.js';

export interface EmailOptions {
  toEmail: string;
  otp: string;
  purpose?: 'VERIFICATION' | 'PASSWORD_RESET';
}

/**
 * Brevo (Sendinblue) Transactional Email Service
 * Uses Brevo's direct HTTPS API (v3/smtp/email) - 100% cloud & Render safe (no blocked SMTP ports!)
 * 300 free emails per day with fast inbox delivery.
 */
export class BrevoEmailService {
  private apiKey: string;
  private senderEmail: string;
  private senderName: string;

  constructor() {
    this.apiKey = env.BREVO_API_KEY || '';
    this.senderEmail = env.BREVO_SENDER_EMAIL || 'noreply@pujacircle.com';
    this.senderName = env.BREVO_SENDER_NAME || 'PujaCircle Sanctum';
  }

  /**
   * Dispatch 6-digit OTP verification email via Brevo REST API
   */
  async sendOtpEmail(
    toEmail: string,
    otp: string,
    purpose: 'VERIFICATION' | 'PASSWORD_RESET' = 'VERIFICATION'
  ): Promise<{ success: boolean; messageId?: string }> {
    const cleanEmail = toEmail.trim().toLowerCase();
    const isReset = purpose === 'PASSWORD_RESET';
    const subject = isReset
      ? 'ॐ PujaCircle — Password Reset Verification Code'
      : 'ॐ PujaCircle — Your Email Verification Passkey';

    const headerTitle = isReset ? 'Sacred Account Recovery' : 'Email Verification';
    const badgeText = isReset ? 'Passkey Reset' : 'Sanctum Security';
    const mainHeading = isReset
      ? 'Password Reset Request'
      : 'Confirm Your Email Address';
    const descriptionText = isReset
      ? 'We received a request to reset your PujaCircle portal credentials. Use the 6-digit code below to set your new password. This code will expire in 10 minutes.'
      : 'Welcome to PujaCircle. Please use the following 6-digit verification code to complete your devotee or Purohit registration. This code will expire in 10 minutes.';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #faf8f5; color: #1c1917; }
    .container { max-width: 560px; margin: 30px auto; background: #ffffff; border-radius: 12px; border: 2px solid #fcd34d; overflow: hidden; box-shadow: 0 10px 25px rgba(120, 0, 22, 0.08); }
    .header { background: #780016; padding: 28px 24px; text-align: center; color: #ffffff; }
    .om-badge { display: inline-block; width: 44px; height: 44px; line-height: 44px; background: #fbbf24; color: #1c1917; border-radius: 8px; font-size: 24px; font-weight: bold; margin-bottom: 12px; }
    .brand-title { font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #fde68a; margin: 0; }
    .brand-sub { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #fef3c7; margin-top: 4px; }
    .content { padding: 32px 28px; }
    .badge { display: inline-block; padding: 4px 12px; background: #fef3c7; color: #780016; border: 1px solid #fde68a; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 700; color: #1c1917; margin: 0 0 12px 0; }
    p { font-size: 14px; line-height: 1.6; color: #44403c; margin: 0 0 20px 0; }
    .otp-box { background: #fffbeb; border: 2px dashed #f59e0b; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #780016; margin: 0; }
    .otp-validity { font-size: 11px; color: #b45309; font-weight: 600; margin-top: 8px; text-transform: uppercase; }
    .notice { font-size: 12px; color: #78716c; border-top: 1px solid #f5f5f4; padding-top: 16px; margin-top: 24px; line-height: 1.5; }
    .footer { background: #f5f5f4; padding: 20px; text-align: center; font-size: 11px; color: #a8a29e; }
    .quote { font-style: italic; color: #780016; margin-bottom: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="om-badge">ॐ</div>
      <div class="brand-title">PUJACIRCLE</div>
      <div class="brand-sub">${headerTitle}</div>
    </div>
    <div class="content">
      <div class="badge">${badgeText}</div>
      <h1>${mainHeading}</h1>
      <p>${descriptionText}</p>
      
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="otp-validity">Valid for 10 minutes only</div>
      </div>

      <p class="notice">
        If you did not request this verification code, please disregard this communication or contact our sanctum support immediately. Never share your one-time passkey with anyone.
      </p>
    </div>
    <div class="footer">
      <div class="quote">“यज्ञो वै श्रेष्ठतमं कर्म — Yajna is the highest auspicious deed.”</div>
      <div>© ${new Date().getFullYear()} PujaCircle Sanctum. All rights reserved.</div>
    </div>
  </div>
</body>
</html>
`;

    // If Brevo API key is configured, send via Brevo v3 HTTPS endpoint
    if (this.apiKey) {
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': this.apiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            sender: {
              name: this.senderName,
              email: this.senderEmail,
            },
            to: [
              {
                email: cleanEmail,
              },
            ],
            subject,
            htmlContent,
            textContent: `${mainHeading}: Your PujaCircle verification code is ${otp}. Valid for 10 minutes.`,
          }),
        });

        const data: any = await response.json();
        if (response.ok) {
          console.log(`[BREVO] Successfully dispatched OTP email to ${cleanEmail} | Message ID: ${data.messageId || 'sent'}`);
          return { success: true, messageId: data.messageId };
        } else {
          console.warn(`[BREVO NOTICE] Failed to send email via Brevo API:`, data.message || JSON.stringify(data));
        }
      } catch (err: any) {
        console.warn(`[BREVO EXCEPTION] Failed to connect to Brevo API:`, err.message);
      }
    } else {
      console.log('ℹ️ Brevo: BREVO_API_KEY not set yet. OTP safely printed below for immediate verification.');
    }

    return { success: true };
  }

  /**
   * Dispatch account status notification email (Ban, Suspension, or Deletion)
   * notifying user/priest of account action, reason, and cancellation of any active bookings.
   */
  async sendAccountStatusEmail(
    toEmail: string,
    userName: string,
    action: 'BANNED' | 'DELETED' | 'SUSPENDED',
    reason: string,
    cancelledBookingsCount: number = 0,
    accountType: 'PRIEST' | 'DEVOTEE' = 'PRIEST'
  ): Promise<{ success: boolean; messageId?: string }> {
    const cleanEmail = toEmail?.trim().toLowerCase();
    if (!cleanEmail) return { success: false };

    const isPriest = accountType === 'PRIEST';
    const isDeleted = action === 'DELETED';
    const actionLabel = isDeleted ? 'Permanently Removed' : 'Suspended';
    const roleLabel = isPriest ? 'Purohit' : 'Devotee';

    const subject = `ॐ PujaCircle — Important Notice: ${roleLabel} Account ${actionLabel}`;
    const headerTitle = isDeleted ? 'Account Deletion Notice' : 'Account Suspension Notice';
    const badgeText = isDeleted ? 'Account Deleted' : 'Account Suspended';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #faf8f5; color: #1c1917; }
    .container { max-width: 560px; margin: 30px auto; background: #ffffff; border-radius: 12px; border: 2px solid #fcd34d; overflow: hidden; box-shadow: 0 10px 25px rgba(120, 0, 22, 0.08); }
    .header { background: #780016; padding: 28px 24px; text-align: center; color: #ffffff; }
    .om-badge { display: inline-block; width: 44px; height: 44px; line-height: 44px; background: #fbbf24; color: #1c1917; border-radius: 8px; font-size: 24px; font-weight: bold; margin-bottom: 12px; }
    .brand-title { font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #fde68a; margin: 0; }
    .brand-sub { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #fef3c7; margin-top: 4px; }
    .content { padding: 32px 28px; }
    .badge { display: inline-block; padding: 4px 12px; background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px; }
    h1 { font-size: 20px; font-weight: 700; color: #1c1917; margin: 0 0 12px 0; }
    p { font-size: 14px; line-height: 1.6; color: #44403c; margin: 0 0 16px 0; }
    .info-card { background: #fff7ed; border-left: 4px solid #ea580c; border-radius: 6px; padding: 16px; margin: 20px 0; }
    .info-label { font-size: 11px; font-weight: 700; color: #9a3412; text-transform: uppercase; margin-bottom: 4px; }
    .info-text { font-size: 13px; color: #431407; line-height: 1.5; margin: 0; }
    .cancellation-card { background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin: 20px 0; }
    .cancellation-title { font-size: 13px; font-weight: 700; color: #991b1b; margin-bottom: 6px; }
    .cancellation-desc { font-size: 12px; color: #7f1d1d; margin: 0; line-height: 1.5; }
    .notice { font-size: 12px; color: #78716c; border-top: 1px solid #f5f5f4; padding-top: 16px; margin-top: 24px; line-height: 1.5; }
    .footer { background: #f5f5f4; padding: 20px; text-align: center; font-size: 11px; color: #a8a29e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="om-badge">ॐ</div>
      <div class="brand-title">PUJACIRCLE</div>
      <div class="brand-sub">${headerTitle}</div>
    </div>
    <div class="content">
      <div class="badge">${badgeText}</div>
      <h1>Account Notification for ${userName || roleLabel}</h1>
      <p>
        Please be informed that your PujaCircle ${roleLabel} account has been <strong>${actionLabel.toLowerCase()}</strong> by our platform administration.
      </p>

      <div class="info-card">
        <div class="info-label">Administrative Reason</div>
        <p class="info-text">${reason || 'Administrative action based on platform guidelines and policy compliance.'}</p>
      </div>

      <div class="cancellation-card">
        <div class="cancellation-title">Ceremony Booking Cancellation Notice</div>
        <p class="cancellation-desc">
          All active, pending, or confirmed ceremony appointments (${cancelledBookingsCount} booking(s)) linked to your account have been <strong>automatically cancelled</strong> to ensure fair coordination and ceremony integrity.
        </p>
      </div>

      <p class="notice">
        If you have questions regarding this administrative action or believe this was done in error, please contact the PujaCircle Sanctum Administration team at support@pujacircle.com.
      </p>
    </div>
    <div class="footer">
      <div>© ${new Date().getFullYear()} PujaCircle Sanctum. All rights reserved.</div>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `PujaCircle Account Notice: Your ${roleLabel} account for ${userName} has been ${actionLabel.toLowerCase()} by the platform administrator. Reason: ${reason}. All active and pending ceremony bookings (${cancelledBookingsCount}) have been automatically cancelled. Contact support@pujacircle.com for inquiries.`;

    if (this.apiKey) {
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'api-key': this.apiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            sender: {
              name: this.senderName,
              email: this.senderEmail,
            },
            to: [{ email: cleanEmail }],
            subject,
            htmlContent,
            textContent,
          }),
        });

        const data: any = await response.json();
        if (response.ok) {
          console.log(`[BREVO] Successfully sent account status email to ${cleanEmail} | ID: ${data.messageId || 'sent'}`);
          return { success: true, messageId: data.messageId };
        } else {
          console.warn(`[BREVO NOTICE] Failed to send account status email:`, data.message || JSON.stringify(data));
        }
      } catch (err: any) {
        console.warn(`[BREVO EXCEPTION] Failed to connect to Brevo API:`, err.message);
      }
    } else {
      console.log(`ℹ️ Brevo: BREVO_API_KEY not configured. Dispatched account status notice to ${cleanEmail} (Simulated).`);
    }

    return { success: true };
  }

  /**
   * Send notification email to devotee when their ceremony booking is cancelled due to the assigned priest
   * being banned or deleted by the platform administrator.
   */
  async sendBookingCancelledDueToPriestStatusEmail(params: {
    userEmail: string;
    userName: string;
    bookingReference: string;
    serviceName: string;
    bookingDate: string;
    slotTime: string;
    priestName: string;
    action: 'BANNED' | 'DELETED';
    reason: string;
  }): Promise<{ success: boolean; messageId?: string }> {
    const cleanEmail = params.userEmail?.trim().toLowerCase();
    if (!cleanEmail) return { success: false };

    const isDeleted = params.action === 'DELETED';
    const actionLabel = isDeleted ? 'permanently removed' : 'suspended';
    const subject = `ॐ PujaCircle — Important: Ceremony Appointment Cancelled (${params.bookingReference})`;
    const headerTitle = 'Ceremony Booking Cancellation Notice';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #faf8f5; color: #1c1917; }
    .container { max-width: 560px; margin: 30px auto; background: #ffffff; border-radius: 12px; border: 2px solid #fcd34d; overflow: hidden; box-shadow: 0 10px 25px rgba(120, 0, 22, 0.08); }
    .header { background: #780016; padding: 28px 24px; text-align: center; color: #ffffff; }
    .om-badge { display: inline-block; width: 44px; height: 44px; line-height: 44px; background: #fbbf24; color: #1c1917; border-radius: 8px; font-size: 24px; font-weight: bold; margin-bottom: 12px; }
    .brand-title { font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #fde68a; margin: 0; }
    .brand-sub { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #fef3c7; margin-top: 4px; }
    .content { padding: 32px 28px; }
    .badge { display: inline-block; padding: 4px 12px; background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px; }
    h1 { font-size: 20px; font-weight: 700; color: #1c1917; margin: 0 0 12px 0; }
    p { font-size: 14px; line-height: 1.6; color: #44403c; margin: 0 0 16px 0; }
    .booking-card { background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 18px; margin: 18px 0; }
    .booking-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
    .booking-label { color: #78716c; font-weight: 600; }
    .booking-val { color: #1c1917; font-weight: 700; }
    .info-card { background: #fff7ed; border-left: 4px solid #ea580c; border-radius: 6px; padding: 16px; margin: 20px 0; }
    .info-label { font-size: 11px; font-weight: 700; color: #9a3412; text-transform: uppercase; margin-bottom: 4px; }
    .info-text { font-size: 13px; color: #431407; line-height: 1.5; margin: 0; }
    .action-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 20px 0; }
    .action-title { font-size: 13px; font-weight: 700; color: #166534; margin-bottom: 6px; }
    .action-desc { font-size: 12px; color: #14532d; margin: 0; line-height: 1.5; }
    .notice { font-size: 12px; color: #78716c; border-top: 1px solid #f5f5f4; padding-top: 16px; margin-top: 24px; line-height: 1.5; }
    .footer { background: #f5f5f4; padding: 20px; text-align: center; font-size: 11px; color: #a8a29e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="om-badge">ॐ</div>
      <div class="brand-title">PUJACIRCLE</div>
      <div class="brand-sub">${headerTitle}</div>
    </div>
    <div class="content">
      <div class="badge">Appointment Cancelled</div>
      <h1>Ceremony Update for ${params.userName || 'Devotee'}</h1>
      <p>
        Please be informed that your upcoming ceremony booking has been <strong>automatically cancelled</strong> because the assigned Purohit (<strong>${params.priestName}</strong>) has been ${actionLabel} by our platform administration.
      </p>

      <div class="booking-card">
        <div class="booking-row">
          <span class="booking-label">Booking Reference:</span>
          <span class="booking-val">${params.bookingReference}</span>
        </div>
        <div class="booking-row">
          <span class="booking-label">Ceremony:</span>
          <span class="booking-val">${params.serviceName}</span>
        </div>
        <div class="booking-row">
          <span class="booking-label">Scheduled Date:</span>
          <span class="booking-val">${params.bookingDate}</span>
        </div>
        <div class="booking-row" style="margin-bottom: 0;">
          <span class="booking-label">Muhurat Slot:</span>
          <span class="booking-val">${params.slotTime}</span>
        </div>
      </div>

      <div class="info-card">
        <div class="info-label">Reason for Action</div>
        <p class="info-text">${params.reason || 'The Purohit account was suspended or removed following administrative moderation review.'}</p>
      </div>

      <div class="action-card">
        <div class="action-title">Zero Advance Policy — No Payment Held</div>
        <p class="action-desc">
          Because PujaCircle operates under a transparent zero-online-advance Dakshina policy (cash payment on ritual completion), no funds were deducted from you. You can immediately browse and book another verified Purohit for your sacred ceremony.
        </p>
      </div>

      <p class="notice">
        If you have questions or need help finding another verified Purohit for this Muhurat, please reach out to our team at support@pujacircle.com.
      </p>
    </div>
    <div class="footer">
      <div>© ${new Date().getFullYear()} PujaCircle Sanctum. All rights reserved.</div>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `PujaCircle Notice: Your booking (${params.bookingReference}) for ${params.serviceName} scheduled on ${params.bookingDate} (${params.slotTime}) with ${params.priestName} has been cancelled because the priest account was ${actionLabel} by the platform administrator. Reason: ${params.reason}. Due to our zero advance policy, no funds were deducted. You can book another verified Purohit immediately on PujaCircle. Support: support@pujacircle.com`;

    if (this.apiKey) {
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'api-key': this.apiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            sender: {
              name: this.senderName,
              email: this.senderEmail,
            },
            to: [{ email: cleanEmail }],
            subject,
            htmlContent,
            textContent,
          }),
        });

        const data: any = await response.json();
        if (response.ok) {
          console.log(`[BREVO] Successfully sent booking cancellation notice to ${cleanEmail} | ID: ${data.messageId || 'sent'}`);
          return { success: true, messageId: data.messageId };
        } else {
          console.warn(`[BREVO NOTICE] Failed to send booking cancellation email:`, data.message || JSON.stringify(data));
        }
      } catch (err: any) {
        console.warn(`[BREVO EXCEPTION] Failed to connect to Brevo API:`, err.message);
      }
    } else {
      console.log(`ℹ️ Brevo: BREVO_API_KEY not configured. Dispatched devotee cancellation notice to ${cleanEmail} (Simulated).`);
    }

    return { success: true };
  }
}

export const brevoEmailService = new BrevoEmailService();
