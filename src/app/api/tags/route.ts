import { NextResponse } from "next/server";
import { getDefaultUserId } from "@/lib/user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getDefaultUserId();

  const tags = await prisma.tag.findMany({
    where: { userId },
    include: {
      _count: {
        select: { notes: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      count: tag._count.notes,
    }))
  );
}
