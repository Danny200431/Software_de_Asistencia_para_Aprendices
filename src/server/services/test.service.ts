import type { CreateTestResult } from "@/src/server/config/types/test.types";
import { createTestInputRepository } from "@/src/server/repositories/test.repository";

export async function createTestService(dato: string): Promise<CreateTestResult> {
  const created = await createTestInputRepository(dato);
  return { id: created.id };
}
