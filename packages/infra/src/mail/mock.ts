import type { MailProvider } from "@health-vitals/core";

/**
 * Mock mail provider for testing.
 * Stores sent emails in memory for verification.
 */
export class MockMailProvider implements MailProvider {
  public sentEmails: Array<{ to: string; subject: string; body: string }> = [];

  async sendMail(to: string, subject: string, body: string): Promise<void> {
    this.sentEmails.push({ to, subject, body });
  }

  /**
   * Get all sent emails (for test assertions)
   */
  getSentEmails() {
    return this.sentEmails;
  }

  /**
   * Clear sent emails (for test setup)
   */
  clear() {
    this.sentEmails = [];
  }
}
