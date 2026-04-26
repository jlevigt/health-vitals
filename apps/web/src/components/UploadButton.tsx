import React, { useRef, useState } from "react";
import { api } from "../api/client";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface UploadButtonProps {
  onUploadSuccess: () => void;
}

export const UploadButton: React.FC<UploadButtonProps> = ({ onUploadSuccess }) => {
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setStatus("error");
      setErrorMessage("Please upload a PDF file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setStatus("uploading");
    setErrorMessage("");

    try {
      await api.post("/reports/upload", formData);
      setStatus("success");
      onUploadSuccess();
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.response?.data?.message || "Failed to upload file");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf"
        className="hidden"
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={status === "uploading"}
        className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all shadow-md active:scale-95 ${
          status === "uploading"
            ? "bg-secondary-container text-on-secondary-container cursor-not-allowed"
            : status === "success"
            ? "bg-green-500 text-white"
            : status === "error"
            ? "bg-error text-on-error"
            : "bg-primary text-on-primary hover:bg-opacity-90"
        }`}
      >
        {status === "uploading" ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : status === "success" ? (
          <CheckCircle className="w-5 h-5" />
        ) : status === "error" ? (
          <AlertCircle className="w-5 h-5" />
        ) : (
          <Upload className="w-5 h-5" />
        )}
        {status === "uploading" ? "Processing..." : status === "success" ? "Done!" : status === "error" ? "Retry" : "Upload Exam"}
      </button>

      {status === "error" && errorMessage && (
        <p className="text-xs text-error font-medium">{errorMessage}</p>
      )}
    </div>
  );
};
