import {
  DURACION_RE,
  hasFormErrors,
  validatePositiveSelect,
  validateRequiredText
} from "./adminFormShared";

export type CompetenciaFormField = "nombreCurso" | "nivelFormacion" | "duracion" | "instructorId";

export type CompetenciaFormValues = {
  nombreCurso: string;
  nivelFormacion: string;
  duracion: string;
  instructorId: string;
};

export type CompetenciaFormErrors = Partial<Record<CompetenciaFormField, string>>;

export type CompetenciaValidationContext = {
  hasInstructores: boolean;
};

export const COMPETENCIA_FORM_FIELDS: CompetenciaFormField[] = [
  "nombreCurso",
  "nivelFormacion",
  "duracion",
  "instructorId"
];

export function validateCompetenciaField(
  field: CompetenciaFormField,
  values: CompetenciaFormValues,
  context?: CompetenciaValidationContext
): string | null {
  switch (field) {
    case "nombreCurso":
      return validateRequiredText(values.nombreCurso, "El nombre de la competencia", { min: 3 });
    case "nivelFormacion": {
      const v = values.nivelFormacion.trim();
      if (v && v.length < 3) return "El nivel debe tener al menos 3 caracteres si se indica";
      return null;
    }
    case "duracion": {
      const req = validateRequiredText(values.duracion, "La duracion", { min: 3 });
      if (req) return req;
      return DURACION_RE.test(values.duracion.trim())
        ? null
        : "La duracion debe indicar horas (ej. 120 horas, 80 hrs)";
    }
    case "instructorId":
      return validatePositiveSelect(values.instructorId, "un instructor", context?.hasInstructores ?? false);
    default:
      return null;
  }
}

export function validateCompetenciaForm(
  values: CompetenciaFormValues,
  context?: CompetenciaValidationContext
): CompetenciaFormErrors {
  const errors: CompetenciaFormErrors = {};
  for (const field of COMPETENCIA_FORM_FIELDS) {
    const err = validateCompetenciaField(field, values, context);
    if (err) errors[field] = err;
  }
  return errors;
}

export { hasFormErrors as hasCompetenciaFormErrors };
