import { Button, Heading, Hr, Link, Section, Text } from "react-email";
import { EmailLayout, type EmailLocale } from "../components/EmailLayout.tsx";

export interface VerifyEmailProps {
  verificationUrl: string;
  locale?: EmailLocale;
  expiresInHours?: number;
}

export const VERIFY_EMAIL_SUBJECTS: Record<EmailLocale, string> = {
  "pt-BR": "Confirme seu e-mail — HealthVitals",
  "en-US": "Verify your email — HealthVitals",
};

function formatHours(hours: number, locale: EmailLocale): string {
  if (locale === "pt-BR") {
    return hours === 1 ? "1 hora" : `${hours} horas`;
  }
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

export function VerifyEmail({
  verificationUrl,
  locale = "pt-BR",
  expiresInHours = 24,
}: VerifyEmailProps) {
  const duration = formatHours(expiresInHours, locale);
  const subject = VERIFY_EMAIL_SUBJECTS[locale];

  const copy =
    locale === "pt-BR"
      ? {
          preview: `Confirme seu e-mail no HealthVitals. Este link expira em ${duration}.`,
          heading: "Confirme seu endereço de e-mail",
          intro:
            "Obrigado por criar sua conta no HealthVitals. Para ativar o acesso ao seu painel de indicadores e exames clínicos, confirme seu e-mail clicando no botão abaixo.",
          cta: "Confirmar meu e-mail",
          expirationLabel: "Validade do link",
          expirationBody: `Por segurança, este link de confirmação expira em ${duration}. Após esse prazo, você poderá solicitar um novo link na tela de login.`,
          fallbackLabel:
            "Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:",
          disclaimer:
            "Se você não criou uma conta no HealthVitals, pode ignorar este e-mail com segurança. Nenhuma alteração será feita.",
        }
      : {
          preview: `Verify your HealthVitals email. This link expires in ${duration}.`,
          heading: "Verify your email address",
          intro:
            "Thank you for creating your HealthVitals account. To activate access to your health metrics and lab reports dashboard, please verify your email using the button below.",
          cta: "Verify my email",
          expirationLabel: "Link expiration",
          expirationBody: `For your security, this verification link expires in ${duration}. After that, you can request a new link from the sign-in screen.`,
          fallbackLabel:
            "If the button above does not work, copy and paste the link below into your browser:",
          disclaimer:
            "If you did not create a HealthVitals account, you can safely ignore this email. No changes will be made.",
        };

  return (
    <EmailLayout locale={locale} title={subject} previewText={copy.preview}>
      <Heading as="h1" className="m-0 mb-4 text-2xl font-bold leading-8 text-ink-primary">
        {copy.heading}
      </Heading>

      <Text className="m-0 mb-6 text-base leading-6 text-ink-muted">{copy.intro}</Text>

      <Section className="mb-6">
        <Button
          href={verificationUrl}
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
        <Link href={verificationUrl} className="text-brand-primary underline">
          {verificationUrl}
        </Link>
      </Text>

      <Text className="m-0 text-sm leading-5 text-ink-muted">{copy.disclaimer}</Text>
    </EmailLayout>
  );
}

VerifyEmail.PreviewProps = {
  verificationUrl:
    "https://healthvitals.binderlex.com/verify-email?token=hv_verify_9f8e7d6c5b4a3210",
  locale: "pt-BR",
  expiresInHours: 24,
} satisfies VerifyEmailProps;

// biome-ignore lint/style/noDefaultExport: React Email preview server requires a default export
export default VerifyEmail;
