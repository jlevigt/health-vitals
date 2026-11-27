import type { MailProvider } from "./interface.ts";

export interface SentEmail {
  to: string;
  subject: string;
  body: string;
  text?: string;
}

/**
 * Mock mail provider for testing.
 * Stores sent emails in memory for verification.
 */
export class MockMailProvider implements MailProvider {
  public sentEmails: SentEmail[] = [];

  async sendMail(to: string, subject: string, body: string, text?: string): Promise<void> {
    this.sentEmails.push({
      to,
      subject,
      body,
      ...(text !== undefined ? { text } : {}),
    });
  }

  /**
   * Get all sent emails (for test assertions)
   */
  getSentEmails(): SentEmail[] {
    return this.sentEmails;
  }

  /**
   * Clear sent emails (for test setup)
   */
  clear(): void {
    this.sentEmails = [];
  }
}
