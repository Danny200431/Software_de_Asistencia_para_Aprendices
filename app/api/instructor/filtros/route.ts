import { NextResponse } from "next/server";
import { InstructorFiltrosService } from "@/src/server/services/instructor-filtros.service";
import { getBearerUser } from "@/src/server/lib/auth-request";

function parsePositiveInt(value: string | null): number | null {
  if (value == null || value === "") return null;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

const FORBIDDEN = NextResponse.json(
  { ok: false, error: "No tiene acceso a esta ficha." },
  { status: 403 }
);

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
    return NextResponse.json(
      { ok: false, error: "No autorizado." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo");
  const service = new InstructorFiltrosService();

  try {
    if (tipo === "programas") {
      const programas = isAdmin
        ? await service.listProgramas()
        : await service.listProgramasDeInstructor(user.id);
      return NextResponse.json({ ok: true, programas });
    }

    if (tipo === "competencias") {
      const programaId = parsePositiveInt(searchParams.get("programaId"));
      if (programaId == null) {
        return NextResponse.json(
          { ok: false, error: "programaId requerido" },
          { status: 400 }
        );
      }
      const competencias = await service.listCompetenciasPorPrograma(programaId);
      return NextResponse.json({ ok: true, competencias });
    }

    if (tipo === "fichas") {
      const programaId = parsePositiveInt(searchParams.get("programaId"));
      if (programaId == null) {
        return NextResponse.json(
          { ok: false, error: "programaId requerido" },
          { status: 400 }
        );
      }
      const fichas = isAdmin
        ? await service.listFichasPorPrograma(programaId)
        : await service.listFichasPorProgramaDeInstructor(user.id, programaId);
      return NextResponse.json({ ok: true, fichas });
    }

    if (tipo === "clases") {
      const fichaId = parsePositiveInt(searchParams.get("fichaId"));
      const competenciaId = parsePositiveInt(searchParams.get("competenciaId"));
      if (fichaId == null || competenciaId == null) {
        return NextResponse.json(
          { ok: false, error: "fichaId y competenciaId requeridos" },
          { status: 400 }
        );
      }
      if (isInstructor && !(await service.instructorTieneAccesoFicha(user.id, fichaId))) {
        return FORBIDDEN;
      }
      const clases = await service.listClasesPorFichaYCompetencia(fichaId, competenciaId);
      return NextResponse.json({ ok: true, clases });
    }

    if (tipo === "horario") {
      const fichaId = parsePositiveInt(searchParams.get("fichaId"));
      if (fichaId == null) {
        return NextResponse.json(
          { ok: false, error: "fichaId requerido" },
          { status: 400 }
        );
      }
      if (isInstructor && !(await service.instructorTieneAccesoFicha(user.id, fichaId))) {
        return FORBIDDEN;
      }
      const horario = await service.listHorarioPorFicha(fichaId);
      return NextResponse.json({ ok: true, horario });
    }

    if (tipo === "asistencias") {
      const claseId = parsePositiveInt(searchParams.get("claseId"));
      if (claseId == null) {
        return NextResponse.json(
          { ok: false, error: "claseId requerido" },
          { status: 400 }
        );
      }
      if (isInstructor && !(await service.instructorTieneAccesoClase(user.id, claseId))) {
        return FORBIDDEN;
      }
      const asistencias = await service.listAsistenciasPorClase(claseId);
      return NextResponse.json({ ok: true, asistencias });
    }

    return NextResponse.json(
      {
        ok: false,
        error: "tipo invalido (programas|competencias|fichas|clases|horario|asistencias)"
      },
      { status: 400 }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Error al cargar datos" }, { status: 500 });
  }
}
