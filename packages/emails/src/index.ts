import { createElement } from "react";
import { render } from "react-email";
import type { EmailLocale } from "./components/EmailLayout.tsx";
import { PASSWORD_RESET_SUBJECTS, PasswordReset } from "./emails/PasswordReset.tsx";
import { VERIFY_EMAIL_SUBJECTS, VerifyEmail } from "./emails/VerifyEmail.tsx";

export type { EmailLocale };

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

export async function renderVerifyEmail(input: RenderVerifyEmailInput): Promise<RenderedEmail> {
  const locale: EmailLocale = input.locale ?? "pt-BR";
  const expiresInHours = input.expiresInHours ?? 24;

  const element = createElement(VerifyEmail, {
    verificationUrl: input.verificationUrl,
    locale,
    expiresInHours,
  });

  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);

  return {
    subject: VERIFY_EMAIL_SUBJECTS[locale],
    html,
    text,
  };
}

export async function renderPasswordResetEmail(
  input: RenderPasswordResetInput,
): Promise<RenderedEmail> {
  const locale: EmailLocale = input.locale ?? "pt-BR";
  const expiresInHours = input.expiresInHours ?? 1;

  const element = createElement(PasswordReset, {
    resetUrl: input.resetUrl,
    locale,
    expiresInHours,
  });

  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);

  return {
    subject: PASSWORD_RESET_SUBJECTS[locale],
    html,
    text,
  };
}
