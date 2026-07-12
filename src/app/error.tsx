"use client";

import { useEffect } from "react";
import { ExclamationTriangleIcon, ArrowPathIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for observability
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="auth-page" style={{ flexDirection: "column", gap: 24 }}>
      <div
        className="auth-card animate-in"
        style={{ textAlign: "center", maxWidth: 480 }}
      >
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
          <ExclamationTriangleIcon className="w-12 h-12" style={{ color: "var(--danger)" }} />
        </div>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            marginBottom: 8,
            background: "linear-gradient(135deg, var(--danger), #fb923c)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Something went wrong
        </h1>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          An unexpected error occurred. Don&apos;t worry — your data is safe.
          Try refreshing the page or go back to your dashboard.
        </p>

        {error.digest && (
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-tertiary)",
              marginBottom: 16,
              fontFamily: "monospace",
            }}
          >
            Error ID: {error.digest}
          </p>
        )}

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button className="btn btn-primary" onClick={reset} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ArrowPathIcon className="w-5 h-5" /> Try Again
          </button>
          <a href="/dashboard" className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ArrowLeftIcon className="w-5 h-5" /> Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
