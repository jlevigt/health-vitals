import type { PasswordChangeDTO } from "@health-vitals/contracts";
import type { Database, Logger } from "@health-vitals/platform";
import { AppError, UnauthorizedError } from "@health-vitals/platform";
import argon2 from "argon2";

export class ChangePasswordService {
  constructor(
    private db: Database,
    private logger: Logger,
  ) {}

  async execute(
    userId: string,
    { currentPassword, newPassword }: PasswordChangeDTO,
  ): Promise<void> {
    const result = await this.db.query("SELECT password_hash FROM users WHERE id = $1", [userId]);

    const user = result.rows[0];
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // 1. Verify current password
    const isMatch = await argon2.verify(user.password_hash, currentPassword);
    if (!isMatch) {
      throw new UnauthorizedError("Incorrect current password");
    }

    // 2. Update to new password
    const newPasswordHash = await argon2.hash(newPassword);
    await this.db.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      newPasswordHash,
      userId,
    ]);

    // 3. Revoke other sessions (optional but recommended)
    // For now we just update the password.

    this.logger.info(`Password changed successfully for user: ${userId}`);
  }
}
