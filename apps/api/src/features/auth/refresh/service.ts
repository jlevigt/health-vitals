import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import type { Database, Logger } from "@health-vitals/infra";
import { AppError } from "@health-vitals/infra";
import { RefreshDTO } from "./types.ts";

export class RefreshTokenService {
  constructor(private db: Database, private logger: Logger) {}

  async execute({ refreshToken }: RefreshDTO) {
    if (!process.env.SECRET_JWT_KEY) {
       throw new AppError("Internal server error: JWT Key not found", 500);
    }

    const client = await this.db.connect();

    try {
      await client.query("BEGIN");

      const [sessionId, secret] = refreshToken.split(".");
      
      if (!sessionId || !secret) {
          throw new AppError("Invalid token format", 400);
      }

      // UUID validation
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
        throw new AppError("Invalid or expired session", 401);
      }

      // Validate expiration
      if (new Date() > new Date(session.expires_at)) {
        throw new AppError("Session expired", 401);
      }

      // Validate hash
      const isValid = await argon2.verify(session.token_hash, secret);
      if (!isValid) {
         // Token invalid for this session - possible theft
         await client.query("UPDATE sessions SET revoked_at = NOW() WHERE id = $1", [sessionId]);
         this.logger.warn(`Possible session theft detected. Session ${sessionId} revoked.`);
         throw new AppError("Invalid token", 401);
      }

      // ROTATION: Generate new pair
      const newSecret = crypto.randomBytes(32).toString('hex');
      const newHash = await argon2.hash(newSecret);
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Renew 7 days

      // Update session
      await client.query(
        `UPDATE sessions 
         SET token_hash = $1, expires_at = $2 
         WHERE id = $3`,
        [newHash, newExpiresAt, sessionId]
      );

      // Generate new JWT
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
