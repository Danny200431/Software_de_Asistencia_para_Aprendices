import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { validatePassword } from "@/src/lib/validatePassword";
import { PasswordResetRepository } from "@/src/server/repositories/password-reset.repository";
import {
  buildPasswordResetUrl,
  sendPasswordResetEmail
} from "@/src/server/services/password-reset-email.service";

const BCRYPT_ROUNDS = 12;
const TOKEN_TTL_MS = 60 * 60 * 1000;

const GENERIC_FORGOT_MESSAGE =
  "Si el usuario o correo esta registrado, recibiras un enlace para restablecer tu contraseña.";

export class PasswordResetService {
  constructor(
    private readonly repository: PasswordResetRepository = new PasswordResetRepository()
  ) {}

  async requestReset(identificador: string) {
    const user = await this.repository.findUserByEmailOrUsername(identificador);

    if (!user) {
      return {
        ok: true as const,
        status: 200,
        message: GENERIC_FORGOT_MESSAGE
      };
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await this.repository.invalidateActiveTokens(user.idUsuario, user.rolIdRol);
    await this.repository.createToken({
      token,
      usuarioId: user.idUsuario,
      rolIdRol: user.rolIdRol,
      expiresAt
    });

    const resetUrl = buildPasswordResetUrl(token);
    const emailSent = await sendPasswordResetEmail({
      to: user.correoElectronico,
      nombre: user.nombre,
      apellido: user.apellido,
      resetUrl
    });

    if (!emailSent) {
      console.warn(
        `[password-reset] Token creado para usuario ${user.idUsuario}, pero no se pudo enviar correo. Enlace: ${resetUrl}`
      );
    }

    return {
      ok: true as const,
      status: 200,
      message: GENERIC_FORGOT_MESSAGE
    };
  }

  async resetPassword(token: string, contrasenia: string) {
    const passwordError = validatePassword(contrasenia);
    if (passwordError) {
      return { ok: false as const, status: 400, error: passwordError };
    }

    const resetToken = await this.repository.findValidToken(token);
    if (!resetToken) {
      return {
        ok: false as const,
        status: 400,
        error: "El enlace de recuperacion es invalido o ya expiro"
      };
    }

    const hashedPassword = await hash(contrasenia, BCRYPT_ROUNDS);

    await this.repository.updatePassword(
      resetToken.usuarioId,
      resetToken.rolIdRol,
      hashedPassword
    );
    await this.repository.markTokenUsed(resetToken.id);
    await this.repository.invalidateActiveTokens(resetToken.usuarioId, resetToken.rolIdRol);

    return {
      ok: true as const,
      status: 200,
      message: "Tu contraseña fue actualizada correctamente"
    };
  }
}
