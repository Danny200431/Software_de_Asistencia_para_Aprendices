import { prisma } from "@/src/server/config/db/prisma";

export type FichaCreateInput = {
  numeroFicha?: string | null;
  idProgramaFormacion?: string | null;
};

export type FichaUpdateInput = {
  numeroFicha?: string | null;
  idProgramaFormacion?: string | null;
};

export class InstructorFichasCrudService {
  async listGestion() {
    const [fichas, programas] = await Promise.all([
      prisma.ficha.findMany({
        orderBy: { idFicha: "desc" },
        include: {
          _count: { select: { aprendiz: true } }
        }
      }),
      prisma.programaFormacion.findMany({
        orderBy: { nombrePrograma: "asc" },
        select: { idProgramaFormacion: true, nombrePrograma: true }
      })
    ]);

    const programaNombrePorId = new Map(
      programas.map((p) => [String(p.idProgramaFormacion), p.nombrePrograma])
    );

    const fichasConPrograma = fichas.map((f) => ({
      idFicha: f.idFicha,
      numeroFicha: f.numeroFicha,
      idProgramaFormacion: f.idProgramaFormacion,
      programaNombre:
        f.idProgramaFormacion != null && f.idProgramaFormacion !== ""
          ? programaNombrePorId.get(f.idProgramaFormacion) ?? null
          : null,
      aprendicesCount: f._count.aprendiz
    }));

    return { fichas: fichasConPrograma, programas };
  }

  private async nextFichaId(): Promise<number> {
    const agg = await prisma.ficha.aggregate({ _max: { idFicha: true } });
    return (agg._max.idFicha ?? 0) + 1;
  }

  async createFicha(input: FichaCreateInput) {
    const idFicha = await this.nextFichaId();

    return prisma.ficha.create({
      data: {
        idFicha,
        numeroFicha: input.numeroFicha ?? null,
        idProgramaFormacion: input.idProgramaFormacion ?? null
      }
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
    const aprendicesCount = await prisma.aprendiz.count({ where: { fichaIdFicha: idFicha } });
    if (aprendicesCount > 0) {
      throw new Error("No se puede eliminar: hay aprendices asignados a esta ficha");
    }

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
      await tx.instructorFicha.deleteMany({ where: { fichaIdFicha: idFicha } });
      await tx.ficha.delete({ where: { idFicha } });
    });
  }
}
