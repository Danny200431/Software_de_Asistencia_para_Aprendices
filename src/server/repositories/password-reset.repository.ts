import { prisma } from "@/src/server/config/db/prisma";

export class PasswordResetRepository {
  async findUserByEmailOrUsername(identificador: string) {
    const value = identificador.trim();
    const isEmail = value.includes("@");

    if (isEmail) {
      return prisma.usuario.findFirst({
        where: {
          correoElectronico: { equals: value, mode: "insensitive" }
        },
        include: { rol: true }
      });
    }

    return prisma.usuario.findFirst({
      where: { usemame: value },
      include: { rol: true }
    });
  }

  async invalidateActiveTokens(usuarioId: number, rolIdRol: number) {
    await prisma.passwordResetToken.updateMany({
      where: {
        usuarioId,
        rolIdRol,
        usedAt: null,
        expiresAt: { gt: new Date() }
      },
      data: { usedAt: new Date() }
    });
  }

  async createToken(params: {
    token: string;
    usuarioId: number;
    rolIdRol: number;
    expiresAt: Date;
  }) {
    return prisma.passwordResetToken.create({
      data: {
        token: params.token,
        usuarioId: params.usuarioId,
        rolIdRol: params.rolIdRol,
        expiresAt: params.expiresAt
      }
    });
  }

  async findValidToken(token: string) {
    return prisma.passwordResetToken.findFirst({
      where: {
        token,
        usedAt: null,
        expiresAt: { gt: new Date() }
      }
    });
  }

  async markTokenUsed(id: number) {
    await prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() }
    });
  }

  async updatePassword(usuarioId: number, rolIdRol: number, hashedPassword: string) {
    await prisma.usuario.update({
      where: { idUsuario_rolIdRol: { idUsuario: usuarioId, rolIdRol } },
      data: { contrasenia: hashedPassword }
    });
  }
}
