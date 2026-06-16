import { NextResponse } from "next/server";
import { AdminAmbientesService } from "@/src/server/services/admin-ambientes.service";
import { apiErrorMessage, parseBodyInt, str } from "@/src/server/lib/api-body";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const service = new AdminAmbientesService();
  const { id } = await params;
  const idNum = Number.parseInt(id, 10);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ ok: false, error: "ID invalido" }, { status: 400 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const centroId = parseBodyInt(body.centroDeFormacionIdCentroDeFormacion);
    const ambiente = await service.update(idNum, {
      nombreAmbiente: body.nombreAmbiente !== undefined ? (str(body.nombreAmbiente) ?? null) : undefined,
      ubicacion: body.ubicacion !== undefined ? (str(body.ubicacion) ?? null) : undefined,
      centroDeFormacionIdCentroDeFormacion: centroId ?? undefined
    });
    return NextResponse.json({ ok: true, ambiente });
  } catch (e) {
    return NextResponse.json({ ok: false, error: apiErrorMessage(e, "No se pudo actualizar") }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const service = new AdminAmbientesService();
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
