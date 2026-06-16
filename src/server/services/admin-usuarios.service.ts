import { hash } from "bcryptjs";
import { prisma } from "@/src/server/config/db/prisma";
import { validatePassword } from "@/src/lib/validatePassword";

const BCRYPT_ROUNDS = 12;
const DEFAULT_TIPO_DOC_ID = 1;

export type UsuarioCreateInput = {
  nombre: string;
  apellido: string;
  correoElectronico: string;
  telefono: string;
  numeroDocumento: string;
  idTipoDocumento: string;
  idGenero: string;
  usemame: string;
  contrasenia: string;
  rolIdRol: number;
  tipoDocumentoIdTipoDocumento?: number;
};

export type UsuarioUpdateInput = {
  nombre?: string;
  apellido?: string;
  correoElectronico?: string;
  telefono?: string;
  numeroDocumento?: string;
  idTipoDocumento?: string;
  idGenero?: string;
  usemame?: string;
  contrasenia?: string | null;
};

export class AdminUsuariosService {
  async listGestion() {
    const [usuarios, roles] = await Promise.all([
      prisma.usuario.findMany({
        orderBy: [{ rolIdRol: "asc" }, { nombre: "asc" }],
        include: {
          rol: { select: { nombreRol: true } },
          aprendiz: { select: { fichaIdFicha: true } },
          instructor: { select: { usuarioIdUsuario: true } }
        }
      }),
      prisma.rol.findMany({ orderBy: { idRol: "asc" } })
    ]);
    return { usuarios, roles };
  }

  private async nextUsuarioId() {
    const agg = await prisma.usuario.aggregate({ _max: { idUsuario: true } });
    return (agg._max.idUsuario ?? 0) + 1;
  }

  private async assertUsemameLibre(usemame: string, exceptId?: number) {
    const u = await prisma.usuario.findFirst({ where: { usemame }, select: { idUsuario: true } });
    if (u && u.idUsuario !== exceptId) throw new Error("El nombre de usuario ya esta en uso");
  }

  async create(input: UsuarioCreateInput) {
    const nombre = input.nombre.trim();
    const apellido = input.apellido.trim();
    const correoElectronico = input.correoElectronico.trim();
    const telefono = input.telefono.trim();
    const numeroDocumento = input.numeroDocumento.trim();
    const usemame = input.usemame.trim();
    const contrasenia = input.contrasenia ?? "";

    if (!nombre || !apellido || !correoElectronico || !telefono || !numeroDocumento || !usemame) {
      throw new Error("Complete todos los campos obligatorios");
    }
    const passwordError = validatePassword(contrasenia);
    if (passwordError) throw new Error(passwordError);

    await prisma.rol.findUniqueOrThrow({ where: { idRol: input.rolIdRol } });
    await this.assertUsemameLibre(usemame);

    const tipoDocId = input.tipoDocumentoIdTipoDocumento ?? DEFAULT_TIPO_DOC_ID;
    const idUsuario = await this.nextUsuarioId();
    const hashed = await hash(contrasenia, BCRYPT_ROUNDS);

    return prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          idUsuario,
          nombre,
          apellido,
          correoElectronico,
          telefono,
          numeroDocumento,
          idTipoDocumento: input.idTipoDocumento.trim() || "CC",
          idGenero: input.idGenero.trim() || "M",
          usemame,
          contrasenia: hashed,
          rolIdRol: input.rolIdRol,
          tipoDocumentoIdTipoDocumento: tipoDocId
        },
        include: { rol: { select: { nombreRol: true } } }
      });

      if (input.rolIdRol === 2) {
        await tx.instructor.create({ data: { usuarioIdUsuario: idUsuario } });
      }

      return usuario;
    });
  }

  async update(idUsuario: number, rolIdRol: number, input: UsuarioUpdateInput) {
    await prisma.usuario.findUniqueOrThrow({
      where: { idUsuario_rolIdRol: { idUsuario, rolIdRol } }
    });

    if (input.usemame !== undefined) await this.assertUsemameLibre(input.usemame.trim(), idUsuario);

    const data: Record<string, unknown> = {};
    if (input.nombre !== undefined) data.nombre = input.nombre.trim();
    if (input.apellido !== undefined) data.apellido = input.apellido.trim();
    if (input.correoElectronico !== undefined) data.correoElectronico = input.correoElectronico.trim();
    if (input.telefono !== undefined) data.telefono = input.telefono.trim();
    if (input.numeroDocumento !== undefined) data.numeroDocumento = input.numeroDocumento.trim();
    if (input.idTipoDocumento !== undefined) data.idTipoDocumento = input.idTipoDocumento.trim();
    if (input.idGenero !== undefined) data.idGenero = input.idGenero.trim();
    if (input.usemame !== undefined) data.usemame = input.usemame.trim();

    if (input.contrasenia != null && input.contrasenia.trim() !== "") {
      const passwordError = validatePassword(input.contrasenia);
      if (passwordError) throw new Error(passwordError);
      data.contrasenia = await hash(input.contrasenia, BCRYPT_ROUNDS);
    }

    return prisma.usuario.update({
      where: { idUsuario_rolIdRol: { idUsuario, rolIdRol } },
      data,
      include: { rol: { select: { nombreRol: true } } }
    });
  }

  async delete(idUsuario: number, rolIdRol: number) {
    const usuario = await prisma.usuario.findUnique({
      where: { idUsuario_rolIdRol: { idUsuario, rolIdRol } },
      include: { aprendiz: true, instructor: true }
    });
    if (!usuario) throw new Error("Usuario no encontrado");

    if (rolIdRol === 1 && usuario.aprendiz) {
      throw new Error("No se puede eliminar un aprendiz con ficha asignada. Use el modulo de aprendices.");
    }

    await prisma.$transaction(async (tx) => {
      if (rolIdRol === 2) {
        await tx.instructorFicha.deleteMany({ where: { usuarioIdUsuario: idUsuario } }).catch(() => {});
        await tx.instructor.deleteMany({ where: { usuarioIdUsuario: idUsuario } });
      }
      await tx.programaFormacion.deleteMany({
        where: { usuarioIdAprendiz: idUsuario, usuarioRolIdRol: rolIdRol }
      }).catch(() => {});
      await tx.usuario.delete({ where: { idUsuario_rolIdRol: { idUsuario, rolIdRol } } });
    });
  }
}
