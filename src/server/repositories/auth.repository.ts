import { prisma } from "@/src/server/config/db/prisma";

export async function findUserByUsername(usemame: string) {
  return prisma.usuario.findFirst({
    where: { usemame },
    include: { rol: true }
  });
}
