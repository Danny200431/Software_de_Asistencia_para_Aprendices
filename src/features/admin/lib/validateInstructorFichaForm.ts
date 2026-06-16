import { hasFormErrors, validatePositiveSelect } from "./adminFormShared";

export type InstructorFichaFormField = "fichaId" | "instructorId";

export type InstructorFichaFormValues = {
  fichaId: string;
  instructorId: string;
};

export type InstructorFichaFormErrors = Partial<Record<InstructorFichaFormField, string>>;

export type InstructorFichaValidationContext = {
  hasFichas: boolean;
  hasInstructores: boolean;
};

export const INSTRUCTOR_FICHA_FORM_FIELDS: InstructorFichaFormField[] = ["fichaId", "instructorId"];

export function validateInstructorFichaField(
  field: InstructorFichaFormField,
  values: InstructorFichaFormValues,
  context?: InstructorFichaValidationContext
): string | null {
  switch (field) {
    case "fichaId":
      return validatePositiveSelect(values.fichaId, "una ficha", context?.hasFichas ?? false);
    case "instructorId":
      return validatePositiveSelect(values.instructorId, "un instructor", context?.hasInstructores ?? false);
    default:
      return null;
  }
}

export function validateInstructorFichaForm(
  values: InstructorFichaFormValues,
  context?: InstructorFichaValidationContext
): InstructorFichaFormErrors {
  const errors: InstructorFichaFormErrors = {};
  for (const field of INSTRUCTOR_FICHA_FORM_FIELDS) {
    const err = validateInstructorFichaField(field, values, context);
    if (err) errors[field] = err;
  }
  return errors;
}

export { hasFormErrors as hasInstructorFichaFormErrors };
