import { NextResponse } from "next/server";
import { AdminAmbientesService } from "@/src/server/services/admin-ambientes.service";
import { apiErrorMessage, parseBodyInt, str } from "@/src/server/lib/api-body";

export async function GET() {
  const service = new AdminAmbientesService();
  try {
    const data = await service.listGestion();
    return NextResponse.json({ ok: true, ...data });
  } catch {
    return NextResponse.json({ ok: false, error: "Error al listar ambientes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const service = new AdminAmbientesService();
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const centroId = parseBodyInt(body.centroDeFormacionIdCentroDeFormacion);
    if (centroId == null) {
      return NextResponse.json({ ok: false, error: "Centro de formacion obligatorio" }, { status: 400 });
    }
    const ambiente = await service.create({
      nombreAmbiente: str(body.nombreAmbiente) ?? null,
      ubicacion: str(body.ubicacion) ?? null,
      centroDeFormacionIdCentroDeFormacion: centroId
    });
    return NextResponse.json({ ok: true, ambiente });
  } catch (e) {
    return NextResponse.json({ ok: false, error: apiErrorMessage(e, "No se pudo crear el ambiente") }, { status: 400 });
  }
}
