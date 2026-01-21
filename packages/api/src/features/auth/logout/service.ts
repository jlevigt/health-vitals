import { Pool } from "node_modules/@types/pg/index.js";
import { ILogger } from "@/shared/logger/interface.ts";
import { AppError } from "@/shared/errors/app.error.ts";
import { z } from "zod";

export const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

export type LogoutDTO = z.infer<typeof logoutSchema>;

export class LogoutService {
  constructor(private db: Pool, private logger: ILogger) {}

  async execute({ refreshToken }: LogoutDTO) {
    const [sessionId] = refreshToken.split(".");
    
    // Não precisamos validar o segredo com hash caro para logout,
    // apenas revogar a sessão se o ID for válido UUID.
    // Isso evita DoS via hash calculation.
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!sessionId || !uuidRegex.test(sessionId)) {
         // Silenciosamente falha ou retorna sucesso para não vazar info
         return; 
    }

    await this.db.query(
      "UPDATE sessions SET revoked_at = NOW() WHERE id = $1",
      [sessionId]
    );

    this.logger.info(`Sessão revogada (Logout): ${sessionId}`);
  }
}
