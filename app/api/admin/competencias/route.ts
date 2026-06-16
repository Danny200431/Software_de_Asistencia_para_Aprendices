import { NextResponse } from "next/server";
import { AdminCompetenciasService } from "@/src/server/services/admin-competencias.service";
import { apiErrorMessage, str } from "@/src/server/lib/api-body";

export async function GET() {
  const service = new AdminCompetenciasService();
  try {
    const data = await service.listGestion();
    return NextResponse.json({ ok: true, ...data });
  } catch {
    return NextResponse.json({ ok: false, error: "Error al listar competencias" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const service = new AdminCompetenciasService();
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const competencia = await service.create({
      nombreCurso: str(body.nombreCurso) ?? "",
      nivelFormacion: str(body.nivelFormacion) ?? null,
      duracion: str(body.duracion) ?? "",
      idUsuario: str(body.idUsuario) ?? ""
    });
    return NextResponse.json({ ok: true, competencia });
  } catch (e) {
    return NextResponse.json({ ok: false, error: apiErrorMessage(e, "No se pudo crear la competencia") }, { status: 400 });
  }
}
