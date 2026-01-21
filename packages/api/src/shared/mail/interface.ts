// src/shared/providers/mail/mail.interface.ts

export interface IMailProvider {
  /**
   * Envia um email transacional.
   * @param to Destinatário.
   * @param subject Assunto.
   * @param body Corpo do email (HTML ou Texto).
   */
  sendMail(to: string, subject: string, body: string): Promise<void>;
}
