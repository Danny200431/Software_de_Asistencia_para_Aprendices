import { NextResponse } from "next/server";
import { InstructorFichasCrudService } from "@/src/server/services/instructor-fichas-crud.service";
import { apiErrorMessage, parseBodyInt, str } from "@/src/server/lib/api-body";

export async function GET() {
  const service = new InstructorFichasCrudService();
  try {
    const data = await service.listGestion();
    return NextResponse.json({ ok: true, ...data });
  } catch {
    return NextResponse.json({ ok: false, error: "Error al listar fichas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const service = new InstructorFichasCrudService();
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const usuarioIdUsuario = parseBodyInt(body.usuarioIdUsuario);
    const usuarioRolIdRol = parseBodyInt(body.usuarioRolIdRol);
    if (usuarioIdUsuario == null || usuarioRolIdRol == null) {
      return NextResponse.json(
        { ok: false, error: "usuarioIdUsuario y usuarioRolIdRol son obligatorios" },
        { status: 400 }
      );
    }
    const ficha = await service.createFicha({
      numeroFicha: str(body.numeroFicha) ?? null,
      idProgramaFormacion: str(body.idProgramaFormacion) ?? null,
      usuarioIdUsuario,
      usuarioRolIdRol
    });
    return NextResponse.json({ ok: true, ficha });
  } catch (e) {
    return NextResponse.json({ ok: false, error: apiErrorMessage(e, "No se pudo crear la ficha") }, { status: 400 });
  }
}
