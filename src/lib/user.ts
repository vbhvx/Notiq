import { prisma } from "@/lib/prisma";

export async function getDefaultUserId(): Promise<string> {
  if (process.env.DEFAULT_USER_ID) {
    return process.env.DEFAULT_USER_ID;
  }

  let user = await prisma.user.findFirst();

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: process.env.DEFAULT_USER_NAME || "Notiq Public Workspace",
      },
    });
  }

  return user.id;
}
