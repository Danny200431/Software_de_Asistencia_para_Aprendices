import { prisma } from "@/src/server/config/db/prisma";

export type ProgramaInput = {
  nombrePrograma: string;
  nivelFormacion: string;
};

export class AdminProgramasService {
  async listGestion() {
    const programas = await prisma.programaFormacion.findMany({
      orderBy: { nombrePrograma: "asc" }
    });

    const fichas = await prisma.ficha.findMany({
      select: { idProgramaFormacion: true }
    });

    const fichasPorPrograma = new Map<string, number>();
    for (const f of fichas) {
      if (f.idProgramaFormacion == null || f.idProgramaFormacion === "") continue;
      const key = f.idProgramaFormacion;
      fichasPorPrograma.set(key, (fichasPorPrograma.get(key) ?? 0) + 1);
    }

    return {
      programas: programas.map((p) => ({
        idProgramaFormacion: p.idProgramaFormacion,
        nombrePrograma: p.nombrePrograma,
        nivelFormacion: p.nivelFormacion,
        fichasCount: fichasPorPrograma.get(String(p.idProgramaFormacion)) ?? 0
      }))
    };
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
    return prisma.programaFormacion.create({
      data: {
        idProgramaFormacion: await this.nextId(),
        nombrePrograma,
        nivelFormacion
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
