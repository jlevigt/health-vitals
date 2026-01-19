// src/features/users/authenticate-user/authenticate-user.service.ts
import { Pool } from "node_modules/@types/pg/index.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { AppError } from "@/shared/errors/app.error.ts";
import { ILogger } from "@/shared/logger/interface.ts";
import { AuthenticateUserDTO } from "./types.ts";

export class AuthenticateUserService {
  constructor(private db: Pool, private logger: ILogger) {}

  async execute({ email, password }: AuthenticateUserDTO) {
    // 1. Find user by email
    const result = await this.db.query("SELECT id, email, password_hash, is_active FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) {
      this.logger.error(`Tentativa de login falhou: email não encontrado ${email}`);
      throw new AppError("Invalid credentials", 401);
    }

    // 2. Check if user is active
    if (!user.is_active) {
      this.logger.warn(`Tentativa de login bloqueada: usuário inativo ${email}`);
      throw new AppError("User is not active. Please verify your email.", 403);
    }

    // 3. Compare password
    const passwordMatch = await argon2.verify(user.password_hash, password);

    if (!passwordMatch) {
      this.logger.error(`Tentativa de login falhou: senha incorreta para ${email}`);
      throw new AppError("Invalid credentials", 401);
    }

    if (!process.env.SECRET_JWT_KEY) {
      this.logger.error("Chave JWT não configurada no ambiente.");
      throw new AppError("Internal server error: JWT Key not found", 500);
    }

    // 4. Generate Access Token (JWT)
    const accessToken = jwt.sign({}, process.env.SECRET_JWT_KEY, {
      subject: user.id,
      expiresIn: "15m",
    });

    // 5. Generate Refresh Token (Opaque) & Session
    const refreshTokenSecret = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = await argon2.hash(refreshTokenSecret);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const sessionResult = await this.db.query(
      `INSERT INTO sessions (user_id, refresh_token_hash, expires_at) 
       VALUES ($1, $2, $3)
       RETURNING id`,
      [user.id, refreshTokenHash, expiresAt]
    );

    const sessionId = sessionResult.rows[0].id;

    this.logger.info(`Usuário autenticado: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      accessToken,
      refreshToken: `${sessionId}.${refreshTokenSecret}`, // Format: sessionId.secret
    };
  }
}
