import { prisma } from "@/src/server/config/db/prisma";
import { diaSemanaDeFecha } from "@/src/server/lib/weekly-dates";

export type HorarioSesion = {
  idClase: number;
  fecha: string | null;
};

export type HorarioEntry = {
  diaSemana: number;
  horaInicio: string | null;
  nombreTema: string | null;
  competenciaNombre: string;
  ambienteNombre: string | null;
  sessions: HorarioSesion[];
};

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

  async listHorarioPorFicha(fichaId: number): Promise<HorarioEntry[]> {
    const clases = await prisma.clase.findMany({
      where: { fichaIdFicha: fichaId },
      select: {
        idClase: true,
        nombreTema: true,
        fecha: true,
        horaInicio: true,
        ambiente: { select: { nombreAmbiente: true } },
        cursoCompetencia: { select: { idCurso: true, nombreCurso: true } }
      },
      orderBy: { fecha: "asc" }
    });

    const grupos = new Map<string, HorarioEntry>();

    for (const clase of clases) {
      if (!clase.fecha) continue;
      const diaSemana = diaSemanaDeFecha(clase.fecha);
      if (diaSemana == null) continue;

      const key = [
        diaSemana,
        clase.horaInicio ?? "",
        clase.cursoCompetencia.idCurso,
        clase.nombreTema ?? "",
        clase.ambiente.nombreAmbiente ?? ""
      ].join("|");

      const existente = grupos.get(key);
      if (existente) {
        existente.sessions.push({ idClase: clase.idClase, fecha: clase.fecha });
      } else {
        grupos.set(key, {
          diaSemana,
          horaInicio: clase.horaInicio,
          nombreTema: clase.nombreTema,
          competenciaNombre: clase.cursoCompetencia.nombreCurso,
          ambienteNombre: clase.ambiente.nombreAmbiente,
          sessions: [{ idClase: clase.idClase, fecha: clase.fecha }]
        });
      }
    }

    return [...grupos.values()].sort((a, b) => {
      if (a.diaSemana !== b.diaSemana) return a.diaSemana - b.diaSemana;
      return (a.horaInicio ?? "").localeCompare(b.horaInicio ?? "");
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
