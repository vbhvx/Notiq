"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    } else if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [status, router]);

  return (
    <div className="auth-page">
      <div style={{ textAlign: "center" }}>
        <div className="ai-loading">
          <div className="spinner" />
          <span>Loading Notiq...</span>
        </div>
      </div>
    </div>
  );
}
