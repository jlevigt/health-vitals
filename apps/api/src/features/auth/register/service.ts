import { Pool } from "node_modules/@types/pg/index.js";
import argon2 from "argon2";
import crypto from "node:crypto";
import { AppError } from "@/shared/errors/app.error.ts";
import { ILogger } from "@/shared/logger/interface.ts";
import { IMailProvider } from "@/shared/mail/interface.ts";
import { CreateUserDTO } from "@/features/auth/register/types.ts";

export class CreateUserService {
  // Injeção de Dependência: Recebe o Banco, Logger e MailProvider
  constructor(
    private db: Pool, 
    private logger: ILogger,
    private mailProvider: IMailProvider
  ) {}

  async execute(data: CreateUserDTO) {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Verifica se existe
      const exists = await client.query("SELECT id FROM users WHERE email = $1", [data.email]);

      if (exists.rows.length > 0) {
        this.logger.error(`Tentativa de cadastro duplicado: ${data.email}`);
        throw new AppError("User already exists");
      }

      // 2. Hash da senha
      const passwordHash = await argon2.hash(data.password);

      // 3. Cria User
      const userQuery = `
        INSERT INTO users (email, password_hash) 
        VALUES ($1, $2) 
        RETURNING id, email
      `;

      const userResult = await client.query(userQuery, [data.email, passwordHash]);
      const user = userResult.rows[0];

      // 4. Cria Token de Verificação
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = await argon2.hash(token);
      
      // Expira em 24h
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); 

      const verificationQuery = `
        INSERT INTO email_verifications (user_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
      `;
      
      await client.query(verificationQuery, [user.id, tokenHash, expiresAt]);

      // 5. Envia Email
      // Em produção, isso seria uma URL real do frontend
      const verificationLink = `http://localhost:3000/auth/verify-email?token=${token}&email=${data.email}`;
      
      await this.mailProvider.sendMail(
        data.email,
        "Verify your email",
        `<p>Welcome! Click <a href="${verificationLink}">here</a> to verify your email.</p>`
      );

      await client.query('COMMIT');

      this.logger.info(`Usuário criado e email enviado: ${user.id}`);
      return user;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
