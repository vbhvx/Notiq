import Link from "next/link";
import { MagnifyingGlassIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function NotFound() {
  return (
    <div className="auth-page" style={{ flexDirection: "column", gap: 24 }}>
      <div
        className="auth-card animate-in"
        style={{ textAlign: "center", maxWidth: 480 }}
      >
        <div style={{ marginBottom: 16, opacity: 0.8, display: "flex", justifyContent: "center" }}>
          <MagnifyingGlassIcon className="w-16 h-16" style={{ color: "var(--text-tertiary)" }} />
        </div>
        <h1
          style={{
            fontSize: "4rem",
            fontWeight: 800,
            marginBottom: 8,
            background: "linear-gradient(135deg, var(--accent), #a78bfa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: 1,
          }}
        >
          404
        </h1>
        <h2
          style={{
            fontSize: "1.3rem",
            fontWeight: 600,
            marginBottom: 8,
            color: "var(--text-primary)",
          }}
        >
          Page not found
        </h2>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
            marginBottom: 28,
            lineHeight: 1.6,
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link href="/dashboard" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ArrowLeftIcon className="w-5 h-5" /> Back to Dashboard
          </Link>
          <Link href="/" className="btn btn-secondary">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
