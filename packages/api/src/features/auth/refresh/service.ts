import { Pool } from "node_modules/@types/pg/index.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { AppError } from "@/shared/errors/app.error.ts";
import { ILogger } from "@/shared/logger/interface.ts";
import { RefreshDTO } from "./types.ts";

export class RefreshTokenService {
  constructor(private db: Pool, private logger: ILogger) {}

  async execute({ refreshToken }: RefreshDTO) {
    if (!process.env.SECRET_JWT_KEY) {
       throw new AppError("Internal server error: JWT Key not found", 500);
    }

    const client = await this.db.connect();

    try {
      await client.query("BEGIN");

      // 1. Encontra a sessão válida (não revogada e não expirada)
      // Como o token está hasheado, não podemos buscar diretamente pelo hash facilmente se não tivermos o ID da sessão ou usuário.
      // E como o RefreshToken é opaco e só temos ele...
      // PERA! Se a tabela tem index no hash, e a gente recebe o token cru...
      // O problema é: a gente recebe o token cru, mas no banco ta hasheado. Argon2 é lento e tem salt.
      // NÃO DÁ pra fazer "WHERE refresh_token_hash = hash(input)".
      
      // SOLUÇÃO: O Refresh Token geralmente é "sessionId.tokenSecret" OU a gente itera (ruim)
      // OU a gente armazena o token de uma forma determinística (SHA256) SE precisar buscar por ele.
      // MAS no schema fornecido usamos Argon2 (que tem salt aleatório).
      
      // VAMOS VER O SCHEMA:
      // token_hash CHAR(64) NOT NULL
      
      // Se for Argon2, o tamanho é maior que 64 chars geralmente (~97). 
      // Se o schema diz CHAR(64), provavelmente espera SHA256 (que é determinístico e rápido).
      // VOU ASSUMIR SHA256 para o Refresh Token (já que é um token de alta entropia gerado pelo sistema, não senha de usuário).
      // Se fosse senha, teria que ser Argon/Bcrypt. Token de máquina pode ser SHA256 rápido.
      
      // O codigo anterior de login usou argon2.hash(refreshToken). Isso vai gerar string longa.
      // Vou ajustar o Login para usar SHA256 também ou mudar minha estratégia aqui.
      // Se o login já usou argon2, eu preciso validar todos tokens do usuario? Não tenho o user_id aqui.
      
      // CORREÇÃO DE ROTA:
      // O LoginService anterior fez: `const refreshTokenHash = await argon2.hash(refreshToken);`
      // Isso impede lookup direto.
      // Vou alterar o LoginService para retornar o ID da sessão junto com o token? 
      // Ou melhor: O Refresh Token enviado pro cliente ser "sessionId.randomSecret".
      // Assim eu busco a sessão pelo ID e valido o hash do secret com Argon2.
      // É A MELHOR PRÁTICA.
      
      // VOU REFAZER O LOGIN SERVICE EM SEGUIDA.
      // POR ENQUANTO VOU IMPLEMENTAR O REFRESH ASSUMINDO "sessionId.secret".
      
      const [sessionId, secret] = refreshToken.split(".");
      
      if (!sessionId || !secret) {
          throw new AppError("Invalid token format", 400);
      }

      // Validação de UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(sessionId)) {
          throw new AppError("Invalid token format", 400);
      }

      const query = `
        SELECT s.*, u.email, u.id as user_id
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.id = $1 AND s.revoked_at IS NULL
      `;
      
      const result = await client.query(query, [sessionId]);
      const session = result.rows[0];

      if (!session) {
        // Pode ser tentativa de reuso ou ID inválido
        throw new AppError("Invalid or expired session", 401);
      }

      // Valida expiração
      if (new Date() > new Date(session.expires_at)) {
        throw new AppError("Session expired", 401);
      }

      // Valida Hash
      const isValid = await argon2.verify(session.refresh_token_hash, secret);
      if (!isValid) {
         // Token inválido para esta sessão! ROTAÇÃO DETECTADA?
         // Se a sessão existe mas o token não bate, pode ser roubo.
         // Por segurança, revogamos a sessão inteira.
         await client.query("UPDATE sessions SET revoked_at = NOW() WHERE id = $1", [sessionId]);
         this.logger.warn(`Possível roubo de sessão detectado. Sessão ${sessionId} revogada.`);
         throw new AppError("Invalid token", 401);
      }

      // ROTAÇÃO: Gera novo par
      const newSecret = crypto.randomBytes(32).toString('hex');
      const newHash = await argon2.hash(newSecret);
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Renova 7 dias

      // Atualiza a sessão
      await client.query(
        `UPDATE sessions 
         SET refresh_token_hash = $1, expires_at = $2 
         WHERE id = $3`,
        [newHash, newExpiresAt, sessionId]
      );

      // Gera novo JWT
      const newAccessToken = jwt.sign({}, process.env.SECRET_JWT_KEY, {
        subject: session.user_id,
        expiresIn: "15m",
      });

      await client.query("COMMIT");

      return {
        accessToken: newAccessToken,
        refreshToken: `${sessionId}.${newSecret}`
      };

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
