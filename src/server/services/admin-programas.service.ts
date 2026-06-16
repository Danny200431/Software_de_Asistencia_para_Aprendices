import { prisma } from "@/src/server/config/db/prisma";

export type ProgramaInput = {
  nombrePrograma: string;
  nivelFormacion: string;
  usuarioIdAprendiz: number;
  usuarioRolIdRol: number;
};

export class AdminProgramasService {
  async listGestion() {
    const [programas, aprendices] = await Promise.all([
      prisma.programaFormacion.findMany({
        orderBy: { nombrePrograma: "asc" },
        include: {
          usuario: { select: { idUsuario: true, nombre: true, apellido: true } }
        }
      }),
      prisma.usuario.findMany({
        where: { rolIdRol: 1 },
        select: { idUsuario: true, nombre: true, apellido: true, rolIdRol: true },
        orderBy: { nombre: "asc" }
      })
    ]);
    return { programas, aprendices };
  }

  private async nextId() {
    const agg = await prisma.programaFormacion.aggregate({ _max: { idProgramaFormacion: true } });
    return (agg._max.idProgramaFormacion ?? 0) + 1;
  }

  async create(input: ProgramaInput) {
    const nombrePrograma = input.nombrePrograma.trim();
    const nivelFormacion = input.nivelFormacion.trim();
    if (!nombrePrograma || !nivelFormacion) {
      throw new Error("Nombre y nivel de formacion son obligatorios");
    }
    await prisma.usuario.findUniqueOrThrow({
      where: {
        idUsuario_rolIdRol: {
          idUsuario: input.usuarioIdAprendiz,
          rolIdRol: input.usuarioRolIdRol
        }
      }
    });
    return prisma.programaFormacion.create({
      data: {
        idProgramaFormacion: await this.nextId(),
        nombrePrograma,
        nivelFormacion,
        usuarioIdAprendiz: input.usuarioIdAprendiz,
        usuarioRolIdRol: input.usuarioRolIdRol
      }
    });
  }

  async update(id: number, input: Partial<ProgramaInput>) {
    const data: Record<string, unknown> = {};
    if (input.nombrePrograma !== undefined) {
      const v = input.nombrePrograma.trim();
      if (!v) throw new Error("El nombre del programa es obligatorio");
      data.nombrePrograma = v;
    }
    if (input.nivelFormacion !== undefined) {
      const v = input.nivelFormacion.trim();
      if (!v) throw new Error("El nivel de formacion es obligatorio");
      data.nivelFormacion = v;
    }
    if (input.usuarioIdAprendiz !== undefined && input.usuarioRolIdRol !== undefined) {
      await prisma.usuario.findUniqueOrThrow({
        where: {
          idUsuario_rolIdRol: {
            idUsuario: input.usuarioIdAprendiz,
            rolIdRol: input.usuarioRolIdRol
          }
        }
      });
      data.usuarioIdAprendiz = input.usuarioIdAprendiz;
      data.usuarioRolIdRol = input.usuarioRolIdRol;
    }
    return prisma.programaFormacion.update({ where: { idProgramaFormacion: id }, data });
  }

  async delete(id: number) {
    const fichas = await prisma.ficha.count({
      where: { idProgramaFormacion: String(id) }
    });
    if (fichas > 0) throw new Error("No se puede eliminar: hay fichas asociadas al programa");
    const cursos = await prisma.programaFormacionHasCursoCompetencia.count({
      where: { programaFormacionIdProgramaFormacion: id }
    });
    if (cursos > 0) throw new Error("No se puede eliminar: hay competencias asignadas al programa");
    await prisma.programaFormacion.delete({ where: { idProgramaFormacion: id } });
  }
}
