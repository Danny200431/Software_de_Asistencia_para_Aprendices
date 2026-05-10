import { prisma } from "@/src/server/config/db/prisma";

export type FichaCreateInput = {
  numeroFicha?: string | null;
  idProgramaFormacion?: string | null;
  usuarioIdUsuario: number;
  usuarioRolIdRol: number;
};

export type FichaUpdateInput = {
  numeroFicha?: string | null;
  idProgramaFormacion?: string | null;
};

export class InstructorFichasCrudService {
  async listGestion() {
    const [fichas, programas, aprendicesUsuarios] = await Promise.all([
      prisma.ficha.findMany({
        orderBy: { idFicha: "desc" },
        include: {
          usuario: {
            select: {
              idUsuario: true,
              nombre: true,
              apellido: true,
              rolIdRol: true
            }
          }
        }
      }),
      prisma.programaFormacion.findMany({
        orderBy: { nombrePrograma: "asc" },
        select: { idProgramaFormacion: true, nombrePrograma: true }
      }),
      prisma.usuario.findMany({
        where: { rolIdRol: 1 },
        select: { idUsuario: true, nombre: true, apellido: true, rolIdRol: true },
        orderBy: { nombre: "asc" }
      })
    ]);

    const programaNombrePorId = new Map(
      programas.map((p) => [String(p.idProgramaFormacion), p.nombrePrograma])
    );

    const fichasConPrograma = fichas.map((f) => ({
      ...f,
      programaNombre:
        f.idProgramaFormacion != null && f.idProgramaFormacion !== ""
          ? programaNombrePorId.get(f.idProgramaFormacion) ?? null
          : null
    }));

    return {
      fichas: fichasConPrograma,
      programas,
      aprendices: aprendicesUsuarios
    };
  }

  private async nextFichaId(): Promise<number> {
    const agg = await prisma.ficha.aggregate({ _max: { idFicha: true } });
    return (agg._max.idFicha ?? 0) + 1;
  }

  async createFicha(input: FichaCreateInput) {
    const idFicha = await this.nextFichaId();

    return prisma.$transaction(async (tx) => {
      const ficha = await tx.ficha.create({
        data: {
          idFicha,
          numeroFicha: input.numeroFicha ?? null,
          idProgramaFormacion: input.idProgramaFormacion ?? null,
          usuarioIdUsuario: input.usuarioIdUsuario,
          usuarioRolIdRol: input.usuarioRolIdRol
        }
      });

      await tx.aprendiz.upsert({
        where: { usuarioIdUsuario: input.usuarioIdUsuario },
        update: { fichaIdFicha: idFicha },
        create: {
          fichaIdFicha: idFicha,
          usuarioIdUsuario: input.usuarioIdUsuario
        }
      });

      return ficha;
    });
  }

  async updateFicha(idFicha: number, input: FichaUpdateInput) {
    const data: Record<string, unknown> = {};
    if (input.numeroFicha !== undefined) data.numeroFicha = input.numeroFicha;
    if (input.idProgramaFormacion !== undefined) data.idProgramaFormacion = input.idProgramaFormacion;

    return prisma.ficha.update({
      where: { idFicha },
      data
    });
  }

  async deleteFicha(idFicha: number) {
    await prisma.$transaction(async (tx) => {
      const clases = await tx.clase.findMany({
        where: { fichaIdFicha: idFicha },
        select: { idClase: true }
      });
      const claseIds = clases.map((c) => c.idClase);
      if (claseIds.length > 0) {
        await tx.asistencia.deleteMany({ where: { claseIdClase: { in: claseIds } } });
        await tx.clase.deleteMany({ where: { fichaIdFicha: idFicha } });
      }
      await tx.aprendiz.deleteMany({ where: { fichaIdFicha: idFicha } });
      await tx.ficha.delete({ where: { idFicha } });
    });
  }
}
