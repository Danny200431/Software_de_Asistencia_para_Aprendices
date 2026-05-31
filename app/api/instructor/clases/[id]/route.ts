import { NextResponse } from "next/server";
import {
  InstructorClasesCrudService,
  type ClaseGestionInput
} from "@/src/server/services/instructor-clases-crud.service";

type RouteContext = { params: Promise<{ id: string }> };
type ClasePatch = Partial<ClaseGestionInput>;

function parseBodyInt(value: unknown): number | null {
  if (value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export async function PUT(request: Request, ctx: RouteContext) {
  const service = new InstructorClasesCrudService();
  const { id } = await ctx.params;
  const idClase = Number.parseInt(id, 10);
  if (!Number.isFinite(idClase) || idClase < 1) {
    return NextResponse.json({ ok: false, error: "id invalido" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const patch: ClasePatch = {};

    if ("nombreTema" in body) {
      const nombreTema = typeof body.nombreTema === "string" ? body.nombreTema.trim() : "";
      if (!nombreTema) {
        return NextResponse.json(
          { ok: false, error: "El nombre o tema de la clase es obligatorio" },
          { status: 400 }
        );
      }
      patch.nombreTema = nombreTema;
    }
    if ("fecha" in body) patch.fecha = typeof body.fecha === "string" ? body.fecha : null;
    if ("horaInicio" in body) patch.horaInicio = typeof body.horaInicio === "string" ? body.horaInicio : null;

    const amb = parseBodyInt(body.ambienteIdAmbiente);
    if (amb != null) patch.ambienteIdAmbiente = amb;
    const cur = parseBodyInt(body.cursoCompetenciaIdCurso);
    if (cur != null) patch.cursoCompetenciaIdCurso = cur;
    const fic = parseBodyInt(body.fichaIdFicha);
    if (fic != null) patch.fichaIdFicha = fic;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ ok: false, error: "Sin campos para actualizar" }, { status: 400 });
    }

    const clase = await service.updateClase(idClase, patch);
    return NextResponse.json({ ok: true, clase });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo actualizar la clase" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: RouteContext) {
  const service = new InstructorClasesCrudService();
  const { id } = await ctx.params;
  const idClase = Number.parseInt(id, 10);
  if (!Number.isFinite(idClase) || idClase < 1) {
    return NextResponse.json({ ok: false, error: "id invalido" }, { status: 400 });
  }

  try {
    await service.deleteClase(idClase);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo eliminar la clase" }, { status: 500 });
  }
}
