import { signAuthToken } from "@/src/server/config/auth/jwt";
import { findUserByUsername } from "@/src/server/repositories/auth.repository";

export async function loginService(usemame: string, contrasenia: string) {
  const user = await findUserByUsername(usemame);

  if (!user) {
    return { ok: false as const, status: 401, error: "Usuario no encontrado" };
  }

  if (user.contrasenia !== contrasenia) {
    return { ok: false as const, status: 401, error: "Contrasenia incorrecta" };
  }

  const token = signAuthToken({
    id: user.idUsuario,
    usemame: user.usemame,
    nombre: user.nombre,
    apellido: user.apellido,
    rol: user.rol.nombreRol.toLowerCase(),
    correo_electronico: user.correoElectronico
  });

  return {
    ok: true as const,
    status: 200,
    data: {
      token,
      user: {
        id: user.idUsuario,
        nombre: user.nombre,
        apellido: user.apellido,
        usemame: user.usemame,
        rol: user.rol.nombreRol,
        correo_electronico: user.correoElectronico
      }
    }
  };
}
