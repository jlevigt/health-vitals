import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "@/api/client"; 
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your email...");
  
  // Prevent double-execution in React Strict Mode
  const verifiedRef = useRef(false);

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    if (verifiedRef.current) return;
    verifiedRef.current = true;

    const verify = async () => {
      try {
        await api.post("/auth/verify-email", { token, email });
        setStatus("success");
        setMessage("Email verified successfully! Redirecting to login...");
        
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch (err: any) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Failed to verify email.");
      }
    };

    verify();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-sm border border-outline-variant/30 text-center space-y-6">
        
        {status === "verifying" && (
          <>
            <div className="flex justify-center">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-on-surface">Verifying...</h1>
            <p className="text-on-surface-variant">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-on-surface">Verified!</h1>
            <p className="text-on-surface-variant">{message}</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex justify-center">
              <XCircle className="w-16 h-16 text-error" />
            </div>
            <h1 className="text-2xl font-bold text-on-surface">Verification Failed</h1>
            <p className="text-on-surface-variant">{message}</p>
            <button 
              onClick={() => navigate("/login")}
              className="mt-4 px-6 py-2 bg-primary text-on-primary rounded-full font-bold hover:shadow-md transition-all"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};
