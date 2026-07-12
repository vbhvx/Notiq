import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    // Run independent queries in parallel for better performance
    const [totalNotes, archivedNotes, publicNotes, recentlyEdited, tags, totalAiUsage, aiUsageByType] =
      await Promise.all([
        prisma.note.count({
          where: { userId, isArchived: false },
        }),
        prisma.note.count({
          where: { userId, isArchived: true },
        }),
        prisma.note.count({
          where: { userId, isPublic: true },
        }),
        prisma.note.findMany({
          where: {
            userId,
            updatedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { updatedAt: "desc" },
          take: 5,
          select: {
            id: true,
            title: true,
            updatedAt: true,
          },
        }),
        prisma.tag.findMany({
          where: { userId },
          include: {
            _count: {
              select: { notes: true },
            },
          },
          orderBy: {
            notes: {
              _count: "desc",
            },
          },
          take: 10,
        }),
        prisma.aiUsageLog.count({
          where: { userId },
        }),
        prisma.aiUsageLog.groupBy({
          by: ["type"],
          where: { userId },
          _count: { type: true },
        }),
      ]);

    const mostUsedTags = tags.map((tag) => ({
      name: tag.name,
      count: tag._count.notes,
    }));

    const aiStats = {
      total: totalAiUsage,
      byType: aiUsageByType.reduce(
        (acc: Record<string, number>, item: { type: string; _count: { type: number } }) => {
          acc[item.type] = item._count.type;
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    // Fix N+1: Get weekly activity with TWO queries instead of 14
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [createdNotes, updatedNotes] = await Promise.all([
      prisma.note.findMany({
        where: {
          userId,
          createdAt: { gte: sevenDaysAgo },
        },
        select: { createdAt: true },
      }),
      prisma.note.findMany({
        where: {
          userId,
          updatedAt: { gte: sevenDaysAgo },
          createdAt: { lt: sevenDaysAgo },
        },
        select: { updatedAt: true },
      }),
    ]);

    // Aggregate by day in JavaScript instead of N database queries
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const created = createdNotes.filter(
        (n) => n.createdAt >= dayStart && n.createdAt <= dayEnd
      ).length;

      const updated = updatedNotes.filter(
        (n) => n.updatedAt >= dayStart && n.updatedAt <= dayEnd
      ).length;

      weeklyActivity.push({
        date: dayStart.toISOString().split("T")[0],
        day: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
        created,
        updated,
      });
    }

    return NextResponse.json({
      totalNotes,
      archivedNotes,
      publicNotes,
      recentlyEdited,
      mostUsedTags,
      aiStats,
      weeklyActivity,
    });
  } catch (error) {
    logger.error("Insights error", error, {
      userId: session.user.id,
      method: "GET",
      path: "/api/insights",
    });
    return NextResponse.json(
      { error: "Failed to load insights" },
      { status: 500 }
    );
  }
}
