import { hasFormErrors, validatePositiveSelect, validateRequiredText } from "./adminFormShared";

export type AmbienteFormField = "nombreAmbiente" | "ubicacion" | "centroId";

export type AmbienteFormValues = {
  nombreAmbiente: string;
  ubicacion: string;
  centroId: string;
};

export type AmbienteFormErrors = Partial<Record<AmbienteFormField, string>>;

export type AmbienteValidationContext = {
  hasCentros: boolean;
};

export const AMBIENTE_FORM_FIELDS: AmbienteFormField[] = ["nombreAmbiente", "ubicacion", "centroId"];

export function validateAmbienteField(
  field: AmbienteFormField,
  values: AmbienteFormValues,
  context?: AmbienteValidationContext
): string | null {
  switch (field) {
    case "nombreAmbiente":
      return validateRequiredText(values.nombreAmbiente, "El nombre del ambiente", { min: 2 });
    case "ubicacion":
      return validateRequiredText(values.ubicacion, "La ubicacion", { min: 2 });
    case "centroId":
      return validatePositiveSelect(values.centroId, "un centro de formacion", context?.hasCentros ?? false);
    default:
      return null;
  }
}

export function validateAmbienteForm(
  values: AmbienteFormValues,
  context?: AmbienteValidationContext
): AmbienteFormErrors {
  const errors: AmbienteFormErrors = {};
  for (const field of AMBIENTE_FORM_FIELDS) {
    const err = validateAmbienteField(field, values, context);
    if (err) errors[field] = err;
  }
  return errors;
}

export { hasFormErrors as hasAmbienteFormErrors };
