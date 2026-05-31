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
        nombreTema: true,
        fecha: true,
        horaInicio: true,
        ambiente: {
          select: { nombreAmbiente: true }
        }
      },
      orderBy: { idClase: "asc" }
    });
  }

  async listAsistenciasPorClase(claseId: number) {
    const rows = await prisma.asistencia.findMany({
      where: { claseIdClase: claseId },
      orderBy: { idAsistencia: "asc" }
    });

    const idsUsuario = [
      ...new Set(
        rows
          .map((r) => r.idAprendiz)
          .filter((v): v is string => v != null && v !== "")
          .map((s) => Number.parseInt(s, 10))
          .filter((n) => Number.isFinite(n))
      )
    ];

    const usuarios =
      idsUsuario.length > 0
        ? await prisma.usuario.findMany({
            where: { idUsuario: { in: idsUsuario } },
            select: {
              idUsuario: true,
              nombre: true,
              apellido: true,
              numeroDocumento: true
            }
          })
        : [];

    const porId = new Map(usuarios.map((u) => [u.idUsuario, u]));

    return rows.map((a) => {
      const uid = a.idAprendiz ? Number.parseInt(a.idAprendiz, 10) : NaN;
      const u = Number.isFinite(uid) ? porId.get(uid) : undefined;
      const aprendizNombre = u
        ? `${u.nombre} ${u.apellido}`.trim()
        : a.idAprendiz ?? null;

      return {
        idAsistencia: a.idAsistencia,
        fecha: a.fecha,
        horaIngreso: a.horaIngreso,
        estado: a.estadoPresenteTardeAusente,
        idAprendiz: a.idAprendiz,
        aprendizNombre,
        documentoAprendiz: u?.numeroDocumento ?? null
      };
    });
  }
}
