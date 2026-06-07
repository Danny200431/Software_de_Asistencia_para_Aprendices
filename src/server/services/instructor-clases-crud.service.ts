import { prisma } from "@/src/server/config/db/prisma";

export type ClaseGestionInput = {
  nombreTema?: string | null;
  fecha?: string | null;
  horaInicio?: string | null;
  ambienteIdAmbiente: number;
  cursoCompetenciaIdCurso: number;
  fichaIdFicha: number;
};

export class InstructorClasesCrudError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "InstructorClasesCrudError";
  }
}

export class InstructorClasesCrudService {
  private async assertCompetenciaPerteneceAFicha(
    fichaIdFicha: number,
    cursoCompetenciaIdCurso: number
  ) {
    const ficha = await prisma.ficha.findUnique({
      where: { idFicha: fichaIdFicha },
      select: { idProgramaFormacion: true }
    });

    if (!ficha?.idProgramaFormacion) {
      throw new InstructorClasesCrudError("La ficha seleccionada no existe.", 400);
    }

    const programaId = Number.parseInt(ficha.idProgramaFormacion, 10);
    if (!Number.isFinite(programaId)) {
      throw new InstructorClasesCrudError(
        "La ficha seleccionada no tiene un programa de formacion valido.",
        400
      );
    }

    const relacion = await prisma.programaFormacionHasCursoCompetencia.findFirst({
      where: {
        programaFormacionIdProgramaFormacion: programaId,
        cursoCompetenciaIdCurso: cursoCompetenciaIdCurso
      },
      select: { cursoCompetenciaIdCurso: true }
    });

    if (!relacion) {
      throw new InstructorClasesCrudError(
        "La competencia seleccionada no pertenece al programa de la ficha.",
        400
      );
    }
  }

  async listGestion() {
    const [clases, ambientes, cursos, fichas, competenciasPorPrograma] = await Promise.all([
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
        select: { idFicha: true, numeroFicha: true, idProgramaFormacion: true }
      }),
      prisma.programaFormacionHasCursoCompetencia.findMany({
        include: {
          cursoCompetencia: {
            select: { idCurso: true, nombreCurso: true }
          }
        }
      })
    ]);

    const competenciasPorProgramaMap: Record<
      string,
      Array<{ idCurso: number; nombreCurso: string }>
    > = {};

    for (const row of competenciasPorPrograma) {
      const key = String(row.programaFormacionIdProgramaFormacion);
      const list = competenciasPorProgramaMap[key] ?? [];
      list.push(row.cursoCompetencia);
      competenciasPorProgramaMap[key] = list;
    }

    for (const key of Object.keys(competenciasPorProgramaMap)) {
      competenciasPorProgramaMap[key].sort((a, b) =>
        a.nombreCurso.localeCompare(b.nombreCurso, "es")
      );
    }

    return { clases, ambientes, cursos, fichas, competenciasPorPrograma: competenciasPorProgramaMap };
  }

  private async nextClaseId(): Promise<number> {
    const agg = await prisma.clase.aggregate({ _max: { idClase: true } });
    return (agg._max.idClase ?? 0) + 1;
  }

  async createClase(input: ClaseGestionInput) {
    await this.assertCompetenciaPerteneceAFicha(
      input.fichaIdFicha,
      input.cursoCompetenciaIdCurso
    );

    const idClase = await this.nextClaseId();
    return prisma.clase.create({
      data: {
        idClase,
        nombreTema: input.nombreTema?.trim() || null,
        fecha: input.fecha ?? null,
        horaInicio: input.horaInicio ?? null,
        ambienteIdAmbiente: input.ambienteIdAmbiente,
        cursoCompetenciaIdCurso: input.cursoCompetenciaIdCurso,
        fichaIdFicha: input.fichaIdFicha
      }
    });
  }

  async updateClase(idClase: number, input: Partial<ClaseGestionInput>) {
    const actual = await prisma.clase.findUnique({
      where: { idClase },
      select: { fichaIdFicha: true, cursoCompetenciaIdCurso: true }
    });

    if (!actual) {
      throw new InstructorClasesCrudError("La clase no existe.", 404);
    }

    const fichaId = input.fichaIdFicha ?? actual.fichaIdFicha;
    const cursoId = input.cursoCompetenciaIdCurso ?? actual.cursoCompetenciaIdCurso;
    await this.assertCompetenciaPerteneceAFicha(fichaId, cursoId);

    const data: Record<string, unknown> = {};
    if (input.nombreTema !== undefined) data.nombreTema = input.nombreTema?.trim() || null;
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
