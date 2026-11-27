import { Resend } from "resend";
import type { Logger } from "../logger/interface.ts";
import type { MailProvider } from "./interface.ts";

/**
 * Resend provider for production email sending.
 */
export class ResendProvider implements MailProvider {
  private resend: Resend;

  constructor(
    private logger: Logger,
    apiKey: string,
    private fromAddress = "HealthVitals <noreply@binderlex.com>",
  ) {
    this.resend = new Resend(apiKey);
    this.logger.info("Resend mail provider initialized");
  }

  async sendMail(to: string, subject: string, body: string, text?: string): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject,
        html: body,
        ...(text ? { text } : {}),
      });

      if (error) {
        this.logger.error(`Failed to send email to ${to}: ${error.message}`);
        throw new Error(`Resend error: ${error.message}`);
      }

      this.logger.info(`Email sent to ${to} via Resend. ID: ${data?.id}`);
    } catch (err: unknown) {
      this.logger.error(`Unexpected error sending email: ${err}`);
      throw err;
    }
  }
}
