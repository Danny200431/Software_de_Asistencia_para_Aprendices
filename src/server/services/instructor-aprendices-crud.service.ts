import { prisma } from "@/src/server/config/db/prisma";

const ROL_APRENDIZ = 1;

export class InstructorAprendicesCrudService {
  async listGestion() {
    const [vinculos, fichas, usuariosDisponibles] = await Promise.all([
      prisma.aprendiz.findMany({
        include: {
          usuario: {
            select: {
              idUsuario: true,
              nombre: true,
              apellido: true,
              numeroDocumento: true,
              correoElectronico: true,
              usemame: true,
              rolIdRol: true
            }
          },
          ficha: {
            select: { idFicha: true, numeroFicha: true }
          }
        },
        orderBy: [{ usuarioIdUsuario: "asc" }]
      }),
      prisma.ficha.findMany({
        select: { idFicha: true, numeroFicha: true },
        orderBy: { idFicha: "desc" }
      }),
      prisma.usuario.findMany({
        where: {
          rolIdRol: ROL_APRENDIZ,
          aprendiz: { is: null }
        },
        select: {
          idUsuario: true,
          nombre: true,
          apellido: true,
          numeroDocumento: true,
          rolIdRol: true
        },
        orderBy: { nombre: "asc" }
      })
    ]);

    return { vinculos, fichas, usuariosDisponibles };
  }

  async createVinculo(usuarioIdUsuario: number, fichaIdFicha: number) {
    const usuario = await prisma.usuario.findUnique({
      where: { idUsuario: usuarioIdUsuario },
      select: { idUsuario: true, rolIdRol: true }
    });

    if (!usuario || usuario.rolIdRol !== ROL_APRENDIZ) {
      throw new Error("El usuario no es un aprendiz valido");
    }

    const existe = await prisma.aprendiz.findUnique({
      where: { usuarioIdUsuario }
    });
    if (existe) {
      throw new Error("Este aprendiz ya tiene una ficha asignada");
    }

    await prisma.ficha.findUniqueOrThrow({
      where: { idFicha: fichaIdFicha },
      select: { idFicha: true }
    });

    return prisma.aprendiz.create({
      data: { usuarioIdUsuario, fichaIdFicha }
    });
  }

  async updateVinculoFicha(usuarioIdUsuario: number, fichaIdFicha: number) {
    const actual = await prisma.aprendiz.findUnique({
      where: { usuarioIdUsuario }
    });
    if (!actual) {
      throw new Error("No hay vinculo para este aprendiz");
    }

    await prisma.ficha.findUniqueOrThrow({
      where: { idFicha: fichaIdFicha },
      select: { idFicha: true }
    });

    if (actual.fichaIdFicha === fichaIdFicha) {
      return actual;
    }

    return prisma.$transaction(async (tx) => {
      await tx.aprendiz.delete({
        where: { usuarioIdUsuario }
      });
      return tx.aprendiz.create({
        data: { usuarioIdUsuario, fichaIdFicha }
      });
    });
  }

  async deleteVinculo(usuarioIdUsuario: number) {
    await prisma.aprendiz.delete({
      where: { usuarioIdUsuario }
    });
  }
}
