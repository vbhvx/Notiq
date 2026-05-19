import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const totalNotes = await prisma.note.count({
    where: { userId, isArchived: false },
  });
  const archivedNotes = await prisma.note.count({
    where: { userId, isArchived: true },
  });
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentlyEdited = await prisma.note.findMany({
    where: {
      userId,
      updatedAt: { gte: sevenDaysAgo },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      updatedAt: true,
    },
  });
  const tags = await prisma.tag.findMany({
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
  });

  const mostUsedTags = tags.map((tag: any) => ({
    name: tag.name,
    count: tag._count.notes,
  }));
  const totalAiUsage = await prisma.aiUsageLog.count({
    where: { userId },
  });

  const aiUsageByType = await prisma.aiUsageLog.groupBy({
    by: ["type"],
    where: { userId },
    _count: { type: true },
  });

  const aiStats = {
    total: totalAiUsage,
    byType: aiUsageByType.reduce(
      (acc: Record<string, number>, item: any) => {
        acc[item.type] = item._count.type;
        return acc;
      },
      {} as Record<string, number>
    ),
  };
  const weeklyActivity = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const created = await prisma.note.count({
      where: {
        userId,
        createdAt: { gte: dayStart, lte: dayEnd },
      },
    });

    const updated = await prisma.note.count({
      where: {
        userId,
        updatedAt: { gte: dayStart, lte: dayEnd },
        createdAt: { lt: dayStart }, 
      },
    });

    weeklyActivity.push({
      date: dayStart.toISOString().split("T")[0],
      day: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
      created,
      updated,
    });
  }
  const publicNotes = await prisma.note.count({
    where: { userId, isPublic: true },
  });

  return NextResponse.json({
    totalNotes,
    archivedNotes,
    publicNotes,
    recentlyEdited,
    mostUsedTags,
    aiStats,
    weeklyActivity,
  });
}
