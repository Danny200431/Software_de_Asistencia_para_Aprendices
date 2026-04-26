import { z } from "zod";

export const loginInputSchema = z.object({
  usemame: z.string().trim().min(1, "Usuario requerido"),
  Contrasenia: z.string().trim().min(1, "Contrasenia requerida")
});

export const loginResponseSchema = z.object({
  ok: z.boolean(),
  token: z.string().optional(),
  user: z
    .object({
      id: z.number(),
      nombre: z.string(),
      apellido: z.string(),
      usemame: z.string(),
      rol: z.string(),
      correo_electronico: z.string()
    })
    .optional(),
  error: z.string().optional()
});
