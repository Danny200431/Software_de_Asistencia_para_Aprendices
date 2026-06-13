import { z } from "zod";

export const forgotPasswordInputSchema = z.object({
  identificador: z.string().trim().min(1, "Ingrese su usuario o correo electronico")
});

export const resetPasswordInputSchema = z.object({
  token: z.string().trim().min(1, "El enlace de recuperacion no es valido"),
  contrasenia: z.string().trim().min(1, "La contraseña es obligatoria"),
  confirmarContrasenia: z.string().trim().min(1, "Confirme la contraseña")
});

export const forgotPasswordResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional()
});

export const resetPasswordResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional()
});
