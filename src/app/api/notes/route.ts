import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paginationSchema, createNoteSchema, parseBody } from "@/lib/validate";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const params = paginationSchema.safeParse({
    page: searchParams.get("page") || "1",
    limit: searchParams.get("limit") || "20",
    search: searchParams.get("search") || "",
    tag: searchParams.get("tag") || "",
    sort: searchParams.get("sort") || "updatedAt",
    archived: searchParams.get("archived") || "false",
  });

  if (!params.success) {
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 }
    );
  }

  const { page, limit, search, tag, sort, archived } = params.data;

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

  // Get total count for pagination
  const total = await prisma.note.count({ where });

  // Paginated query
  const notes = await prisma.note.findMany({
    where,
    orderBy,
    skip: (page - 1) * limit,
    take: limit,
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  const formattedNotes = notes.map((note) => ({
    ...note,
    tags: note.tags.map((nt) => nt.tag),
    actionItems: note.actionItems ? JSON.parse(note.actionItems) : [],
  }));

  return NextResponse.json({
    notes: formattedNotes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = parseBody(createNoteSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { title, content, tags } = parsed.data;

    // Use transaction to ensure atomicity of note + tags creation
    const fullNote = await prisma.$transaction(async (tx) => {
      const note = await tx.note.create({
        data: {
          title: title || "Untitled",
          content: content || "",
          userId: session.user!.id!,
        },
      });

      if (tags && tags.length > 0) {
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
        where: { id: note.id },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });

    console.log("Note created", {
      userId: session.user.id,
      method: "POST",
      path: "/api/notes",
    });

    return NextResponse.json(
      {
        ...fullNote,
        tags: fullNote?.tags.map((nt) => nt.tag) || [],
        actionItems: fullNote?.actionItems
          ? JSON.parse(fullNote.actionItems)
          : [],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create note error", error, {
      userId: session.user.id,
      method: "POST",
      path: "/api/notes",
    });
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}
