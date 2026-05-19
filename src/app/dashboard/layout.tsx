"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "../providers";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const links = [
    { href: "/dashboard", label: "Notes", icon: "📝" },
    { href: "/dashboard/archived", label: "Archive", icon: "📦" },
    { href: "/dashboard/insights", label: "Insights", icon: "📊" },
  ];

  return (
    <div className="page-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>✦ Notiq</h1>
          <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: 4 }}>
            AI-Powered Notes
          </p>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <button
              key={link.href}
              className={`sidebar-link ${pathname === link.href ? "active" : ""}`}
              onClick={() => router.push(link.href)}
            >
              <span>{link.icon}</span>
              {link.label}
            </button>
          ))}

          <div style={{ flex: 1 }} />

          <button className="sidebar-link" onClick={() => router.push("/dashboard")}>
            <span>⌨</span>
            Shortcuts
            <kbd className="kbd" style={{ marginLeft: "auto" }}>?</kbd>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button onClick={toggleTheme} className="theme-toggle" title="Toggle theme">
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "linear-gradient(135deg, var(--accent), #a78bfa)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.8rem", fontWeight: 600, color: "#fff",
              }}
            >
              {session?.user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session?.user?.name || "User"}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session?.user?.email}
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => signOut({ callbackUrl: "/auth/login" })} title="Sign out">
              ↪
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
