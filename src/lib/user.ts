import { prisma } from "@/lib/prisma";

let cachedUserId: string | null = null;

export async function getDefaultUserId(): Promise<string> {
  if (process.env.DEFAULT_USER_ID) {
    return process.env.DEFAULT_USER_ID;
  }

  if (cachedUserId) {
    return cachedUserId;
  }

  let user = await prisma.user.findFirst();

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: process.env.DEFAULT_USER_NAME || "Notiq Public Workspace",
      },
    });
  }

  cachedUserId = user.id;
  return user.id;
}
