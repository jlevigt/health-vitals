import { ArrowRight, CheckCircle2, Loader2, XCircle } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/api/client";
import { AuthLayout } from "@/components/brand/AuthLayout";

function extractErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null) {
    if ("response" in err) {
      const response = (err as { response?: { data?: { message?: unknown } } }).response;
      if (typeof response?.data?.message === "string" && response.data.message.trim().length > 0) {
        return response.data.message;
      }
    }
    if ("message" in err && typeof (err as { message?: unknown }).message === "string") {
      const message = (err as { message: string }).message;
      if (message.trim().length > 0) {
        return message;
      }
    }
  }
  return fallback;
}

export const VerifyEmailPage: React.FC = () => {
  const { t } = useTranslation("auth");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [isInvalidLink, setIsInvalidLink] = useState(false);

  // Prevent double-execution in React Strict Mode
  const verifiedRef = useRef(false);
  const redirectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      setStatus("error");
      setIsInvalidLink(true);
      return;
    }

    if (verifiedRef.current) {
      return;
    }
    verifiedRef.current = true;

    const verify = async () => {
      try {
        await api.post("/auth/verify-email", { token, email });
        setStatus("success");

        redirectTimerRef.current = window.setTimeout(() => {
          navigate("/login", {
            state: { message: t("verifyEmail.successMessage") },
          });
        }, 3000);
      } catch (err: unknown) {
        setStatus("error");
        setErrorDetail(extractErrorMessage(err, t("verifyEmail.errorMessage")));
      }
    };

    verify();

    return () => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, [searchParams, navigate, t]);

  return (
    <AuthLayout>
      <div className="space-y-6 text-center py-2">
        {status === "verifying" && (
          <>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary-soft border border-primary-container flex items-center justify-center text-primary">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div className="space-y-1.5">
              <h1 className="font-display text-2xl font-bold text-on-surface tracking-tight">
                {t("verifyEmail.verifyingTitle")}
              </h1>
              <p className="text-sm text-on-surface-variant">{t("verifyEmail.verifyingMessage")}</p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-success-container border border-success-border flex items-center justify-center text-success">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h1 className="font-display text-2xl font-bold text-on-surface tracking-tight">
                {t("verifyEmail.successTitle")}
              </h1>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {t("verifyEmail.successMessage")}
              </p>
            </div>
            <div className="space-y-3 pt-1">
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-on-primary py-2.5 px-4 rounded-xl text-sm font-semibold shadow-xs transition-all"
              >
                {t("verifyEmail.goToLogin")}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-on-surface-variant">{t("verifyEmail.redirecting")}</p>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-error-container border border-error-border flex items-center justify-center text-error">
              <XCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h1 className="font-display text-2xl font-bold text-on-surface tracking-tight">
                {t("verifyEmail.errorTitle")}
              </h1>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {isInvalidLink
                  ? t("verifyEmail.invalidLink")
                  : (errorDetail ?? t("verifyEmail.errorMessage"))}
              </p>
            </div>
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-on-primary py-2.5 px-4 rounded-xl text-sm font-semibold shadow-xs transition-all cursor-pointer"
              >
                {t("verifyEmail.goToLogin")}
              </button>
              <p className="text-xs text-on-surface-variant">
                {t("verifyEmail.needNewLink")}{" "}
                <Link
                  to="/register"
                  className="text-primary font-semibold hover:text-primary-hover hover:underline"
                >
                  {t("login.registerLink")}
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
};
