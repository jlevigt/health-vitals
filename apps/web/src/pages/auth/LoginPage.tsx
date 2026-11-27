import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import type React from "react";
import { useId, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "@/api/client";
import { AuthLayout } from "@/components/brand/AuthLayout";
import { useAuth } from "@/context/AuthContext";

interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

function getLocationMessage(state: unknown): string | null {
  if (typeof state === "object" && state !== null && "message" in state) {
    const value = (state as { message?: unknown }).message;
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return null;
}

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

export const LoginPage: React.FC = () => {
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const successMessage = getLocationMessage(location.state);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post<LoginResponse>("/auth/login", { email, password });
      const { accessToken, user } = response.data;
      login(accessToken, user);
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Invalid email or password. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-bold text-on-surface tracking-tight">
            Sign in to HealthVitals
          </h1>
          <p className="text-sm text-on-surface-variant">
            Access your biomarker trends, lab reports, and uploaded documents.
          </p>
        </div>

        {successMessage && !error && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-xl bg-success-container border border-success-border px-3.5 py-3 text-sm text-on-success-container"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-success" />
            <span>{successMessage}</span>
          </div>
        )}

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

          <div className="space-y-1.5">
            <label htmlFor={passwordId} className="block text-sm font-medium text-on-surface">
              Password
            </label>
            <div className="relative">
              <input
                id={passwordId}
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                className="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-outline bg-white text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Enter your password"
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-on-primary py-2.5 px-4 rounded-xl text-sm font-semibold shadow-xs transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-outline-variant text-center">
          <p className="text-sm text-on-surface-variant">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="text-primary font-semibold hover:text-primary-hover hover:underline transition-colors"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};
