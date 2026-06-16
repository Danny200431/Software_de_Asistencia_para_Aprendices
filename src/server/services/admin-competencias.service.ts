import { prisma } from "@/src/server/config/db/prisma";

export type CompetenciaInput = {
  nombreCurso: string;
  nivelFormacion?: string | null;
  duracion: string;
  idUsuario: string;
};

export class AdminCompetenciasService {
  async listGestion() {
    const [competencias, instructores] = await Promise.all([
      prisma.cursoCompetencia.findMany({
        orderBy: { nombreCurso: "asc" },
        include: {
          programasCursos: {
            include: {
              programaFormacion: { select: { idProgramaFormacion: true, nombrePrograma: true } }
            }
          }
        }
      }),
      prisma.instructor.findMany({
        include: {
          usuario: { select: { idUsuario: true, nombre: true, apellido: true } }
        },
        orderBy: { usuarioIdUsuario: "asc" }
      })
    ]);
    return { competencias, instructores };
  }

  private async nextId() {
    const agg = await prisma.cursoCompetencia.aggregate({ _max: { idCurso: true } });
    return (agg._max.idCurso ?? 0) + 1;
  }

  async create(input: CompetenciaInput) {
    const nombreCurso = input.nombreCurso.trim();
    const duracion = input.duracion.trim();
    const idUsuario = input.idUsuario.trim();
    if (!nombreCurso || !duracion || !idUsuario) {
      throw new Error("Nombre, duracion e instructor son obligatorios");
    }
    return prisma.cursoCompetencia.create({
      data: {
        idCurso: await this.nextId(),
        nombreCurso,
        nivelFormacion: input.nivelFormacion?.trim() || null,
        duracion,
        idUsuario
      }
    });
  }

  async update(id: number, input: Partial<CompetenciaInput>) {
    const data: Record<string, unknown> = {};
    if (input.nombreCurso !== undefined) {
      const v = input.nombreCurso.trim();
      if (!v) throw new Error("El nombre de la competencia es obligatorio");
      data.nombreCurso = v;
    }
    if (input.nivelFormacion !== undefined) data.nivelFormacion = input.nivelFormacion?.trim() || null;
    if (input.duracion !== undefined) {
      const v = input.duracion.trim();
      if (!v) throw new Error("La duracion es obligatoria");
      data.duracion = v;
    }
    if (input.idUsuario !== undefined) {
      const v = input.idUsuario.trim();
      if (!v) throw new Error("El instructor es obligatorio");
      data.idUsuario = v;
    }
    return prisma.cursoCompetencia.update({ where: { idCurso: id }, data });
  }

  async delete(id: number) {
    const clases = await prisma.clase.count({ where: { cursoCompetenciaIdCurso: id } });
    if (clases > 0) throw new Error("No se puede eliminar: la competencia tiene clases asociadas");
    await prisma.$transaction(async (tx) => {
      await tx.programaFormacionHasCursoCompetencia.deleteMany({ where: { cursoCompetenciaIdCurso: id } });
      await tx.cursoCompetencia.delete({ where: { idCurso: id } });
    });
  }
}
