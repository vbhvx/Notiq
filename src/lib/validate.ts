// Zod validation schemas for API inputs

import { z } from "zod";


const tagSchema = z
  .string()
  .trim()
  .min(1, "Tag cannot be empty")
  .max(50, "Tag must be at most 50 characters")
  .transform((v) => v.toLowerCase());

export const createNoteSchema = z.object({
  title: z
    .string()
    .max(500, "Title must be at most 500 characters")
    .optional()
    .default(""),
  content: z
    .string()
    .max(200000, "Content must be at most 200,000 characters")
    .optional()
    .default(""),
  tags: z
    .array(tagSchema)
    .max(20, "A note can have at most 20 tags")
    .optional()
    .default([]),
});

export const updateNoteSchema = z.object({
  title: z.string().max(500, "Title must be at most 500 characters").optional(),
  content: z
    .string()
    .max(200000, "Content must be at most 200,000 characters")
    .optional(),
  isArchived: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  tags: z
    .array(tagSchema)
    .max(20, "A note can have at most 20 tags")
    .optional(),
});


export const aiTypeSchema = z.object({
  type: z.enum(["summary", "action_items", "title", "all"], {
    errorMap: () => ({
      message: "Invalid type. Use: summary, action_items, title, or all",
    }),
  }),
});


export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional().default(""),
  tag: z.string().max(50).optional().default(""),
  sort: z.enum(["updatedAt", "createdAt", "title"]).default("updatedAt"),
  archived: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

// Parse and validate request body with a Zod schema
export function parseBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const message = result.error.errors.map((e) => e.message).join(", ");
  return { success: false, error: message };
}
