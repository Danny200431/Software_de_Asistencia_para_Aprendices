import { prisma } from "@/src/server/config/db/prisma";
import { fechaDentroDeRango } from "@/src/server/lib/weekly-dates";

export type TrimestreInput = {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function assertFechasValidas(fechaInicio: string, fechaFin: string) {
  if (!DATE_RE.test(fechaInicio) || !DATE_RE.test(fechaFin)) {
    throw new Error("Las fechas deben tener formato YYYY-MM-DD");
  }
  if (fechaInicio > fechaFin) {
    throw new Error("La fecha de inicio debe ser anterior o igual a la fecha de fin");
  }
}

export class AdminTrimestresService {
  async listGestion() {
    const trimestres = await prisma.trimestre.findMany({
      orderBy: [{ fechaInicio: "desc" }, { nombre: "asc" }]
    });

    const clases = await prisma.clase.findMany({
      where: { trimestreIdTrimestre: { not: null } },
      select: { trimestreIdTrimestre: true }
    });

    const clasesPorTrimestre = new Map<number, number>();
    for (const clase of clases) {
      if (clase.trimestreIdTrimestre == null) continue;
      const id = clase.trimestreIdTrimestre;
      clasesPorTrimestre.set(id, (clasesPorTrimestre.get(id) ?? 0) + 1);
    }

    return {
      trimestres: trimestres.map((t) => ({
        idTrimestre: t.idTrimestre,
        nombre: t.nombre,
        fechaInicio: t.fechaInicio,
        fechaFin: t.fechaFin,
        clasesCount: clasesPorTrimestre.get(t.idTrimestre) ?? 0
      }))
    };
  }

  private async nextId() {
    const agg = await prisma.trimestre.aggregate({ _max: { idTrimestre: true } });
    return (agg._max.idTrimestre ?? 0) + 1;
  }

  async create(input: TrimestreInput) {
    const nombre = input.nombre.trim();
    const fechaInicio = input.fechaInicio.trim();
    const fechaFin = input.fechaFin.trim();
    if (!nombre) throw new Error("El nombre del trimestre es obligatorio");
    assertFechasValidas(fechaInicio, fechaFin);

    return prisma.trimestre.create({
      data: {
        idTrimestre: await this.nextId(),
        nombre,
        fechaInicio,
        fechaFin
      }
    });
  }

  async update(id: number, input: Partial<TrimestreInput>) {
    const actual = await prisma.trimestre.findUnique({ where: { idTrimestre: id } });
    if (!actual) throw new Error("El trimestre no existe");

    const data: Record<string, string> = {};
    if (input.nombre !== undefined) {
      const v = input.nombre.trim();
      if (!v) throw new Error("El nombre del trimestre es obligatorio");
      data.nombre = v;
    }
    if (input.fechaInicio !== undefined) data.fechaInicio = input.fechaInicio.trim();
    if (input.fechaFin !== undefined) data.fechaFin = input.fechaFin.trim();

    const fechaInicio = data.fechaInicio ?? actual.fechaInicio;
    const fechaFin = data.fechaFin ?? actual.fechaFin;
    assertFechasValidas(fechaInicio, fechaFin);

    const clasesFuera = await prisma.clase.findMany({
      where: { trimestreIdTrimestre: id },
      select: { idClase: true, fecha: true }
    });

    for (const clase of clasesFuera) {
      if (!clase.fecha) continue;
      if (!fechaDentroDeRango(clase.fecha, fechaInicio, fechaFin)) {
        throw new Error(
          "No se puede acortar el trimestre: hay clases programadas fuera del nuevo rango de fechas"
        );
      }
    }

    return prisma.trimestre.update({ where: { idTrimestre: id }, data });
  }

  async delete(id: number) {
    const clases = await prisma.clase.count({ where: { trimestreIdTrimestre: id } });
    if (clases > 0) {
      throw new Error("No se puede eliminar: hay clases asignadas a este trimestre");
    }
    await prisma.trimestre.delete({ where: { idTrimestre: id } });
  }
}
