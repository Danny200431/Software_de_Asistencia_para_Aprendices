import { NextResponse } from "next/server";
import { InstructorAprendicesCrudService } from "@/src/server/services/instructor-aprendices-crud.service";

type RouteContext = { params: Promise<{ usuarioId: string }> };

function parseBodyInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export async function PUT(request: Request, ctx: RouteContext) {
  const service = new InstructorAprendicesCrudService();
  const { usuarioId } = await ctx.params;
  const usuarioIdUsuario = Number.parseInt(usuarioId, 10);
  if (!Number.isFinite(usuarioIdUsuario) || usuarioIdUsuario < 1) {
    return NextResponse.json({ ok: false, error: "usuarioId invalido" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const fichaIdFicha = parseBodyInt(body.fichaIdFicha);
    if (fichaIdFicha == null) {
      return NextResponse.json({ ok: false, error: "fichaIdFicha es obligatorio" }, { status: 400 });
    }

    const row = await service.updateVinculoFicha(usuarioIdUsuario, fichaIdFicha);
    return NextResponse.json({ ok: true, aprendiz: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo actualizar el vinculo";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

export async function DELETE(_request: Request, ctx: RouteContext) {
  const service = new InstructorAprendicesCrudService();
  const { usuarioId } = await ctx.params;
  const usuarioIdUsuario = Number.parseInt(usuarioId, 10);
  if (!Number.isFinite(usuarioIdUsuario) || usuarioIdUsuario < 1) {
    return NextResponse.json({ ok: false, error: "usuarioId invalido" }, { status: 400 });
  }

  try {
    await service.deleteVinculo(usuarioIdUsuario);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo eliminar el vinculo" }, { status: 400 });
  }
}
