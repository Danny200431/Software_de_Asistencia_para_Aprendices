import { NextResponse } from "next/server";
import { AdminUsuariosService } from "@/src/server/services/admin-usuarios.service";
import { apiErrorMessage, parseBodyInt, str } from "@/src/server/lib/api-body";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const service = new AdminUsuariosService();
  const { id } = await params;
  const idNum = Number.parseInt(id, 10);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ ok: false, error: "ID invalido" }, { status: 400 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const rolIdRol = parseBodyInt(body.rolIdRol);
    if (rolIdRol == null) {
      return NextResponse.json({ ok: false, error: "Rol obligatorio" }, { status: 400 });
    }
    const usuario = await service.update(idNum, rolIdRol, {
      nombre: str(body.nombre),
      apellido: str(body.apellido),
      correoElectronico: str(body.correoElectronico),
      telefono: str(body.telefono),
      numeroDocumento: str(body.numeroDocumento),
      idTipoDocumento: str(body.idTipoDocumento),
      idGenero: str(body.idGenero),
      usemame: str(body.usemame),
      contrasenia: typeof body.contrasenia === "string" ? body.contrasenia : undefined
    });
    return NextResponse.json({ ok: true, usuario });
  } catch (e) {
    return NextResponse.json({ ok: false, error: apiErrorMessage(e, "No se pudo actualizar") }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const service = new AdminUsuariosService();
  const { id } = await params;
  const idNum = Number.parseInt(id, 10);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ ok: false, error: "ID invalido" }, { status: 400 });
  }
  try {
    const url = new URL(request.url);
    const rolFromQuery = parseBodyInt(url.searchParams.get("rolIdRol"));
    let rolIdRol = rolFromQuery;
    if (rolIdRol == null) {
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      rolIdRol = parseBodyInt(body.rolIdRol);
    }
    if (rolIdRol == null) {
      return NextResponse.json({ ok: false, error: "Rol obligatorio" }, { status: 400 });
    }
    await service.delete(idNum, rolIdRol);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: apiErrorMessage(e, "No se pudo eliminar") }, { status: 400 });
  }
}
