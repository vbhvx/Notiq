import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Rate limit: 10 login attempts per 15 minutes per IP
const AUTH_LIMIT = 10;
const AUTH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate limit login attempts
  if (pathname === "/api/auth/callback/credentials" && req.method === "POST") {
    const clientIp = getClientIp(req);
    const rl = rateLimit(`auth:${clientIp}`, AUTH_LIMIT, AUTH_WINDOW_MS);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rl.resetMs / 1000)),
          },
        }
      );
    }
  }

  // Protect dashboard and notes routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/notes")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/notes/:path*",
    "/api/auth/callback/credentials",
  ],
};
