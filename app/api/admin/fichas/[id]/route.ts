import { NextResponse } from "next/server";
import { InstructorFichasCrudService } from "@/src/server/services/instructor-fichas-crud.service";
import { apiErrorMessage, str } from "@/src/server/lib/api-body";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const service = new InstructorFichasCrudService();
  const { id } = await params;
  const idNum = Number.parseInt(id, 10);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ ok: false, error: "ID invalido" }, { status: 400 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const ficha = await service.updateFicha(idNum, {
      numeroFicha: str(body.numeroFicha) ?? null,
      idProgramaFormacion: str(body.idProgramaFormacion) ?? null
    });
    return NextResponse.json({ ok: true, ficha });
  } catch (e) {
    return NextResponse.json({ ok: false, error: apiErrorMessage(e, "No se pudo actualizar") }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const service = new InstructorFichasCrudService();
  const { id } = await params;
  const idNum = Number.parseInt(id, 10);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ ok: false, error: "ID invalido" }, { status: 400 });
  }
  try {
    await service.deleteFicha(idNum);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: apiErrorMessage(e, "No se pudo eliminar") }, { status: 400 });
  }
}
