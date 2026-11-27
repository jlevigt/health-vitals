import { describe, expect, it } from "bun:test";
import { renderPasswordResetEmail, renderVerifyEmail } from "./index.ts";

describe("renderVerifyEmail", () => {
  it("renders pt-BR by default with 24-hour expiration, link, and brand identity", async () => {
    const verificationUrl = "https://healthvitals.binderlex.com/verify?token=abc123";
    const result = await renderVerifyEmail({ verificationUrl });

    expect(result.subject).toBe("Confirme seu e-mail — HealthVitals");
    expect(result.html.trim().length).toBeGreaterThan(0);
    expect(result.text.trim().length).toBeGreaterThan(0);

    expect(result.html).toContain('lang="pt-BR"');
    expect(result.html).toContain(verificationUrl);
    expect(result.html).toContain("24 horas");
    expect(result.html).toContain("HealthVitals");
    expect(result.html).toContain("binderlex.com");

    expect(result.text).toContain(verificationUrl);
    expect(result.text).toContain("24 horas");
    expect(result.text).toContain("HealthVitals");
    expect(result.text).toContain("binderlex.com");
  });

  it("renders en-US locale with English subject, copy, and expiration notice", async () => {
    const verificationUrl = "https://healthvitals.binderlex.com/verify?token=en456";
    const result = await renderVerifyEmail({
      verificationUrl,
      locale: "en-US",
    });

    expect(result.subject).toBe("Verify your email — HealthVitals");
    expect(result.html.trim().length).toBeGreaterThan(0);
    expect(result.text.trim().length).toBeGreaterThan(0);

    expect(result.html).toContain('lang="en-US"');
    expect(result.html).toContain(verificationUrl);
    expect(result.html).toContain("24 hours");
    expect(result.html).toContain("HealthVitals");
    expect(result.html).toContain("safely ignore");

    expect(result.text).toContain(verificationUrl);
    expect(result.text).toContain("24 hours");
    expect(result.text).toContain("HealthVitals");
  });

  it("supports custom expiresInHours with singular and plural formatting", async () => {
    const verificationUrl = "https://healthvitals.binderlex.com/verify?token=custom";

    const singularPt = await renderVerifyEmail({
      verificationUrl,
      locale: "pt-BR",
      expiresInHours: 1,
    });
    expect(singularPt.html).toContain("1 hora");
    expect(singularPt.text).toContain("1 hora");

    const customEn = await renderVerifyEmail({
      verificationUrl,
      locale: "en-US",
      expiresInHours: 48,
    });
    expect(customEn.html).toContain("48 hours");
    expect(customEn.text).toContain("48 hours");
  });

  it("preserves URLs with multiple query parameters and encoded characters", async () => {
    const verificationUrl =
      "https://healthvitals.binderlex.com/verify?token=abc&email=user%2Btest%40example.com";
    const result = await renderVerifyEmail({
      verificationUrl,
      locale: "en-US",
    });

    // HTML escapes '&' as '&amp;' inside attributes/text nodes
    const htmlEncodedUrl = verificationUrl.replaceAll("&", "&amp;");
    expect(result.html).toContain(htmlEncodedUrl);
    expect(result.text).toContain(verificationUrl);
  });
});

describe("renderPasswordResetEmail", () => {
  it("renders pt-BR by default with 1-hour expiration, link, and security warning", async () => {
    const resetUrl = "https://healthvitals.binderlex.com/reset-password?token=rst123";
    const result = await renderPasswordResetEmail({ resetUrl });

    expect(result.subject).toBe("Redefinição de senha — HealthVitals");
    expect(result.html.trim().length).toBeGreaterThan(0);
    expect(result.text.trim().length).toBeGreaterThan(0);

    expect(result.html).toContain('lang="pt-BR"');
    expect(result.html).toContain(resetUrl);
    expect(result.html).toContain("1 hora");
    expect(result.html).toContain("HealthVitals");
    expect(result.html).toContain("binderlex.com");

    expect(result.text).toContain(resetUrl);
    expect(result.text).toContain("1 hora");
    expect(result.text).toContain("HealthVitals");
    expect(result.text).toContain("binderlex.com");
  });

  it("renders en-US locale with English subject, copy, and security warning", async () => {
    const resetUrl = "https://healthvitals.binderlex.com/reset-password?token=rst456";
    const result = await renderPasswordResetEmail({
      resetUrl,
      locale: "en-US",
    });

    expect(result.subject).toBe("Reset your password — HealthVitals");
    expect(result.html.trim().length).toBeGreaterThan(0);
    expect(result.text.trim().length).toBeGreaterThan(0);

    expect(result.html).toContain('lang="en-US"');
    expect(result.html).toContain(resetUrl);
    expect(result.html).toContain("1 hour");
    expect(result.html).toContain("HealthVitals");
    expect(result.html).toContain("Security notice");

    expect(result.text).toContain(resetUrl);
    expect(result.text).toContain("1 hour");
    expect(result.text).toContain("HealthVitals");
  });

  it("supports custom expiresInHours in both locales", async () => {
    const resetUrl = "https://healthvitals.binderlex.com/reset-password?token=custom";

    const ptResult = await renderPasswordResetEmail({
      resetUrl,
      locale: "pt-BR",
      expiresInHours: 6,
    });
    expect(ptResult.html).toContain("6 horas");
    expect(ptResult.text).toContain("6 horas");

    const enResult = await renderPasswordResetEmail({
      resetUrl,
      locale: "en-US",
      expiresInHours: 3,
    });
    expect(enResult.html).toContain("3 hours");
    expect(enResult.text).toContain("3 hours");
  });

  it("preserves URLs with multiple query parameters and encoded characters", async () => {
    const resetUrl =
      "https://healthvitals.binderlex.com/reset-password?token=abc&email=user%2Btest%40example.com";
    const result = await renderPasswordResetEmail({
      resetUrl,
      locale: "pt-BR",
    });

    const htmlEncodedUrl = resetUrl.replaceAll("&", "&amp;");
    expect(result.html).toContain(htmlEncodedUrl);
    expect(result.text).toContain(resetUrl);
  });
});
