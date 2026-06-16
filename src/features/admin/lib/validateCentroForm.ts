import {
  hasFormErrors,
  PERSON_NAME_RE,
  validateRequiredText
} from "./adminFormShared";

export type CentroFormField = "ciudad" | "dirreccion";

export type CentroFormValues = {
  ciudad: string;
  dirreccion: string;
};

export type CentroFormErrors = Partial<Record<CentroFormField, string>>;

export const CENTRO_FORM_FIELDS: CentroFormField[] = ["ciudad", "dirreccion"];

export function validateCentroField(field: CentroFormField, values: CentroFormValues): string | null {
  switch (field) {
    case "ciudad":
      return validateRequiredText(values.ciudad, "La ciudad", {
        min: 2,
        pattern: PERSON_NAME_RE,
        patternMsg: "La ciudad solo puede contener letras, espacios, guiones o apostrofes"
      });
    case "dirreccion":
      return validateRequiredText(values.dirreccion, "La direccion", { min: 5 });
    default:
      return null;
  }
}

export function validateCentroForm(values: CentroFormValues): CentroFormErrors {
  const errors: CentroFormErrors = {};
  for (const field of CENTRO_FORM_FIELDS) {
    const err = validateCentroField(field, values);
    if (err) errors[field] = err;
  }
  return errors;
}

export { hasFormErrors as hasCentroFormErrors };
