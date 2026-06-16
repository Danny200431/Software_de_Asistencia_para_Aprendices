import { prisma } from "@/src/server/config/db/prisma";

export class AdminInstructorFichasService {
  async listGestion() {
    const [asignaciones, instructores, fichas] = await Promise.all([
      prisma.instructorFicha.findMany({
        include: {
          instructor: {
            include: { usuario: { select: { idUsuario: true, nombre: true, apellido: true } } }
          },
          ficha: {
            select: { idFicha: true, numeroFicha: true, idProgramaFormacion: true }
          }
        },
        orderBy: { fichaIdFicha: "asc" }
      }),
      prisma.instructor.findMany({
        include: { usuario: { select: { idUsuario: true, nombre: true, apellido: true } } },
        orderBy: { usuarioIdUsuario: "asc" }
      }),
      prisma.ficha.findMany({
        orderBy: { idFicha: "asc" },
        select: { idFicha: true, numeroFicha: true, idProgramaFormacion: true }
      })
    ]);

    const programas = await prisma.programaFormacion.findMany({
      select: { idProgramaFormacion: true, nombrePrograma: true }
    });
    const programaNombre = new Map(programas.map((p) => [String(p.idProgramaFormacion), p.nombrePrograma]));

    const enrichFicha = (f: { idFicha: number; numeroFicha: string | null; idProgramaFormacion: string | null }) => ({
      ...f,
      programaNombre:
        f.idProgramaFormacion != null
          ? programaNombre.get(f.idProgramaFormacion) ?? null
          : null
    });

    return {
      asignaciones: asignaciones.map((a) => ({ ...a, ficha: enrichFicha(a.ficha) })),
      instructores,
      fichas: fichas.map(enrichFicha)
    };
  }

  async assign(fichaIdFicha: number, usuarioIdUsuario: number) {
    await prisma.ficha.findUniqueOrThrow({ where: { idFicha: fichaIdFicha } });
    await prisma.instructor.findUniqueOrThrow({ where: { usuarioIdUsuario } });
    return prisma.instructorFicha.upsert({
      where: {
        fichaIdFicha_usuarioIdUsuario: { fichaIdFicha, usuarioIdUsuario }
      },
      update: {},
      create: { fichaIdFicha, usuarioIdUsuario }
    });
  }

  async unassign(fichaIdFicha: number, usuarioIdUsuario: number) {
    await prisma.instructorFicha.delete({
      where: { fichaIdFicha_usuarioIdUsuario: { fichaIdFicha, usuarioIdUsuario } }
    });
  }
}
