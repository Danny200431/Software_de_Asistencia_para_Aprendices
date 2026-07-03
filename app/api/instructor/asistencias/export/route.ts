import { NextResponse } from "next/server";
import {
  InstructorAsistenciaExportError,
  InstructorAsistenciaExportService
} from "@/src/server/services/instructor-asistencia-export.service";
import { InstructorFiltrosService } from "@/src/server/services/instructor-filtros.service";
import { getBearerUser } from "@/src/server/lib/auth-request";

function parsePositiveInt(value: string | null): number | null {
  if (value == null || value === "") return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return parsed;
}

export async function GET(request: Request) {
  const user = getBearerUser(request);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Token requerido o invalido." },
      { status: 401 }
    );
  }

  const rol = user.rol?.toLowerCase();
  const isAdmin = rol === "administrador";
  const isInstructor = rol === "instructor";

  if (!isAdmin && !isInstructor) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }

  const claseId = parsePositiveInt(new URL(request.url).searchParams.get("claseId"));

  if (claseId == null) {
    return NextResponse.json({ ok: false, error: "claseId requerido" }, { status: 400 });
  }

  if (isInstructor) {
    const filtros = new InstructorFiltrosService();
    if (!(await filtros.instructorTieneAccesoClase(user.id, claseId))) {
      return NextResponse.json(
        { ok: false, error: "No tiene acceso a esta ficha." },
        { status: 403 }
      );
    }
  }

  try {
    const service = new InstructorAsistenciaExportService();
    const { buffer, filename } = await service.generateExcelBuffer(claseId);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    if (error instanceof InstructorAsistenciaExportError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { ok: false, error: "No se pudo generar el archivo Excel." },
      { status: 500 }
    );
  }
}
