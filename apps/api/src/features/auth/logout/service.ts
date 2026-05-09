import type { Database, Logger } from "@health-vitals/platform";
import { z } from "zod";

export const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

export type LogoutDTO = z.infer<typeof logoutSchema>;

export class LogoutService {
  constructor(
    private db: Database,
    private logger: Logger,
  ) {}

  async execute({ refreshToken }: LogoutDTO) {
    const [sessionId] = refreshToken.split(".");

    // Validate UUID format without expensive hash verification
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!sessionId || !uuidRegex.test(sessionId)) {
      // Silently fail to avoid leaking info
      return;
    }

    await this.db.query("UPDATE sessions SET revoked_at = NOW() WHERE id = $1", [sessionId]);

    this.logger.info(`Session revoked (Logout): ${sessionId}`);
  }
}
