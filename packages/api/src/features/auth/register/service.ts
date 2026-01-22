import argon2 from "argon2";
import crypto from "node:crypto";
import type { Database, Logger, MailProvider } from "@health-data/shared";
import { AppError } from "@health-data/shared";
import { CreateUserDTO } from "./types.ts";

export class CreateUserService {
  constructor(
    private db: Database, 
    private logger: Logger,
    private mailProvider: MailProvider
  ) {}

  async execute(data: CreateUserDTO) {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Check if exists
      const exists = await client.query("SELECT id FROM users WHERE email = $1", [data.email]);

      if (exists.rows.length > 0) {
        this.logger.error(`Duplicate registration attempt: ${data.email}`);
        throw new AppError("User already exists");
      }

      // 2. Hash password
      const passwordHash = await argon2.hash(data.password);

      // 3. Create user
      const userQuery = `
        INSERT INTO users (email, password_hash) 
        VALUES ($1, $2) 
        RETURNING id, email
      `;

      const userResult = await client.query(userQuery, [data.email, passwordHash]);
      const user = userResult.rows[0];

      // 4. Create verification token
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = await argon2.hash(token);
      
      // Expires in 24h
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); 

      const verificationQuery = `
        INSERT INTO email_verifications (user_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
      `;
      
      await client.query(verificationQuery, [user.id, tokenHash, expiresAt]);

      // 5. Send email
      const verificationLink = `http://localhost:3000/auth/verify-email?token=${token}&email=${data.email}`;
      
      await this.mailProvider.sendMail(
        data.email,
        "Verify your email",
        `<p>Welcome! Click <a href="${verificationLink}">here</a> to verify your email.</p>`
      );

      await client.query('COMMIT');

      this.logger.info(`User created and email sent: ${user.id}`);
      return user;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
