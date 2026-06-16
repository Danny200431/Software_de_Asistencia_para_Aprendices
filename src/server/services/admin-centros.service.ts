import { prisma } from "@/src/server/config/db/prisma";

export type CentroInput = {
  ciudad: string;
  dirreccion: string;
};

export class AdminCentrosService {
  async list() {
    return prisma.centroDeFormacion.findMany({ orderBy: { idCentroDeFormacion: "asc" } });
  }

  private async nextId() {
    const agg = await prisma.centroDeFormacion.aggregate({ _max: { idCentroDeFormacion: true } });
    return (agg._max.idCentroDeFormacion ?? 0) + 1;
  }

  async create(input: CentroInput) {
    const ciudad = input.ciudad.trim();
    const dirreccion = input.dirreccion.trim();
    if (!ciudad || !dirreccion) throw new Error("Ciudad y direccion son obligatorias");
    return prisma.centroDeFormacion.create({
      data: { idCentroDeFormacion: await this.nextId(), ciudad, dirreccion }
    });
  }

  async update(id: number, input: Partial<CentroInput>) {
    const data: Record<string, string> = {};
    if (input.ciudad !== undefined) {
      const v = input.ciudad.trim();
      if (!v) throw new Error("La ciudad no puede estar vacia");
      data.ciudad = v;
    }
    if (input.dirreccion !== undefined) {
      const v = input.dirreccion.trim();
      if (!v) throw new Error("La direccion no puede estar vacia");
      data.dirreccion = v;
    }
    return prisma.centroDeFormacion.update({ where: { idCentroDeFormacion: id }, data });
  }

  async delete(id: number) {
    const count = await prisma.ambiente.count({ where: { centroDeFormacionIdCentroDeFormacion: id } });
    if (count > 0) throw new Error("No se puede eliminar: el centro tiene ambientes asociados");
    await prisma.centroDeFormacion.delete({ where: { idCentroDeFormacion: id } });
  }
}
