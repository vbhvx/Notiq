import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Health check endpoint.
 * Verifies the application is running and the database is reachable.
 *
 * GET /api/health
 * Returns: { status: "ok" | "degraded", timestamp, uptime, db }
 */
export async function GET() {
  const startTime = Date.now();
  let dbStatus: "connected" | "disconnected" = "disconnected";

  try {
    // Test database connectivity with a lightweight query
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (error) {
    logger.error("Health check: database unreachable", error);
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

  logger.info("Health check", { statusCode: status === "ok" ? 200 : 503, durationMs });

  return NextResponse.json(response, {
    status: status === "ok" ? 200 : 503,
  });
}
