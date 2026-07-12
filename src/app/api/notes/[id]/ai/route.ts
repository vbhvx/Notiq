import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSummary, extractActionItems, suggestTitle } from "@/lib/ai";
import { aiTypeSchema, parseBody } from "@/lib/validate";
import { rateLimit } from "@/lib/rate-limit";

// Rate limit: 20 AI generations per hour per user
const AI_LIMIT = 20;
const AI_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Max content length to send to AI (to protect API costs)
const MAX_AI_CONTENT_LENGTH = 50000;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting per user
  const rl = rateLimit(`ai:${session.user.id}`, AI_LIMIT, AI_WINDOW_MS);
  if (!rl.success) {
    console.warn("AI rate limit exceeded", {
      userId: session.user.id,
      method: "POST",
      path: "/api/notes/ai",
    });
    return NextResponse.json(
      {
        error: `AI generation limit reached (${AI_LIMIT}/hour). Please try again later.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rl.resetMs / 1000)),
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      }
    );
  }

  const { id } = await params;

  const note = await prisma.note.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const parsed = parseBody(aiTypeSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { type } = parsed.data;

    // Guard against excessively large content
    if (note.content.length > MAX_AI_CONTENT_LENGTH) {
      return NextResponse.json(
        {
          error: `Content is too long for AI processing (${note.content.length} chars, max ${MAX_AI_CONTENT_LENGTH}). Please shorten the note.`,
        },
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

    console.log("AI generation completed", {
      userId: session.user.id,
      method: "POST",
      path: `/api/notes/${id}/ai`,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI generation error", error, {
      userId: session.user.id,
      method: "POST",
      path: `/api/notes/${id}/ai`,
    });
    return NextResponse.json(
      { error: "Failed to generate AI content" },
      { status: 500 }
    );
  }
}
