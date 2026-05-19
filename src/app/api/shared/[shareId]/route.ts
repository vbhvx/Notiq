import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;

  const note = await prisma.note.findUnique({
    where: { shareId },
    include: {
      tags: {
        include: { tag: true },
      },
      user: {
        select: { name: true },
      },
    },
  });

  if (!note || !note.isPublic) {
    return NextResponse.json(
      { error: "Note not found or is not public" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: note.id,
    title: note.title,
    content: note.content,
    summary: note.summary,
    actionItems: note.actionItems ? JSON.parse(note.actionItems) : [],
    tags: note.tags.map((nt) => nt.tag),
    author: note.user.name,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  });
}
