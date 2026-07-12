import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateNoteSchema, parseBody } from "@/lib/validate";
import { logger } from "@/lib/logger";

export async function GET(
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
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...note,
    tags: note.tags.map((nt: any) => nt.tag),
    actionItems: note.actionItems ? JSON.parse(note.actionItems) : [],
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existingNote = await prisma.note.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existingNote) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const parsed = parseBody(updateNoteSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { title, content, isArchived, isPublic, tags } = parsed.data;

    // Use transaction for atomic update of note + tags
    const fullNote = await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (isArchived !== undefined) updateData.isArchived = isArchived;
      if (isPublic !== undefined) updateData.isPublic = isPublic;

      const note = await tx.note.update({
        where: { id },
        data: updateData,
      });

      if (tags !== undefined && Array.isArray(tags)) {
        // Delete existing tags and recreate — all within transaction
        await tx.noteTag.deleteMany({
          where: { noteId: id },
        });

        for (const tagName of tags) {
          const tag = await tx.tag.upsert({
            where: {
              name_userId: {
                name: tagName,
                userId: session.user!.id!,
              },
            },
            create: {
              name: tagName,
              userId: session.user!.id!,
            },
            update: {},
          });

          await tx.noteTag.create({
            data: {
              noteId: note.id,
              tagId: tag.id,
            },
          });
        }
      }

      return tx.note.findUnique({
        where: { id },
        include: {
          tags: {
            include: { tag: true },
          },
        },
      });
    });

    return NextResponse.json({
      ...fullNote,
      tags: fullNote?.tags.map((nt: any) => nt.tag) || [],
      actionItems: fullNote?.actionItems
        ? JSON.parse(fullNote.actionItems)
        : [],
    });
  } catch (error) {
    logger.error("Update note error", error, {
      userId: session.user.id,
      method: "PATCH",
      path: `/api/notes/${id}`,
    });
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

  await prisma.note.delete({ where: { id } });

  logger.info("Note deleted", {
    userId: session.user.id,
    method: "DELETE",
    path: `/api/notes/${id}`,
  });

  return NextResponse.json({ message: "Note deleted" });
}
