import { NextResponse } from "next/server";
import { AdminProgramasService } from "@/src/server/services/admin-programas.service";
import { apiErrorMessage, str } from "@/src/server/lib/api-body";

export async function GET() {
  const service = new AdminProgramasService();
  try {
    const data = await service.listGestion();
    return NextResponse.json({ ok: true, ...data });
  } catch {
    return NextResponse.json({ ok: false, error: "Error al listar programas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const service = new AdminProgramasService();
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const programa = await service.create({
      nombrePrograma: str(body.nombrePrograma) ?? "",
      nivelFormacion: str(body.nivelFormacion) ?? ""
    });
    return NextResponse.json({ ok: true, programa });
  } catch (e) {
    return NextResponse.json({ ok: false, error: apiErrorMessage(e, "No se pudo crear el programa") }, { status: 400 });
  }
}
