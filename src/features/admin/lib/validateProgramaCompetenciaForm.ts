import { hasFormErrors, validatePositiveSelect } from "./adminFormShared";

export type ProgramaCompetenciaFormField = "programaId" | "competenciaId";

export type ProgramaCompetenciaFormValues = {
  programaId: string;
  competenciaId: string;
};

export type ProgramaCompetenciaFormErrors = Partial<Record<ProgramaCompetenciaFormField, string>>;

export type ProgramaCompetenciaValidationContext = {
  hasProgramas: boolean;
  hasCompetencias: boolean;
};

export const PROGRAMA_COMPETENCIA_FORM_FIELDS: ProgramaCompetenciaFormField[] = [
  "programaId",
  "competenciaId"
];

export function validateProgramaCompetenciaField(
  field: ProgramaCompetenciaFormField,
  values: ProgramaCompetenciaFormValues,
  context?: ProgramaCompetenciaValidationContext
): string | null {
  switch (field) {
    case "programaId":
      return validatePositiveSelect(values.programaId, "un programa", context?.hasProgramas ?? false);
    case "competenciaId":
      return validatePositiveSelect(values.competenciaId, "una competencia", context?.hasCompetencias ?? false);
    default:
      return null;
  }
}

export function validateProgramaCompetenciaForm(
  values: ProgramaCompetenciaFormValues,
  context?: ProgramaCompetenciaValidationContext
): ProgramaCompetenciaFormErrors {
  const errors: ProgramaCompetenciaFormErrors = {};
  for (const field of PROGRAMA_COMPETENCIA_FORM_FIELDS) {
    const err = validateProgramaCompetenciaField(field, values, context);
    if (err) errors[field] = err;
  }
  return errors;
}

export { hasFormErrors as hasProgramaCompetenciaFormErrors };
