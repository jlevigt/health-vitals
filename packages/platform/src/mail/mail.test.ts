import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";
import nodemailer from "nodemailer";
import type { Logger } from "../logger/interface.ts";
import type { MailProvider } from "./interface.ts";
import { MockMailProvider } from "./mock.ts";
import { NodeMailerProvider } from "./nodemailer.ts";
import { ResendProvider } from "./resend.ts";

function createTestLogger() {
  const info = mock((_msg: string, _data?: Record<string, unknown>) => {});
  const error = mock((_msg: string, _data?: Record<string, unknown>) => {});
  const warn = mock((_msg: string, _data?: Record<string, unknown>) => {});
  const debug = mock((_msg: string, _data?: Record<string, unknown>) => {});

  const logger: Logger = {
    info,
    error,
    warn,
    debug,
    child: () => logger,
  };

  return { logger, info, error, warn, debug };
}

interface ResendProviderInternals {
  resend: {
    emails: {
      send: (payload: Record<string, unknown>) => Promise<{
        data: { id: string } | null;
        error: { message: string } | null;
      }>;
    };
  };
}

describe("Platform Mail Providers", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("ResendProvider", () => {
    it("should send with default fromAddress and omit text when not provided", async () => {
      let capturedUrl = "";
      let capturedBody: Record<string, unknown> = {};

      const mockFetch = mock(async (input: string | URL | Request, init?: RequestInit) => {
        capturedUrl = String(input);
        capturedBody = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
        return new Response(JSON.stringify({ id: "email_default_123" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      });
      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const { logger, info } = createTestLogger();
      const provider = new ResendProvider(logger, "re_test_api_key");

      await provider.sendMail(
        "delivered@resend.dev",
        "Welcome to HealthVitals",
        "<p>Hello world</p>",
      );

      expect(capturedUrl).toContain("/emails");
      expect(capturedBody.from).toBe("HealthVitals <noreply@binderlex.com>");
      expect(capturedBody.to).toBe("delivered@resend.dev");
      expect(capturedBody.subject).toBe("Welcome to HealthVitals");
      expect(capturedBody.html).toBe("<p>Hello world</p>");
      expect("text" in capturedBody).toBe(false);
      expect(info).toHaveBeenCalledWith(
        "Email sent to delivered@resend.dev via Resend. ID: email_default_123",
      );
    });

    it("should use custom fromAddress when provided", async () => {
      let capturedBody: Record<string, unknown> = {};

      const mockFetch = mock(async (_input: string | URL | Request, init?: RequestInit) => {
        capturedBody = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
        return new Response(JSON.stringify({ id: "email_custom_456" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      });
      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const { logger } = createTestLogger();
      const customFrom = "HealthVitals Alerts <alerts@example.com>";
      const provider = new ResendProvider(logger, "re_test_api_key", customFrom);

      await provider.sendMail("delivered@resend.dev", "Lab Ready", "<p>Results ready</p>");

      expect(capturedBody.from).toBe(customFrom);
    });

    it("should include plain-text fallback when text is provided", async () => {
      let capturedBody: Record<string, unknown> = {};

      const mockFetch = mock(async (_input: string | URL | Request, init?: RequestInit) => {
        capturedBody = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
        return new Response(JSON.stringify({ id: "email_text_789" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      });
      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const { logger } = createTestLogger();
      const provider = new ResendProvider(logger, "re_test_api_key");

      await provider.sendMail(
        "delivered@resend.dev",
        "Reset Password",
        "<p>Click <a href='https://example.com'>here</a></p>",
        "Visit https://example.com to reset your password",
      );

      expect(capturedBody.html).toBe("<p>Click <a href='https://example.com'>here</a></p>");
      expect(capturedBody.text).toBe("Visit https://example.com to reset your password");
    });

    it("should omit text field when empty string is passed", async () => {
      let capturedBody: Record<string, unknown> = {};

      const mockFetch = mock(async (_input: string | URL | Request, init?: RequestInit) => {
        capturedBody = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
        return new Response(JSON.stringify({ id: "email_empty_text" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      });
      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const { logger } = createTestLogger();
      const provider = new ResendProvider(logger, "re_test_api_key");

      await provider.sendMail("delivered@resend.dev", "Subject", "<p>Body</p>", "");

      expect("text" in capturedBody).toBe(false);
    });

    it("should log and throw when Resend API returns an error object", async () => {
      const mockFetch = mock(async () => {
        return new Response(
          JSON.stringify({
            name: "validation_error",
            message: "The binderlex.com domain is not verified.",
            statusCode: 403,
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          },
        );
      });
      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const { logger, error } = createTestLogger();
      const provider = new ResendProvider(logger, "re_test_api_key");

      await expect(
        provider.sendMail("delivered@resend.dev", "Subject", "<p>Body</p>"),
      ).rejects.toThrow("Resend error: The binderlex.com domain is not verified.");

      expect(error).toHaveBeenCalledWith(
        "Failed to send email to delivered@resend.dev: The binderlex.com domain is not verified.",
      );
    });

    it("should log and propagate unexpected exceptions thrown by Resend client", async () => {
      const { logger, error } = createTestLogger();
      const provider = new ResendProvider(logger, "re_test_api_key");
      const internals = provider as unknown as ResendProviderInternals;

      const sendSpy = spyOn(internals.resend.emails, "send").mockRejectedValueOnce(
        new Error("Transport socket hang up"),
      );

      await expect(
        provider.sendMail("delivered@resend.dev", "Subject", "<p>Body</p>"),
      ).rejects.toThrow("Transport socket hang up");

      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(error).toHaveBeenCalledWith(
        "Unexpected error sending email: Error: Transport socket hang up",
      );
    });
  });

  describe("NodeMailerProvider", () => {
    it("should send with default and custom fromAddress, optional text, and propagate errors", async () => {
      const sendMailMock = mock(async (_options: Record<string, unknown>) => ({
        messageId: "<msg-1@ethereal.email>",
      }));

      const createAccountSpy = spyOn(nodemailer, "createTestAccount").mockResolvedValue({
        user: "ethereal-user",
        pass: "ethereal-pass",
        smtp: { host: "smtp.ethereal.email", port: 587, secure: false },
        imap: { host: "imap.ethereal.email", port: 993, secure: true },
        pop3: { host: "pop3.ethereal.email", port: 995, secure: true },
        web: "https://ethereal.email",
      });

      const createTransportSpy = spyOn(nodemailer, "createTransport").mockReturnValue({
        sendMail: sendMailMock,
      } as unknown as nodemailer.Transporter);

      const previewUrlSpy = spyOn(nodemailer, "getTestMessageUrl").mockReturnValue(
        "https://ethereal.email/message/1",
      );

      try {
        const { logger, error } = createTestLogger();
        const defaultProvider = new NodeMailerProvider(logger);

        await defaultProvider.sendMail("delivered@resend.dev", "Default From", "<p>HTML</p>");
        expect(sendMailMock).toHaveBeenLastCalledWith({
          from: "HealthVitals <noreply@binderlex.com>",
          to: "delivered@resend.dev",
          subject: "Default From",
          html: "<p>HTML</p>",
        });

        const customProvider = new NodeMailerProvider(logger, "Custom <custom@binderlex.com>");
        await customProvider.sendMail(
          "delivered@resend.dev",
          "With Text",
          "<p>HTML</p>",
          "Plain text body",
        );
        expect(sendMailMock).toHaveBeenLastCalledWith({
          from: "Custom <custom@binderlex.com>",
          to: "delivered@resend.dev",
          subject: "With Text",
          html: "<p>HTML</p>",
          text: "Plain text body",
        });

        sendMailMock.mockRejectedValueOnce(new Error("SMTP connection refused"));
        await expect(
          customProvider.sendMail("delivered@resend.dev", "Fail", "<p>Fail</p>"),
        ).rejects.toThrow("SMTP connection refused");
        expect(error).toHaveBeenCalledWith(
          "Error sending email to delivered@resend.dev: Error: SMTP connection refused",
        );
      } finally {
        createAccountSpy.mockRestore();
        createTransportSpy.mockRestore();
        previewUrlSpy.mockRestore();
      }
    });
  });

  describe("MockMailProvider", () => {
    it("should handle 3-arg calls cleanly without adding a text property", async () => {
      const mockMail = new MockMailProvider();

      await mockMail.sendMail("delivered@resend.dev", "Hello", "<p>HTML only</p>");

      const sent = mockMail.getSentEmails();
      expect(sent).toHaveLength(1);
      expect(sent[0]).toEqual({
        to: "delivered@resend.dev",
        subject: "Hello",
        body: "<p>HTML only</p>",
      });
      expect("text" in sent[0]).toBe(false);
    });

    it("should handle 4-arg calls and record plain-text fallback", async () => {
      const mockMail = new MockMailProvider();

      await mockMail.sendMail(
        "delivered@resend.dev",
        "Verify Account",
        "<p>Verify your email</p>",
        "Verify your email",
      );

      const sent = mockMail.getSentEmails();
      expect(sent).toHaveLength(1);
      expect(sent[0]).toEqual({
        to: "delivered@resend.dev",
        subject: "Verify Account",
        body: "<p>Verify your email</p>",
        text: "Verify your email",
      });
    });

    it("should clear stored emails", async () => {
      const mockMail = new MockMailProvider();
      await mockMail.sendMail("delivered@resend.dev", "One", "<p>1</p>", "1");
      expect(mockMail.getSentEmails()).toHaveLength(1);

      mockMail.clear();
      expect(mockMail.getSentEmails()).toEqual([]);
    });
  });

  describe("MailProvider interface backwards compatibility", () => {
    it("should remain compatible with 3-arg implementations and callers", async () => {
      const recorded: Array<{ to: string; subject: string; body: string }> = [];

      class LegacyMailProvider implements MailProvider {
        async sendMail(to: string, subject: string, body: string): Promise<void> {
          recorded.push({ to, subject, body });
        }
      }

      const provider: MailProvider = new LegacyMailProvider();
      await provider.sendMail("delivered@resend.dev", "Legacy 3-arg", "<p>Works</p>");
      await provider.sendMail(
        "delivered@resend.dev",
        "4-arg against legacy",
        "<p>Also works</p>",
        "Plain fallback",
      );

      expect(recorded).toEqual([
        { to: "delivered@resend.dev", subject: "Legacy 3-arg", body: "<p>Works</p>" },
        {
          to: "delivered@resend.dev",
          subject: "4-arg against legacy",
          body: "<p>Also works</p>",
        },
      ]);
    });
  });
});
