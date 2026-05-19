import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSummary, extractActionItems, suggestTitle } from "@/lib/ai";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const note = await prisma.note.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  try {
    const { type } = await req.json();

    if (!["summary", "action_items", "title", "all"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Use: summary, action_items, title, or all" },
        { status: 400 }
      );
    }

    const result: Record<string, unknown> = {};

    if (type === "summary" || type === "all") {
      result.summary = await generateSummary(note.content);

      await prisma.note.update({
        where: { id },
        data: { summary: result.summary as string },
      });

      await prisma.aiUsageLog.create({
        data: {
          userId: session.user.id,
          noteId: id,
          type: "summary",
        },
      });
    }

    if (type === "action_items" || type === "all") {
      const items = await extractActionItems(note.content);
      result.actionItems = items;

      await prisma.note.update({
        where: { id },
        data: { actionItems: JSON.stringify(items) },
      });

      await prisma.aiUsageLog.create({
        data: {
          userId: session.user.id,
          noteId: id,
          type: "action_items",
        },
      });
    }

    if (type === "title" || type === "all") {
      result.suggestedTitle = await suggestTitle(note.content);

      if (type === "all" || type === "title") {
        await prisma.aiUsageLog.create({
          data: {
            userId: session.user.id,
            noteId: id,
            type: "title",
          },
        });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI content" },
      { status: 500 }
    );
  }
}
