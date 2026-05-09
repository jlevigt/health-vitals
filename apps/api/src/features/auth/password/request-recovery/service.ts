import crypto from "node:crypto";
import type { PasswordRecoveryRequestDTO } from "@health-vitals/contracts";
import type { Database, Logger, MailProvider } from "@health-vitals/platform";
import argon2 from "argon2";

export class RequestRecoveryService {
  constructor(
    private db: Database,
    private logger: Logger,
    private mailProvider: MailProvider,
  ) {}

  async execute({ email }: PasswordRecoveryRequestDTO): Promise<void> {
    const result = await this.db.query(
      "SELECT id FROM users WHERE email = $1 AND is_active = true",
      [email],
    );

    const user = result.rows[0];

    // Security best practice: don't reveal if user exists
    if (!user) {
      this.logger.info(`Password recovery requested for non-existent or inactive email: ${email}`);
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = await argon2.hash(token);
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await this.db.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt],
    );

    const webUrl = process.env.WEB_URL || "http://localhost:5173";
    const resetLink = `${webUrl}/reset-password?token=${token}&email=${email}`;

    await this.mailProvider.sendMail(
      email,
      "Password Recovery",
      `<p>You requested a password reset. Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    );

    this.logger.info(`Password recovery email sent to: ${email}`);
  }
}
