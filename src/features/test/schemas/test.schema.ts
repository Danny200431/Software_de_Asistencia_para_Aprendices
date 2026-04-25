import { z } from "zod";

export const createTestInputSchema = z.object({
  dato: z.string().trim().min(1, "El campo dato es obligatorio")
});

export const createTestResponseSchema = z.object({
  ok: z.boolean(),
  id: z.number().optional(),
  error: z.string().optional()
});
