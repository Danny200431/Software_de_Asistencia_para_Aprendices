import { z } from "zod";
import type {
  ForgotPasswordInput,
  ResetPasswordInput
} from "@/src/server/config/types/password-reset.types";

const forgotPasswordInputSchema = z.object({
  identificador: z.string().trim().min(1, "Ingrese su usuario o correo electronico")
});

const resetPasswordInputSchema = z.object({
  token: z.string().trim().min(1, "Token requerido"),
  contrasenia: z.string().trim().min(1, "La contraseña es obligatoria")
});

export function parseForgotPasswordInput(input: unknown): ForgotPasswordInput {
  return forgotPasswordInputSchema.parse(input);
}

export function parseResetPasswordInput(input: unknown): ResetPasswordInput {
  return resetPasswordInputSchema.parse(input);
}
