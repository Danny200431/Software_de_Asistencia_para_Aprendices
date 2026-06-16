import { NextResponse } from "next/server";
import { AdminCompetenciasService } from "@/src/server/services/admin-competencias.service";
import { apiErrorMessage, str } from "@/src/server/lib/api-body";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const service = new AdminCompetenciasService();
  const { id } = await params;
  const idNum = Number.parseInt(id, 10);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ ok: false, error: "ID invalido" }, { status: 400 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const competencia = await service.update(idNum, {
      nombreCurso: str(body.nombreCurso),
      nivelFormacion: body.nivelFormacion !== undefined ? (str(body.nivelFormacion) ?? null) : undefined,
      duracion: str(body.duracion),
      idUsuario: str(body.idUsuario)
    });
    return NextResponse.json({ ok: true, competencia });
  } catch (e) {
    return NextResponse.json({ ok: false, error: apiErrorMessage(e, "No se pudo actualizar") }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const service = new AdminCompetenciasService();
  const { id } = await params;
  const idNum = Number.parseInt(id, 10);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ ok: false, error: "ID invalido" }, { status: 400 });
  }
  try {
    await service.delete(idNum);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: apiErrorMessage(e, "No se pudo eliminar") }, { status: 400 });
  }
}
