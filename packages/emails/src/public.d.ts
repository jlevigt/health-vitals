export type EmailLocale = "pt-BR" | "en-US";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface RenderVerifyEmailInput {
  verificationUrl: string;
  locale?: EmailLocale;
  expiresInHours?: number;
}

export interface RenderPasswordResetInput {
  resetUrl: string;
  locale?: EmailLocale;
  expiresInHours?: number;
}

export declare function renderVerifyEmail(input: RenderVerifyEmailInput): Promise<RenderedEmail>;

export declare function renderPasswordResetEmail(
  input: RenderPasswordResetInput,
): Promise<RenderedEmail>;
