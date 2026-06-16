import { NextResponse } from "next/server";
import { AdminCentrosService } from "@/src/server/services/admin-centros.service";
import { apiErrorMessage, str } from "@/src/server/lib/api-body";

export async function GET() {
  const service = new AdminCentrosService();
  try {
    const centros = await service.list();
    return NextResponse.json({ ok: true, centros });
  } catch {
    return NextResponse.json({ ok: false, error: "Error al listar centros" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const service = new AdminCentrosService();
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const centro = await service.create({
      ciudad: str(body.ciudad) ?? "",
      dirreccion: str(body.dirreccion) ?? ""
    });
    return NextResponse.json({ ok: true, centro });
  } catch (e) {
    return NextResponse.json({ ok: false, error: apiErrorMessage(e, "No se pudo crear el centro") }, { status: 400 });
  }
}
