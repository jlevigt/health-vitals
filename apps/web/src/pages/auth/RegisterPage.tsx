import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  Loader2,
  MailCheck,
} from "lucide-react";
import type React from "react";
import { useId, useState } from "react";
import { Link } from "react-router-dom";
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

export const RegisterPage: React.FC = () => {
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const hasMinLength = password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/register", { email, password });
      setRegisteredEmail(email.trim());
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Registration failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  if (registeredEmail) {
    return (
      <AuthLayout>
        <div className="space-y-6 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary-soft border border-primary-container flex items-center justify-center text-primary">
            <MailCheck className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-on-surface tracking-tight">
              Check your inbox
            </h1>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              We sent a verification link to{" "}
              <span className="font-semibold text-on-surface break-all">{registeredEmail}</span>.
            </p>
          </div>

          <div className="rounded-xl bg-surface-variant/70 border border-outline-variant p-4 text-left text-xs text-on-surface-variant space-y-1.5 leading-relaxed">
            <p className="font-semibold text-on-surface">Next steps</p>
            <p>
              Open the email and click the verification link within{" "}
              <span className="font-semibold text-on-surface tabular-nums">24 hours</span> to
              activate your HealthVitals workspace.
            </p>
            <p>If it doesn&apos;t arrive within a few minutes, check your spam or junk folder.</p>
          </div>

          <div className="space-y-3 pt-1">
            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-on-primary py-2.5 px-4 rounded-xl text-sm font-semibold shadow-xs transition-all"
            >
              Continue to Sign In
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => {
                setRegisteredEmail(null);
                setPassword("");
                setError("");
              }}
              className="w-full py-2 text-xs font-medium text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              Use a different email address
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-bold text-on-surface tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-on-surface-variant">
            Start turning PDF lab reports into structured biomarker insights.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl bg-error-container border border-error-border px-3.5 py-3 text-sm text-on-error-container"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-error" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor={emailId} className="block text-sm font-medium text-on-surface">
              Email address
            </label>
            <input
              id={emailId}
              type="email"
              required
              autoComplete="email"
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline bg-white text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor={passwordId} className="block text-sm font-medium text-on-surface">
              Password
            </label>
            <div className="relative">
              <input
                id={passwordId}
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-outline bg-white text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs pt-0.5">
              {hasMinLength ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-outline shrink-0" />
              )}
              <span
                className={
                  hasMinLength ? "text-on-success-container font-medium" : "text-on-surface-variant"
                }
              >
                At least 6 characters
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-on-primary py-2.5 px-4 rounded-xl text-sm font-semibold shadow-xs transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-outline-variant text-center">
          <p className="text-sm text-on-surface-variant">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary font-semibold hover:text-primary-hover hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};
