import { z } from "zod";
import type { CreateTestInput } from "@/src/server/config/types/test.types";

const createTestInputSchema = z.object({
  dato: z.string().trim().min(1, "El campo dato es obligatorio")
});

export function parseCreateTestInput(input: unknown): CreateTestInput {
  return createTestInputSchema.parse(input);
}
