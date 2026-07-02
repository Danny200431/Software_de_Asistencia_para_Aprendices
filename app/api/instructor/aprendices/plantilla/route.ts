import { NextResponse } from "next/server";
import {
  InstructorAprendicesImportError,
  InstructorAprendicesImportService
} from "@/src/server/services/instructor-aprendices-import.service";

function parsePositiveInt(value: string | null): number | null {
  if (value == null || value === "") return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return parsed;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const programaId = params.get("programaId")?.trim() ?? "";
  const fichaId = parsePositiveInt(params.get("fichaId"));

  if (!programaId || fichaId == null) {
    return NextResponse.json(
      { ok: false, error: "programaId y fichaId son obligatorios" },
      { status: 400 }
    );
  }

  try {
    const service = new InstructorAprendicesImportService();
    const context = await service.resolveImportContext(programaId, fichaId);
    const { buffer, filename } = await service.generateTemplateBuffer(context);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    if (error instanceof InstructorAprendicesImportError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { ok: false, error: "No se pudo generar la plantilla Excel." },
      { status: 500 }
    );
  }
}
