import { NextResponse } from "next/server";
import { AdminProgramaCompetenciasService } from "@/src/server/services/admin-programa-competencias.service";
import { apiErrorMessage, parseBodyInt } from "@/src/server/lib/api-body";

export async function GET() {
  const service = new AdminProgramaCompetenciasService();
  try {
    const data = await service.listGestion();
    return NextResponse.json({ ok: true, ...data });
  } catch {
    return NextResponse.json({ ok: false, error: "Error al listar asignaciones" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const service = new AdminProgramaCompetenciasService();
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const programaId = parseBodyInt(body.programaFormacionIdProgramaFormacion);
    const cursoId = parseBodyInt(body.cursoCompetenciaIdCurso);
    if (programaId == null || cursoId == null) {
      return NextResponse.json({ ok: false, error: "Programa y competencia son obligatorios" }, { status: 400 });
    }
    const asignacion = await service.assign(programaId, cursoId);
    return NextResponse.json({ ok: true, asignacion });
  } catch (e) {
    return NextResponse.json({ ok: false, error: apiErrorMessage(e, "No se pudo asignar") }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const service = new AdminProgramaCompetenciasService();
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const cursoId = parseBodyInt(body.cursoCompetenciaIdCurso);
    if (cursoId == null) {
      return NextResponse.json({ ok: false, error: "Competencia obligatoria" }, { status: 400 });
    }
    await service.unassign(cursoId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: apiErrorMessage(e, "No se pudo desasignar") }, { status: 400 });
  }
}
