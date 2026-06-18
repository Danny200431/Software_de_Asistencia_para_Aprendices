import { NextResponse } from "next/server";
import { AdminTrimestresService } from "@/src/server/services/admin-trimestres.service";
import { apiErrorMessage, str } from "@/src/server/lib/api-body";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const service = new AdminTrimestresService();
  const { id } = await params;
  const idNum = Number.parseInt(id, 10);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ ok: false, error: "ID invalido" }, { status: 400 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const trimestre = await service.update(idNum, {
      nombre: str(body.nombre),
      fechaInicio: str(body.fechaInicio),
      fechaFin: str(body.fechaFin)
    });
    return NextResponse.json({ ok: true, trimestre });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: apiErrorMessage(e, "No se pudo actualizar") },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const service = new AdminTrimestresService();
  const { id } = await params;
  const idNum = Number.parseInt(id, 10);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ ok: false, error: "ID invalido" }, { status: 400 });
  }
  try {
    await service.delete(idNum);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: apiErrorMessage(e, "No se pudo eliminar") },
      { status: 400 }
    );
  }
}
