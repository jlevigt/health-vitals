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
  ) {
    this.resend = new Resend(apiKey);
    this.logger.info("Resend mail provider initialized");
  }

  async sendMail(to: string, subject: string, body: string): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: "Health Is Wealth <onboarding@resend.dev>", // TODO: Configure custom domain
        to,
        subject,
        html: body,
      });

      if (error) {
        this.logger.error(`Failed to send email to ${to}: ${error.message}`);
        throw new Error(`Resend error: ${error.message}`);
      }

      this.logger.info(`Email sent to ${to} via Resend. ID: ${data?.id}`);
    } catch (err) {
      this.logger.error(`Unexpected error sending email: ${err}`);
      throw err;
    }
  }
}
