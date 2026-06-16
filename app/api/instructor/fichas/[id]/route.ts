import { NextResponse } from "next/server";
import { InstructorFichasCrudService } from "@/src/server/services/instructor-fichas-crud.service";
import { apiErrorMessage } from "@/src/server/lib/api-body";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: RouteContext) {
  const service = new InstructorFichasCrudService();
  const { id } = await ctx.params;
  const idFicha = Number.parseInt(id, 10);
  if (!Number.isFinite(idFicha) || idFicha < 1) {
    return NextResponse.json({ ok: false, error: "id invalido" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as {
      numeroFicha?: string | null;
      idProgramaFormacion?: string | null;
    };

    const ficha = await service.updateFicha(idFicha, {
      numeroFicha: body.numeroFicha ?? null,
      idProgramaFormacion:
        body.idProgramaFormacion != null && body.idProgramaFormacion.trim() !== ""
          ? body.idProgramaFormacion.trim()
          : null
    });

    return NextResponse.json({ ok: true, ficha });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo actualizar la ficha" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: RouteContext) {
  const service = new InstructorFichasCrudService();
  const { id } = await ctx.params;
  const idFicha = Number.parseInt(id, 10);
  if (!Number.isFinite(idFicha) || idFicha < 1) {
    return NextResponse.json({ ok: false, error: "id invalido" }, { status: 400 });
  }

  try {
    await service.deleteFicha(idFicha);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: apiErrorMessage(e, "No se pudo eliminar la ficha") }, { status: 400 });
  }
}
