import { prisma } from "@/src/server/config/db/prisma";

export class InstructorFiltrosService {
  async listProgramas() {
    return prisma.programaFormacion.findMany({
      select: {
        idProgramaFormacion: true,
        nombrePrograma: true
      },
      orderBy: { nombrePrograma: "asc" }
    });
  }

  async listCompetenciasPorPrograma(programaId: number) {
    const rows = await prisma.programaFormacionHasCursoCompetencia.findMany({
      where: { programaFormacionIdProgramaFormacion: programaId },
      include: {
        cursoCompetencia: {
          select: { idCurso: true, nombreCurso: true }
        }
      }
    });

    const list = rows.map((row) => row.cursoCompetencia);
    list.sort((a, b) => a.nombreCurso.localeCompare(b.nombreCurso, "es"));
    return list;
  }

  async listFichasPorPrograma(programaId: number) {
    return prisma.ficha.findMany({
      where: { idProgramaFormacion: String(programaId) },
      select: {
        idFicha: true,
        numeroFicha: true
      },
      orderBy: { numeroFicha: "asc" }
    });
  }

  async listClasesPorFichaYCompetencia(fichaId: number, competenciaId: number) {
    return prisma.clase.findMany({
      where: {
        fichaIdFicha: fichaId,
        cursoCompetenciaIdCurso: competenciaId
      },
      select: {
        idClase: true,
        fecha: true,
        horaInicio: true,
        ambiente: {
          select: { nombreAmbiente: true }
        }
      },
      orderBy: { idClase: "asc" }
    });
  }
}
