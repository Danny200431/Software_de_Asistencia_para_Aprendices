import { hasFormErrors, validateRequiredText } from "./adminFormShared";

export type ProgramaFormField = "nombrePrograma" | "nivelFormacion";

export type ProgramaFormValues = {
  nombrePrograma: string;
  nivelFormacion: string;
};

export type ProgramaFormErrors = Partial<Record<ProgramaFormField, string>>;

export const PROGRAMA_FORM_FIELDS: ProgramaFormField[] = ["nombrePrograma", "nivelFormacion"];

export function validateProgramaField(field: ProgramaFormField, values: ProgramaFormValues): string | null {
  switch (field) {
    case "nombrePrograma":
      return validateRequiredText(values.nombrePrograma, "El nombre del programa", { min: 3 });
    case "nivelFormacion":
      return validateRequiredText(values.nivelFormacion, "El nivel de formacion", { min: 3 });
    default:
      return null;
  }
}

export function validateProgramaForm(values: ProgramaFormValues): ProgramaFormErrors {
  const errors: ProgramaFormErrors = {};
  for (const field of PROGRAMA_FORM_FIELDS) {
    const err = validateProgramaField(field, values);
    if (err) errors[field] = err;
  }
  return errors;
}

export { hasFormErrors as hasProgramaFormErrors };
