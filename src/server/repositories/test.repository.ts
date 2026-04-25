import { prisma } from "@/src/server/config/db/prisma";

export async function createTestInputRepository(dato: string) {
  return prisma.testInput.create({
    data: { dato },
    select: { id: true }
  });
}
