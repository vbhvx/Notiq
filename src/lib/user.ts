import { prisma } from "@/lib/prisma";

const DEFAULT_EMAIL = "default@notiq.local";

export async function getDefaultUserId(): Promise<string> {
  if (process.env.DEFAULT_USER_ID) {
    return process.env.DEFAULT_USER_ID;
  }

  let user = await prisma.user.findUnique({
    where: { email: DEFAULT_EMAIL },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: process.env.DEFAULT_USER_NAME || "Notiq",
        email: DEFAULT_EMAIL,
        passwordHash: "unused",
      },
    });
  }

  return user.id;
}
