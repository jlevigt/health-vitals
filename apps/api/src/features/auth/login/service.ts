import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import type { Database, Logger } from "@health-vitals/infra";
import { AppError } from "@health-vitals/infra";
import { AuthenticateUserDTO } from "./types.ts";

export class AuthenticateUserService {
  constructor(private db: Database, private logger: Logger) {}

  async execute({ email, password }: AuthenticateUserDTO) {
    // 1. Find user by email
    const result = await this.db.query("SELECT id, email, password_hash, is_active FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) {
      this.logger.error(`Login attempt failed: email not found ${email}`);
      throw new AppError("Invalid credentials", 401);
    }

    // 2. Check if user is active
    if (!user.is_active) {
      this.logger.warn(`Login attempt blocked: inactive user ${email}`);
      throw new AppError("User is not active. Please verify your email.", 403);
    }

    // 3. Compare password
    const passwordMatch = await argon2.verify(user.password_hash, password);

    if (!passwordMatch) {
      this.logger.error(`Login attempt failed: incorrect password for ${email}`);
      throw new AppError("Invalid credentials", 401);
    }

    if (!process.env.SECRET_JWT_KEY) {
      this.logger.error("JWT key not configured in environment.");
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
      `INSERT INTO sessions (user_id, token_hash, expires_at) 
       VALUES ($1, $2, $3)
       RETURNING id`,
      [user.id, refreshTokenHash, expiresAt]
    );

    const sessionId = sessionResult.rows[0].id;

    this.logger.info(`User authenticated: ${user.email}`);

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
