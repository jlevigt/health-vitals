/**
 * Mail provider interface for dependency injection
 */
export interface MailProvider {
  /**
   * Send a transactional email
   * @param to Recipient email address
   * @param subject Email subject
   * @param body Email body (HTML or plain text)
   */
  sendMail(to: string, subject: string, body: string): Promise<void>;
}
