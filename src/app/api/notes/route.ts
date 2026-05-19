import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const tag = searchParams.get("tag") || "";
  const sort = searchParams.get("sort") || "updatedAt";
  const archived = searchParams.get("archived") === "true";

  const where: Record<string, unknown> = {
    userId: session.user.id,
    isArchived: archived,
  };

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { content: { contains: search } },
    ];
  }

  if (tag) {
    where.tags = {
      some: {
        tag: {
          name: tag,
        },
      },
    };
  }

  const orderBy: Record<string, string> = {};
  if (sort === "title") {
    orderBy.title = "asc";
  } else if (sort === "createdAt") {
    orderBy.createdAt = "desc";
  } else {
    orderBy.updatedAt = "desc";
  }

  const notes = await prisma.note.findMany({
    where,
    orderBy,
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  const formattedNotes = notes.map((note: any) => ({
    ...note,
    tags: note.tags.map((nt: any) => nt.tag),
    actionItems: note.actionItems ? JSON.parse(note.actionItems) : [],
  }));

  return NextResponse.json(formattedNotes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, content, tags } = await req.json();

    const note = await prisma.note.create({
      data: {
        title: title || "Untitled",
        content: content || "",
        userId: session.user.id,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags) {
        const tag = await prisma.tag.upsert({
          where: {
            name_userId: {
              name: tagName.toLowerCase().trim(),
              userId: session.user.id,
            },
          },
          create: {
            name: tagName.toLowerCase().trim(),
            userId: session.user.id,
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
      where: { id: note.id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ...fullNote,
        tags: fullNote?.tags.map((nt: any) => nt.tag) || [],
        actionItems: fullNote?.actionItems ? JSON.parse(fullNote.actionItems) : [],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create note error:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}
