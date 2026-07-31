import { NextRequest, NextResponse } from "next/server";
import { getDefaultUserId } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { updateNoteSchema, parseBody } from "@/lib/validate";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getDefaultUserId();
  const { id } = await params;

  const note = await prisma.note.findFirst({
    where: { id, userId },
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
    tags: note.tags.map((nt) => nt.tag),
    actionItems: note.actionItems ? JSON.parse(note.actionItems) : [],
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getDefaultUserId();
  const { id } = await params;

  const existingNote = await prisma.note.findFirst({
    where: { id, userId },
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

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (isArchived !== undefined) updateData.isArchived = isArchived;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const note = await prisma.note.update({
      where: { id },
      data: updateData,
    });

    if (tags !== undefined && Array.isArray(tags)) {
      await prisma.noteTag.deleteMany({
        where: { noteId: id },
      });

      for (const tagName of tags) {
        const tag = await prisma.tag.upsert({
          where: {
            name_userId: {
              name: tagName,
              userId,
            },
          },
          create: {
            name: tagName,
            userId,
          },
          update: {},
        });

        await prisma.noteTag.create({
          data: {
            noteId: note.id,
            tagId: tag.id,
          },
        });
      }
    }

    const fullNote = await prisma.note.findUnique({
      where: { id },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    return NextResponse.json({
      ...fullNote,
      tags: fullNote?.tags.map((nt) => nt.tag) || [],
      actionItems: fullNote?.actionItems
        ? JSON.parse(fullNote.actionItems)
        : [],
    });
  } catch (error) {
    console.error("Update note error", error, {
      userId,
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
  const userId = await getDefaultUserId();
  const { id } = await params;

  const note = await prisma.note.findFirst({
    where: { id, userId },
  });

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  await prisma.note.delete({ where: { id } });

  console.log("Note deleted", {
    userId,
    method: "DELETE",
    path: `/api/notes/${id}`,
  });

  return NextResponse.json({ message: "Note deleted" });
}
