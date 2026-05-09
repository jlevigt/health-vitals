import type { VerifyEmailDTO } from "@health-vitals/contracts";
import type { Database, Logger } from "@health-vitals/platform";
import { AppError } from "@health-vitals/platform";
import argon2 from "argon2";

export class VerifyEmailService {
  constructor(
    private db: Database,
    private logger: Logger,
  ) {}

  async execute({ email, token }: VerifyEmailDTO) {
    const client = await this.db.connect();

    try {
      await client.query("BEGIN");

      // 1. Find user and token
      const query = `
        SELECT ev.id, ev.token_hash, ev.expires_at, u.id as user_id, u.is_active
        FROM email_verifications ev
        JOIN users u ON u.id = ev.user_id
        WHERE u.email = $1
        ORDER BY ev.created_at DESC
        LIMIT 1
      `;

      const result = await client.query(query, [email]);
      const record = result.rows[0];

      if (!record) {
        throw new AppError("Invalid verification request", 400);
      }

      if (record.is_active) {
        // Already active, just return success
        await client.query("COMMIT");
        return { message: "Email already verified" };
      }

      // 2. Verify validity (date)
      if (new Date() > new Date(record.expires_at)) {
        throw new AppError("Token expired", 400);
      }

      // 3. Verify token hash
      const valid = await argon2.verify(record.token_hash, token);
      if (!valid) {
        throw new AppError("Invalid token", 400);
      }

      // 4. Activate user
      await client.query("UPDATE users SET is_active = true WHERE id = $1", [record.user_id]);

      // 5. Delete used token
      await client.query("DELETE FROM email_verifications WHERE id = $1", [record.id]);

      await client.query("COMMIT");

      this.logger.info(`Email verified successfully for user: ${record.user_id}`);
      return { message: "Email verified successfully" };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
