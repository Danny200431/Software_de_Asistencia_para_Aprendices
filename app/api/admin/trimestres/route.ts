import { NextResponse } from "next/server";
import { AdminTrimestresService } from "@/src/server/services/admin-trimestres.service";
import { apiErrorMessage, str } from "@/src/server/lib/api-body";

export async function GET() {
  const service = new AdminTrimestresService();
  try {
    const data = await service.listGestion();
    return NextResponse.json({ ok: true, ...data });
  } catch {
    return NextResponse.json({ ok: false, error: "Error al listar trimestres" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const service = new AdminTrimestresService();
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const trimestre = await service.create({
      nombre: str(body.nombre) ?? "",
      fechaInicio: str(body.fechaInicio) ?? "",
      fechaFin: str(body.fechaFin) ?? ""
    });
    return NextResponse.json({ ok: true, trimestre });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: apiErrorMessage(e, "No se pudo crear el trimestre") },
      { status: 400 }
    );
  }
}
