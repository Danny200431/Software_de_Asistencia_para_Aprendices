import { NextResponse } from "next/server";
import {
  InstructorAprendicesImportError,
  InstructorAprendicesImportService
} from "@/src/server/services/instructor-aprendices-import.service";

function parsePositiveInt(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return parsed;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const programaId = typeof formData.get("programaId") === "string" ? formData.get("programaId") : "";
    const fichaId = parsePositiveInt(formData.get("fichaId"));

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Seleccione un archivo Excel" }, { status: 400 });
    }

    if (!programaId || typeof programaId !== "string" || programaId.trim() === "") {
      return NextResponse.json(
        { ok: false, error: "Seleccione un programa de formacion" },
        { status: 400 }
      );
    }

    if (fichaId == null) {
      return NextResponse.json({ ok: false, error: "Seleccione una ficha valida" }, { status: 400 });
    }

    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel"
    ];
    const fileName = file.name.toLowerCase();
    const hasExcelExtension = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
    if (!hasExcelExtension && file.type !== "" && !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: "El archivo debe ser un Excel (.xlsx)" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const service = new InstructorAprendicesImportService();
    const context = await service.resolveImportContext(programaId.trim(), fichaId);
    const result = await service.importFromBuffer(arrayBuffer, context);

    return NextResponse.json({
      ok: true,
      ...result,
      totalFilas: result.creados + result.omitidos + result.errores.length
    });
  } catch (error) {
    if (error instanceof InstructorAprendicesImportError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { ok: false, error: "No se pudo procesar el archivo Excel." },
      { status: 500 }
    );
  }
}
