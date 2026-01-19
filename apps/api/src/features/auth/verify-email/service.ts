import { Pool } from "node_modules/@types/pg/index.js";
import argon2 from "argon2";
import { AppError } from "@/shared/errors/app.error.ts";
import { ILogger } from "@/shared/logger/interface.ts";
import { VerifyEmailDTO } from "./types.ts";

export class VerifyEmailService {
  constructor(private db: Pool, private logger: ILogger) {}

  async execute({ email, token }: VerifyEmailDTO) {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // 1. Busca usuário e token
      // Buscamos o registro mais recente de verificação para este usuário que não expirou
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
         // Já ativo, só retorna sucesso
         await client.query('COMMIT');
         return { message: "Email already verified" };
      }

      // 2. Verifica validade (data)
      if (new Date() > new Date(record.expires_at)) {
        throw new AppError("Token expired", 400);
      }

      // 3. Verifica hash do token
      const valid = await argon2.verify(record.token_hash, token);
      if (!valid) {
         throw new AppError("Invalid token", 400);
      }

      // 4. Ativa usuário
      await client.query("UPDATE users SET is_active = true WHERE id = $1", [record.user_id]);
      
      // 5. Opcional: Remove o token usado ou marca como usado (se tivesse coluna used_at)
      // Como na tabela fornecida não tem 'used_at' para verifications, podemos deletar
      await client.query("DELETE FROM email_verifications WHERE id = $1", [record.id]);

      await client.query('COMMIT');
      
      this.logger.info(`Email verificado com sucesso para user: ${record.user_id}`);
      return { message: "Email verified successfully" };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
