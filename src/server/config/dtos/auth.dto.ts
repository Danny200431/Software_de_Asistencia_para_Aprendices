import { z } from "zod";
import type { LoginInput } from "@/src/server/config/types/auth.types";

const loginInputSchema = z.object({
  usemame: z.string().trim().min(1, "Usuario requerido"),
  Contrasenia: z.string().trim().min(1, "Contrasenia requerida")
});

export function parseLoginInput(input: unknown): LoginInput {
  return loginInputSchema.parse(input);
}
