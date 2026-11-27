import { Button, Heading, Hr, Link, Section, Text } from "react-email";
import { EmailLayout, type EmailLocale } from "../components/EmailLayout.tsx";

export interface PasswordResetProps {
  resetUrl: string;
  locale?: EmailLocale;
  expiresInHours?: number;
}

export const PASSWORD_RESET_SUBJECTS: Record<EmailLocale, string> = {
  "pt-BR": "Redefinição de senha — HealthVitals",
  "en-US": "Reset your password — HealthVitals",
};

function formatHours(hours: number, locale: EmailLocale): string {
  if (locale === "pt-BR") {
    return hours === 1 ? "1 hora" : `${hours} horas`;
  }
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

export function PasswordReset({
  resetUrl,
  locale = "pt-BR",
  expiresInHours = 1,
}: PasswordResetProps) {
  const duration = formatHours(expiresInHours, locale);
  const subject = PASSWORD_RESET_SUBJECTS[locale];

  const copy =
    locale === "pt-BR"
      ? {
          preview: `Redefina sua senha no HealthVitals. Este link expira em ${duration}.`,
          heading: "Redefina sua senha",
          intro:
            "Recebemos uma solicitação para redefinir a senha da sua conta no HealthVitals. Use o botão abaixo para escolher uma nova senha com segurança.",
          cta: "Redefinir minha senha",
          expirationLabel: "Link temporário",
          expirationBody: `Por segurança, este link de redefinição expira em ${duration} e pode ser usado apenas uma vez.`,
          fallbackLabel:
            "Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:",
          securityWarning:
            "Aviso de segurança: se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha atual permanecerá inalterada — caso suspeite de acesso indevido, altere sua senha diretamente no HealthVitals.",
        }
      : {
          preview: `Reset your HealthVitals password. This link expires in ${duration}.`,
          heading: "Reset your password",
          intro:
            "We received a request to reset the password for your HealthVitals account. Use the button below to choose a new password securely.",
          cta: "Reset my password",
          expirationLabel: "Temporary link",
          expirationBody: `For your security, this password reset link expires in ${duration} and can only be used once.`,
          fallbackLabel:
            "If the button above does not work, copy and paste the link below into your browser:",
          securityWarning:
            "Security notice: if you did not request a password reset, please ignore this email. Your current password will remain unchanged — if you suspect unauthorized activity, update your password directly in HealthVitals.",
        };

  return (
    <EmailLayout locale={locale} title={subject} previewText={copy.preview}>
      <Heading as="h1" className="m-0 mb-4 text-2xl font-bold leading-8 text-ink-primary">
        {copy.heading}
      </Heading>

      <Text className="m-0 mb-6 text-base leading-6 text-ink-muted">{copy.intro}</Text>

      <Section className="mb-6">
        <Button
          href={resetUrl}
          className="box-border block w-full rounded-lg bg-brand-primary px-6 py-3.5 text-center text-base font-semibold text-white no-underline"
        >
          {copy.cta}
        </Button>
      </Section>

      <Section className="mb-6 rounded-lg border border-solid border-callout-border bg-callout-bg px-4 py-3">
        <Text className="m-0 mb-1 text-sm font-semibold text-callout-text">
          {copy.expirationLabel}
        </Text>
        <Text className="m-0 text-sm leading-5 text-callout-text">{copy.expirationBody}</Text>
      </Section>

      <Hr className="my-6 border-solid border-line" />

      <Text className="m-0 mb-2 text-sm leading-5 text-ink-muted">{copy.fallbackLabel}</Text>
      <Text className="m-0 mb-6 break-all text-sm leading-5">
        <Link href={resetUrl} className="text-brand-primary underline">
          {resetUrl}
        </Link>
      </Text>

      <Text className="m-0 text-sm leading-5 text-ink-muted">{copy.securityWarning}</Text>
    </EmailLayout>
  );
}

PasswordReset.PreviewProps = {
  resetUrl: "https://healthvitals.binderlex.com/reset-password?token=hv_reset_1a2b3c4d5e6f7890",
  locale: "pt-BR",
  expiresInHours: 1,
} satisfies PasswordResetProps;

// biome-ignore lint/style/noDefaultExport: React Email preview server requires a default export
export default PasswordReset;
