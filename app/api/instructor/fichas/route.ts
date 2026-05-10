import { NextResponse } from "next/server";
import { InstructorFichasCrudService } from "@/src/server/services/instructor-fichas-crud.service";

function parseBodyInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

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

    const numeroFicha = typeof body.numeroFicha === "string" ? body.numeroFicha : null;
    const idProgramaFormacion =
      typeof body.idProgramaFormacion === "string" && body.idProgramaFormacion.trim() !== ""
        ? body.idProgramaFormacion.trim()
        : null;

    const ficha = await service.createFicha({
      numeroFicha: numeroFicha || null,
      idProgramaFormacion,
      usuarioIdUsuario,
      usuarioRolIdRol
    });

    return NextResponse.json({ ok: true, ficha });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo crear la ficha" }, { status: 500 });
  }
}
