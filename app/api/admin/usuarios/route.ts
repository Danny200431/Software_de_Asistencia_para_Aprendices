import { NextResponse } from "next/server";
import { AdminUsuariosService } from "@/src/server/services/admin-usuarios.service";
import { apiErrorMessage, parseBodyInt, str } from "@/src/server/lib/api-body";

export async function GET() {
  const service = new AdminUsuariosService();
  try {
    const data = await service.listGestion();
    return NextResponse.json({ ok: true, ...data });
  } catch {
    return NextResponse.json({ ok: false, error: "Error al listar usuarios" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const service = new AdminUsuariosService();
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const rolIdRol = parseBodyInt(body.rolIdRol);
    if (rolIdRol == null) {
      return NextResponse.json({ ok: false, error: "Rol obligatorio" }, { status: 400 });
    }
    const usuario = await service.create({
      nombre: str(body.nombre) ?? "",
      apellido: str(body.apellido) ?? "",
      correoElectronico: str(body.correoElectronico) ?? "",
      telefono: str(body.telefono) ?? "",
      numeroDocumento: str(body.numeroDocumento) ?? "",
      idTipoDocumento: str(body.idTipoDocumento) ?? "CC",
      idGenero: str(body.idGenero) ?? "M",
      usemame: str(body.usemame) ?? "",
      contrasenia: typeof body.contrasenia === "string" ? body.contrasenia : "",
      rolIdRol,
      tipoDocumentoIdTipoDocumento: parseBodyInt(body.tipoDocumentoIdTipoDocumento) ?? undefined
    });
    return NextResponse.json({ ok: true, usuario });
  } catch (e) {
    return NextResponse.json({ ok: false, error: apiErrorMessage(e, "No se pudo crear el usuario") }, { status: 400 });
  }
}
