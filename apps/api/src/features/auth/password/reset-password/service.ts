import type { PasswordResetDTO } from "@health-vitals/contracts";
import type { Database, Logger } from "@health-vitals/platform";
import { AppError } from "@health-vitals/platform";
import argon2 from "argon2";

export class ResetPasswordService {
  constructor(
    private db: Database,
    private logger: Logger,
  ) {}

  async execute({ email, token, newPassword }: PasswordResetDTO): Promise<void> {
    const client = await this.db.connect();

    try {
      await client.query("BEGIN");

      // 1. Find the latest unused reset token for this email
      const query = `
        SELECT pr.id, pr.token_hash, pr.expires_at, u.id as user_id
        FROM password_resets pr
        JOIN users u ON u.id = pr.user_id
        WHERE u.email = $1 AND pr.used_at IS NULL
        ORDER BY pr.created_at DESC
        LIMIT 1
      `;

      const result = await client.query(query, [email]);
      const record = result.rows[0];

      if (!record) {
        throw new AppError("Invalid or expired reset link", 400);
      }

      // 2. Check expiration
      if (new Date() > new Date(record.expires_at)) {
        throw new AppError("Reset link expired", 400);
      }

      // 3. Verify token hash
      const isValid = await argon2.verify(record.token_hash, token);
      if (!isValid) {
        throw new AppError("Invalid or expired reset link", 400);
      }

      // 4. Update password
      const newPasswordHash = await argon2.hash(newPassword);
      await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
        newPasswordHash,
        record.user_id,
      ]);

      // 5. Mark token as used
      await client.query("UPDATE password_resets SET used_at = NOW() WHERE id = $1", [record.id]);

      // 6. Revoke all sessions for this user (security)
      await client.query(
        "UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
        [record.user_id],
      );

      await client.query("COMMIT");
      this.logger.info(`Password reset successfully for user: ${record.user_id}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
