import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Notiq — AI-Powered Notes Workspace",
  description: "A lightweight, collaborative, AI-powered notes workspace. Create, organize, and enhance your notes with AI summaries, action items, and smart insights.",
  keywords: ["notes", "AI", "workspace", "productivity", "collaboration"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
