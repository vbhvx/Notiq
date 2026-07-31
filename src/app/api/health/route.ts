import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET() {
  const startTime = Date.now();
  let dbStatus: "connected" | "disconnected" = "disconnected";

  try {

    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (error) {
    console.error("Health check: database unreachable", error);
  }

  const durationMs = Date.now() - startTime;
  const status = dbStatus === "connected" ? "ok" : "degraded";

  const response = {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    db: dbStatus,
    responseTimeMs: durationMs,
    version: process.env.npm_package_version || "1.0.0",
  };

  console.log("Health check", { statusCode: status === "ok" ? 200 : 503, durationMs });

  return NextResponse.json(response, {
    status: status === "ok" ? 200 : 503,
  });
}
