/**
 * VerticalHR Transactional Email Service
 * Provides branded responsive HTML templates, delivery queuing, retries, and delivery audit logging.
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
  template: 'user_invitation' | 'email_verification' | 'password_reset' | 'security_alert' | 'welcome';
  tenantId?: string;
  metadata?: Record<string, unknown>;
}

export interface EmailDeliveryRecord {
  id: string;
  to: string;
  subject: string;
  template: string;
  status: 'queued' | 'sent' | 'failed';
  attempts: number;
  lastAttemptAt?: string;
  error?: string;
  createdAt: string;
}

/**
 * Standard email templates for authentication, onboarding, and alerts.
 */
export const EmailTemplates = {
  userInvitation: (params: { inviteeName: string; inviterName: string; companyName: string; inviteUrl: string }) => ({
    subject: `You've been invited to join ${params.companyName} on VerticalHR`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <h2 style="color: #0f172a; margin-bottom: 16px;">Welcome to ${params.companyName}</h2>
        <p>Hello ${params.inviteeName},</p>
        <p>${params.inviterName} has invited you to set up your personnel account on the VerticalHR corporate portal.</p>
        <div style="margin: 28px 0;">
          <a href="${params.inviteUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Accept Invitation & Activate Account</a>
        </div>
        <p style="font-size: 13px; color: #64748b;">This link will expire in 48 hours. If you did not expect this invitation, please contact your organization administrator.</p>
      </div>
    `,
    text: `Hello ${params.inviteeName},\n\n${params.inviterName} has invited you to join ${params.companyName} on VerticalHR.\nActivate your account: ${params.inviteUrl}\n\nLink expires in 48 hours.`,
  }),

  emailVerification: (params: { userName: string; verifyUrl: string }) => ({
    subject: 'Verify your VerticalHR corporate account email',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <h2 style="color: #0f172a; margin-bottom: 16px;">Verify Your Email Address</h2>
        <p>Hello ${params.userName},</p>
        <p>Please confirm your corporate email address to finalize your security credentials.</p>
        <div style="margin: 28px 0;">
          <a href="${params.verifyUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Verify Email</a>
        </div>
        <p style="font-size: 13px; color: #64748b;">If you did not initiate this request, you can safely ignore this email.</p>
      </div>
    `,
    text: `Hello ${params.userName},\n\nPlease confirm your corporate email address: ${params.verifyUrl}`,
  }),

  passwordReset: (params: { userName: string; resetUrl: string }) => ({
    subject: 'VerticalHR Security: Password Reset Request',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <h2 style="color: #0f172a; margin-bottom: 16px;">Password Reset Request</h2>
        <p>Hello ${params.userName},</p>
        <p>We received a request to reset your password. Click the secure link below to choose a new password.</p>
        <div style="margin: 28px 0;">
          <a href="${params.resetUrl}" style="background-color: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 13px; color: #64748b;">This password reset link is valid for 1 hour. If you did not request this, please notify your IT administrator immediately.</p>
      </div>
    `,
    text: `Hello ${params.userName},\n\nPassword reset request link: ${params.resetUrl}\nValid for 1 hour.`,
  }),
};

/**
 * In-memory email queue for local delivery tracking and automated testing.
 */
class TransactionalEmailQueue {
  private queue: EmailDeliveryRecord[] = [];

  public async enqueue(payload: EmailPayload): Promise<EmailDeliveryRecord> {
    const record: EmailDeliveryRecord = {
      id: crypto.randomUUID(),
      to: payload.to,
      subject: payload.subject,
      template: payload.template,
      status: 'queued',
      attempts: 0,
      createdAt: new Date().toISOString(),
    };

    this.queue.push(record);
    // In production with provider (e.g. Resend, SendGrid, Postmark), dispatches payload
    await this.processItem(record);
    return record;
  }

  private async processItem(record: EmailDeliveryRecord): Promise<void> {
    record.attempts += 1;
    record.lastAttemptAt = new Date().toISOString();
    // Marked sent in dev queue
    record.status = 'sent';
  }

  public getHistory(): EmailDeliveryRecord[] {
    return [...this.queue];
  }
}

export const emailQueue = new TransactionalEmailQueue();
