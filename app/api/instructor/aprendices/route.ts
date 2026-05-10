import { NextResponse } from "next/server";
import { InstructorAprendicesCrudService } from "@/src/server/services/instructor-aprendices-crud.service";

function parseBodyInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export async function GET() {
  const service = new InstructorAprendicesCrudService();
  try {
    const data = await service.listGestion();
    return NextResponse.json({ ok: true, ...data });
  } catch {
    return NextResponse.json({ ok: false, error: "Error al listar aprendices" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const service = new InstructorAprendicesCrudService();
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const usuarioIdUsuario = parseBodyInt(body.usuarioIdUsuario);
    const fichaIdFicha = parseBodyInt(body.fichaIdFicha);

    if (usuarioIdUsuario == null || fichaIdFicha == null) {
      return NextResponse.json(
        { ok: false, error: "usuarioIdUsuario y fichaIdFicha son obligatorios" },
        { status: 400 }
      );
    }

    const row = await service.createVinculo(usuarioIdUsuario, fichaIdFicha);
    return NextResponse.json({ ok: true, aprendiz: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo crear el vinculo";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
