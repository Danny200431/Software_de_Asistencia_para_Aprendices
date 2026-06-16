import { NextResponse } from "next/server";
import { AdminInstructorFichasService } from "@/src/server/services/admin-instructor-fichas.service";
import { apiErrorMessage, parseBodyInt } from "@/src/server/lib/api-body";

export async function GET() {
  const service = new AdminInstructorFichasService();
  try {
    const data = await service.listGestion();
    return NextResponse.json({ ok: true, ...data });
  } catch {
    return NextResponse.json({ ok: false, error: "Error al listar asignaciones" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const service = new AdminInstructorFichasService();
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const fichaIdFicha = parseBodyInt(body.fichaIdFicha);
    const usuarioIdUsuario = parseBodyInt(body.usuarioIdUsuario);
    if (fichaIdFicha == null || usuarioIdUsuario == null) {
      return NextResponse.json({ ok: false, error: "Ficha e instructor son obligatorios" }, { status: 400 });
    }
    const asignacion = await service.assign(fichaIdFicha, usuarioIdUsuario);
    return NextResponse.json({ ok: true, asignacion });
  } catch (e) {
    return NextResponse.json({ ok: false, error: apiErrorMessage(e, "No se pudo asignar") }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const service = new AdminInstructorFichasService();
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const fichaIdFicha = parseBodyInt(body.fichaIdFicha);
    const usuarioIdUsuario = parseBodyInt(body.usuarioIdUsuario);
    if (fichaIdFicha == null || usuarioIdUsuario == null) {
      return NextResponse.json({ ok: false, error: "Ficha e instructor son obligatorios" }, { status: 400 });
    }
    await service.unassign(fichaIdFicha, usuarioIdUsuario);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: apiErrorMessage(e, "No se pudo desasignar") }, { status: 400 });
  }
}
