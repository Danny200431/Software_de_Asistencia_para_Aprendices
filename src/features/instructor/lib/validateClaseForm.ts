export type ClaseFormField =
  | "nombreTema"
  | "fecha"
  | "horaInicio"
  | "ambienteId"
  | "cursoId"
  | "fichaId";

export type ClaseFormValues = {
  nombreTema: string;
  fecha: string;
  horaInicio: string;
  ambienteId: string;
  cursoId: string;
  fichaId: string;
  editingId: number | null;
};

export type ClaseFormErrors = Partial<Record<ClaseFormField, string>>;

export type ClaseCompetenciaOpt = { idCurso: number; nombreCurso: string };

export type ClaseValidationContext = {
  competenciasPorFicha: (fichaId: string) => ClaseCompetenciaOpt[];
  hasAmbientes: boolean;
  hasFichas: boolean;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

function parsePositiveInt(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export const CLASE_FORM_FIELDS: ClaseFormField[] = [
  "nombreTema",
  "fecha",
  "horaInicio",
  "ambienteId",
  "fichaId",
  "cursoId"
];

export function validateClaseField(
  field: ClaseFormField,
  values: ClaseFormValues,
  context?: ClaseValidationContext
): string | null {
  switch (field) {
    case "nombreTema": {
      const v = values.nombreTema.trim();
      if (!v) return "El nombre o tema de la clase es obligatorio";
      if (v.length < 3) return "El nombre o tema debe tener al menos 3 caracteres";
      if (v.length > 120) return "El nombre o tema no puede superar 120 caracteres";
      return null;
    }
    case "fecha": {
      const v = values.fecha.trim();
      if (!v) return "La fecha es obligatoria";
      if (!DATE_RE.test(v)) return "Ingrese una fecha valida";
      return null;
    }
    case "horaInicio": {
      const v = values.horaInicio.trim();
      if (!v) return "La hora de inicio es obligatoria";
      if (!TIME_RE.test(v)) return "Ingrese una hora valida";
      return null;
    }
    case "ambienteId": {
      if (!context?.hasAmbientes) return "No hay ambientes disponibles para seleccionar";
      if (!values.ambienteId.trim()) return "Seleccione un ambiente";
      if (parsePositiveInt(values.ambienteId) == null) return "Seleccione un ambiente valido";
      return null;
    }
    case "fichaId": {
      if (!context?.hasFichas) return "No hay fichas disponibles para seleccionar";
      if (!values.fichaId.trim()) return "Seleccione una ficha";
      if (parsePositiveInt(values.fichaId) == null) return "Seleccione una ficha valida";
      return null;
    }
    case "cursoId": {
      if (!values.fichaId.trim()) return "Seleccione primero una ficha";
      const competencias = context?.competenciasPorFicha(values.fichaId) ?? [];
      if (competencias.length === 0) {
        return "La ficha seleccionada no tiene competencias asociadas";
      }
      if (!values.cursoId.trim()) return "Seleccione una competencia";
      const cursoId = parsePositiveInt(values.cursoId);
      if (cursoId == null) return "Seleccione una competencia valida";
      if (!competencias.some((c) => c.idCurso === cursoId)) {
        return "La competencia debe corresponder al programa de la ficha seleccionada";
      }
      return null;
    }
    default:
      return null;
  }
}

export function validateClaseForm(
  values: ClaseFormValues,
  context?: ClaseValidationContext
): ClaseFormErrors {
  const errors: ClaseFormErrors = {};
  for (const field of CLASE_FORM_FIELDS) {
    const err = validateClaseField(field, values, context);
    if (err) errors[field] = err;
  }
  return errors;
}

export function hasClaseFormErrors(errors: ClaseFormErrors): boolean {
  return Object.keys(errors).length > 0;
}
