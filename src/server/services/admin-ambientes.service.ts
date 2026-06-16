import { prisma } from "@/src/server/config/db/prisma";

export type AmbienteInput = {
  nombreAmbiente?: string | null;
  ubicacion?: string | null;
  centroDeFormacionIdCentroDeFormacion: number;
};

export class AdminAmbientesService {
  async listGestion() {
    const [ambientes, centros] = await Promise.all([
      prisma.ambiente.findMany({
        orderBy: { idAmbiente: "asc" },
        include: { centroDeFormacion: { select: { ciudad: true, dirreccion: true } } }
      }),
      prisma.centroDeFormacion.findMany({
        orderBy: { ciudad: "asc" },
        select: { idCentroDeFormacion: true, ciudad: true, dirreccion: true }
      })
    ]);
    return { ambientes, centros };
  }

  private async nextId() {
    const agg = await prisma.ambiente.aggregate({ _max: { idAmbiente: true } });
    return (agg._max.idAmbiente ?? 0) + 1;
  }

  async create(input: AmbienteInput) {
    if (!Number.isFinite(input.centroDeFormacionIdCentroDeFormacion)) {
      throw new Error("Seleccione un centro de formacion");
    }
    await prisma.centroDeFormacion.findUniqueOrThrow({
      where: { idCentroDeFormacion: input.centroDeFormacionIdCentroDeFormacion }
    });
    return prisma.ambiente.create({
      data: {
        idAmbiente: await this.nextId(),
        nombreAmbiente: input.nombreAmbiente?.trim() || null,
        ubicacion: input.ubicacion?.trim() || null,
        centroDeFormacionIdCentroDeFormacion: input.centroDeFormacionIdCentroDeFormacion
      }
    });
  }

  async update(id: number, input: Partial<AmbienteInput>) {
    const data: Record<string, unknown> = {};
    if (input.nombreAmbiente !== undefined) data.nombreAmbiente = input.nombreAmbiente?.trim() || null;
    if (input.ubicacion !== undefined) data.ubicacion = input.ubicacion?.trim() || null;
    if (input.centroDeFormacionIdCentroDeFormacion !== undefined) {
      await prisma.centroDeFormacion.findUniqueOrThrow({
        where: { idCentroDeFormacion: input.centroDeFormacionIdCentroDeFormacion }
      });
      data.centroDeFormacionIdCentroDeFormacion = input.centroDeFormacionIdCentroDeFormacion;
    }
    return prisma.ambiente.update({ where: { idAmbiente: id }, data });
  }

  async delete(id: number) {
    const count = await prisma.clase.count({ where: { ambienteIdAmbiente: id } });
    if (count > 0) throw new Error("No se puede eliminar: el ambiente tiene clases asociadas");
    await prisma.ambiente.delete({ where: { idAmbiente: id } });
  }
}
