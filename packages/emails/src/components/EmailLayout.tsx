import type { ReactNode } from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  pixelBasedPreset,
  Section,
  Tailwind,
  type TailwindConfig,
  Text,
} from "react-email";

export type EmailLocale = "pt-BR" | "en-US";

export const emailTailwindConfig: TailwindConfig = {
  presets: [pixelBasedPreset],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#0F766E",
        },
        ink: {
          primary: "#0F172A",
          muted: "#475569",
        },
        canvas: "#F8FAFC",
        surface: "#FFFFFF",
        line: "#E2E8F0",
        callout: {
          bg: "#FFFBEB",
          text: "#B45309",
          border: "#FDE68A",
        },
      },
    },
  },
};

export interface EmailLayoutProps {
  locale: EmailLocale;
  title: string;
  previewText: string;
  children: ReactNode;
}

const FOOTER_COPY: Record<
  EmailLocale,
  {
    tagline: string;
    securityNote: string;
    automatedNotice: string;
  }
> = {
  "pt-BR": {
    tagline: "Plataforma de inteligência para dados de saúde",
    securityNote: "Por segurança, a equipe do HealthVitals nunca solicitará sua senha por e-mail.",
    automatedNotice: "Este é um e-mail transacional automático enviado pelo HealthVitals.",
  },
  "en-US": {
    tagline: "Health data intelligence platform",
    securityNote:
      "For your security, the HealthVitals team will never ask for your password by email.",
    automatedNotice: "This is an automated transactional email sent by HealthVitals.",
  },
};

export function EmailLayout({ locale, title, previewText, children }: EmailLayoutProps) {
  const footer = FOOTER_COPY[locale];

  return (
    <Html lang={locale} dir="ltr">
      <Tailwind config={emailTailwindConfig}>
        <Head>
          <title>{title}</title>
        </Head>
        <Body className="bg-canvas font-sans m-0 py-10 px-4 text-ink-primary">
          <Preview>{previewText}</Preview>
          <div lang={locale} dir="ltr">
            <Container className="mx-auto max-w-[560px]">
              <Section className="pb-6 text-left">
                <Text className="m-0 text-xl font-bold tracking-tight text-brand-primary">
                  HealthVitals
                </Text>
                <Text className="m-0 mt-1 text-xs text-ink-muted">{footer.tagline}</Text>
              </Section>

              <Section className="bg-surface border border-solid border-line rounded-xl px-8 py-8">
                {children}
              </Section>

              <Section className="pt-6 px-2 text-left">
                <Text className="m-0 text-xs leading-5 text-ink-muted">{footer.securityNote}</Text>
                <Hr className="border-solid border-line my-4" />
                <Text className="m-0 text-xs leading-5 text-ink-muted">
                  {footer.automatedNotice}
                </Text>
                <Text className="m-0 mt-1 text-xs leading-5 text-ink-muted">
                  HealthVitals &middot;{" "}
                  <Link href="https://binderlex.com" className="text-brand-primary underline">
                    binderlex.com
                  </Link>
                </Text>
              </Section>
            </Container>
          </div>
        </Body>
      </Tailwind>
    </Html>
  );
}
