import nodemailer from "nodemailer";
import type { MailProvider } from "./interface.ts";
import type { Logger } from "../logger/interface.ts";

/**
 * NodeMailer provider configured for local testing with Ethereal Email.
 * Automatically creates test accounts and provides preview URLs for sent emails.
 */
export class NodeMailerProvider implements MailProvider {
  private transporter: nodemailer.Transporter;
  private testAccount: nodemailer.TestAccount | null = null;

  constructor(private logger: Logger) {
    // Initialize transporter without auth - will be set up on first send
    this.transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
    });

    this.logger.info("Mail provider initialized for local testing (Ethereal Email)");
  }

  /**
   * Ensures a test account is created and transporter is configured with auth.
   */
  private async ensureTestAccount(): Promise<void> {
    if (this.testAccount) {
      return;
    }

    this.logger.info("Creating Ethereal test account...");
    this.testAccount = await nodemailer.createTestAccount();

    // Update transporter with test account credentials
    this.transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: this.testAccount.user,
        pass: this.testAccount.pass,
      },
    });

    this.logger.info(`Ethereal test account created: ${this.testAccount.user}`);
  }

  async sendMail(to: string, subject: string, body: string): Promise<void> {
    try {
      // Ensure test account exists before sending
      await this.ensureTestAccount();

      const info = await this.transporter.sendMail({
        from: '"Health Data App" <no-reply@healthdata.com>',
        to,
        subject,
        html: body,
      });

      // Get preview URL for the sent email
      const previewUrl = nodemailer.getTestMessageUrl(info);

      this.logger.info(`Email sent successfully to ${to}`);
      this.logger.info(`Message ID: ${info.messageId}`);

      if (previewUrl) {
        this.logger.info(`Preview email at: ${previewUrl}`);
      } else {
        this.logger.warn("Preview URL not available. Check Ethereal Email inbox manually.");
      }
    } catch (error: any) {
      this.logger.error(`Error sending email to ${to}: ${error}`);
      throw error;
    }
  }
}
