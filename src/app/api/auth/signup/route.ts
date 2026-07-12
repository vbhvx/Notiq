import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signupSchema, parseBody } from "@/lib/validate";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Rate limit: 5 signups per hour per IP
const SIGNUP_LIMIT = 5;
const SIGNUP_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(req);
    const rl = rateLimit(`signup:${clientIp}`, SIGNUP_LIMIT, SIGNUP_WINDOW_MS);
    if (!rl.success) {
      console.warn("Signup rate limit exceeded", { method: "POST", path: "/api/auth/signup" });
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rl.resetMs / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // Input validation
    const body = await req.json();
    const parsed = parseBody(signupSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    // Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    console.log("User created", { userId: user.id, method: "POST", path: "/api/auth/signup" });

    return NextResponse.json(
      { message: "Account created successfully", user },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error", error, { method: "POST", path: "/api/auth/signup" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
