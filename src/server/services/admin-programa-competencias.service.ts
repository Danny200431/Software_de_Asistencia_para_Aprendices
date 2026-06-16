import { prisma } from "@/src/server/config/db/prisma";

export class AdminProgramaCompetenciasService {
  async listGestion() {
    const [asignaciones, programas, competencias] = await Promise.all([
      prisma.programaFormacionHasCursoCompetencia.findMany({
        include: {
          programaFormacion: { select: { idProgramaFormacion: true, nombrePrograma: true } },
          cursoCompetencia: { select: { idCurso: true, nombreCurso: true } }
        },
        orderBy: { programaFormacionIdProgramaFormacion: "asc" }
      }),
      prisma.programaFormacion.findMany({
        orderBy: { nombrePrograma: "asc" },
        select: { idProgramaFormacion: true, nombrePrograma: true }
      }),
      prisma.cursoCompetencia.findMany({
        orderBy: { nombreCurso: "asc" },
        select: { idCurso: true, nombreCurso: true }
      })
    ]);
    return { asignaciones, programas, competencias };
  }

  async assign(programaId: number, cursoId: number) {
    await prisma.programaFormacion.findUniqueOrThrow({ where: { idProgramaFormacion: programaId } });
    await prisma.cursoCompetencia.findUniqueOrThrow({ where: { idCurso: cursoId } });
    return prisma.programaFormacionHasCursoCompetencia.upsert({
      where: { cursoCompetenciaIdCurso: cursoId },
      update: { programaFormacionIdProgramaFormacion: programaId },
      create: { cursoCompetenciaIdCurso: cursoId, programaFormacionIdProgramaFormacion: programaId }
    });
  }

  async unassign(cursoId: number) {
    const clases = await prisma.clase.count({ where: { cursoCompetenciaIdCurso: cursoId } });
    if (clases > 0) throw new Error("No se puede desasignar: la competencia tiene clases asociadas");
    await prisma.programaFormacionHasCursoCompetencia.delete({ where: { cursoCompetenciaIdCurso: cursoId } });
  }
}
