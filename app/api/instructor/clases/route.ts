import { NextResponse } from "next/server";
import {
  InstructorClasesCrudError,
  InstructorClasesCrudService
} from "@/src/server/services/instructor-clases-crud.service";

function parseBodyInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export async function GET() {
  const service = new InstructorClasesCrudService();
  try {
    const data = await service.listGestion();
    return NextResponse.json({ ok: true, ...data });
  } catch {
    return NextResponse.json({ ok: false, error: "Error al listar clases" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const service = new InstructorClasesCrudService();
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const ambienteIdAmbiente = parseBodyInt(body.ambienteIdAmbiente);
    const cursoCompetenciaIdCurso = parseBodyInt(body.cursoCompetenciaIdCurso);
    const fichaIdFicha = parseBodyInt(body.fichaIdFicha);
    const trimestreIdTrimestre = parseBodyInt(body.trimestreIdTrimestre);

    if (
      ambienteIdAmbiente == null ||
      cursoCompetenciaIdCurso == null ||
      fichaIdFicha == null ||
      trimestreIdTrimestre == null
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "ambienteIdAmbiente, cursoCompetenciaIdCurso, fichaIdFicha y trimestreIdTrimestre son obligatorios"
        },
        { status: 400 }
      );
    }

    const nombreTema = typeof body.nombreTema === "string" ? body.nombreTema.trim() : "";
    if (!nombreTema) {
      return NextResponse.json(
        { ok: false, error: "El nombre o tema de la clase es obligatorio" },
        { status: 400 }
      );
    }

    const fecha = typeof body.fecha === "string" ? body.fecha : null;
    const horaInicio = typeof body.horaInicio === "string" ? body.horaInicio : null;
    const repetirSemanal = body.repetirSemanal === true;
    const diaSemana = repetirSemanal ? parseBodyInt(body.diaSemana) : null;

    const result = await service.createClase({
      nombreTema,
      fecha: fecha || null,
      horaInicio: horaInicio || null,
      ambienteIdAmbiente,
      cursoCompetenciaIdCurso,
      fichaIdFicha,
      trimestreIdTrimestre,
      repetirSemanal,
      diaSemana
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof InstructorClasesCrudError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json({ ok: false, error: "No se pudo crear la clase" }, { status: 500 });
  }
}
