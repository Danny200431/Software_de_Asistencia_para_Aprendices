import { prisma } from "@/src/server/config/db/prisma";

export type ClaseGestionInput = {
  fecha?: string | null;
  horaInicio?: string | null;
  ambienteIdAmbiente: number;
  cursoCompetenciaIdCurso: number;
  fichaIdFicha: number;
};

export class InstructorClasesCrudService {
  async listGestion() {
    const [clases, ambientes, cursos, fichas] = await Promise.all([
      prisma.clase.findMany({
        orderBy: { idClase: "desc" },
        include: {
          ambiente: { select: { idAmbiente: true, nombreAmbiente: true } },
          cursoCompetencia: { select: { idCurso: true, nombreCurso: true } },
          ficha: { select: { idFicha: true, numeroFicha: true } }
        }
      }),
      prisma.ambiente.findMany({
        orderBy: { idAmbiente: "asc" },
        select: { idAmbiente: true, nombreAmbiente: true, ubicacion: true }
      }),
      prisma.cursoCompetencia.findMany({
        orderBy: { nombreCurso: "asc" },
        select: { idCurso: true, nombreCurso: true }
      }),
      prisma.ficha.findMany({
        orderBy: { idFicha: "desc" },
        select: { idFicha: true, numeroFicha: true }
      })
    ]);

    return { clases, ambientes, cursos, fichas };
  }

  private async nextClaseId(): Promise<number> {
    const agg = await prisma.clase.aggregate({ _max: { idClase: true } });
    return (agg._max.idClase ?? 0) + 1;
  }

  async createClase(input: ClaseGestionInput) {
    const idClase = await this.nextClaseId();
    return prisma.clase.create({
      data: {
        idClase,
        fecha: input.fecha ?? null,
        horaInicio: input.horaInicio ?? null,
        ambienteIdAmbiente: input.ambienteIdAmbiente,
        cursoCompetenciaIdCurso: input.cursoCompetenciaIdCurso,
        fichaIdFicha: input.fichaIdFicha
      }
    });
  }

  async updateClase(idClase: number, input: Partial<ClaseGestionInput>) {
    const data: Record<string, unknown> = {};
    if (input.fecha !== undefined) data.fecha = input.fecha;
    if (input.horaInicio !== undefined) data.horaInicio = input.horaInicio;
    if (input.ambienteIdAmbiente !== undefined) data.ambienteIdAmbiente = input.ambienteIdAmbiente;
    if (input.cursoCompetenciaIdCurso !== undefined)
      data.cursoCompetenciaIdCurso = input.cursoCompetenciaIdCurso;
    if (input.fichaIdFicha !== undefined) data.fichaIdFicha = input.fichaIdFicha;

    return prisma.clase.update({
      where: { idClase },
      data
    });
  }

  async deleteClase(idClase: number) {
    await prisma.$transaction([
      prisma.asistencia.deleteMany({ where: { claseIdClase: idClase } }),
      prisma.clase.delete({ where: { idClase } })
    ]);
  }
}
