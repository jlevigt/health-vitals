import type { MailProvider } from "./interface.ts";
import type { Logger } from "../logger/interface.ts";

/**
 * Resend provider for production email sending.
 * TODO: Implement actual Resend integration when ready for production.
 */
export class ResendProvider implements MailProvider {
  constructor(private logger: Logger) {
    this.logger.info("Resend mail provider initialized");
  }

  async sendMail(to: string, subject: string, _body: string): Promise<void> {
    // TODO: Implement Resend API integration
    // const resend = new Resend(this.apiKey);
    // await resend.emails.send({
    //   from: 'Health Data App <no-reply@healthdata.com>',
    //   to,
    //   subject,
    //   html: body,
    // });
    
    this.logger.warn("ResendProvider not yet implemented, email not sent", { to, subject });
    throw new Error("ResendProvider not yet implemented");
  }
}
