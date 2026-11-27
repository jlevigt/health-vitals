import { ArrowRight, CheckCircle2, Loader2, XCircle } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Confirming your verification token...");

  // Prevent double-execution in React Strict Mode
  const verifiedRef = useRef(false);
  const redirectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      setStatus("error");
      setMessage("This verification link is incomplete or invalid.");
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
        setMessage("Your email has been verified and your HealthVitals account is ready.");

        redirectTimerRef.current = window.setTimeout(() => {
          navigate("/login", {
            state: { message: "Email verified successfully. Please sign in." },
          });
        }, 3000);
      } catch (err: unknown) {
        setStatus("error");
        setMessage(
          extractErrorMessage(
            err,
            "We could not verify your email. The link may have expired or already been used.",
          ),
        );
      }
    };

    verify();

    return () => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, [searchParams, navigate]);

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
                Verifying your email
              </h1>
              <p className="text-sm text-on-surface-variant">{message}</p>
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
                Email verified
              </h1>
              <p className="text-sm text-on-surface-variant leading-relaxed">{message}</p>
            </div>
            <div className="space-y-3 pt-1">
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-on-primary py-2.5 px-4 rounded-xl text-sm font-semibold shadow-xs transition-all"
              >
                Sign In Now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-on-surface-variant">
                Redirecting to sign in automatically...
              </p>
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
                Verification failed
              </h1>
              <p className="text-sm text-on-surface-variant leading-relaxed">{message}</p>
            </div>
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-on-primary py-2.5 px-4 rounded-xl text-sm font-semibold shadow-xs transition-all cursor-pointer"
              >
                Back to Sign In
              </button>
              <p className="text-xs text-on-surface-variant">
                Need a new link?{" "}
                <Link
                  to="/register"
                  className="text-primary font-semibold hover:text-primary-hover hover:underline"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
};
