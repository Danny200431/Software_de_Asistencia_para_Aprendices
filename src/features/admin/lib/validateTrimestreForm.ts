import { hasFormErrors, validateRequiredText } from "./adminFormShared";

export type TrimestreFormField = "nombre" | "fechaInicio" | "fechaFin";

export type TrimestreFormValues = {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
};

export type TrimestreFormErrors = Partial<Record<TrimestreFormField, string>>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const TRIMESTRE_FORM_FIELDS: TrimestreFormField[] = ["nombre", "fechaInicio", "fechaFin"];

export function validateTrimestreField(
  field: TrimestreFormField,
  values: TrimestreFormValues
): string | null {
  switch (field) {
    case "nombre":
      return validateRequiredText(values.nombre, "El nombre del trimestre", { min: 3, max: 80 });
    case "fechaInicio": {
      const v = values.fechaInicio.trim();
      if (!v) return "La fecha de inicio es obligatoria";
      if (!DATE_RE.test(v)) return "Ingrese una fecha de inicio valida";
      return null;
    }
    case "fechaFin": {
      const v = values.fechaFin.trim();
      if (!v) return "La fecha de fin es obligatoria";
      if (!DATE_RE.test(v)) return "Ingrese una fecha de fin valida";
      if (values.fechaInicio.trim() && DATE_RE.test(values.fechaInicio.trim()) && v < values.fechaInicio.trim()) {
        return "La fecha de fin debe ser posterior o igual a la de inicio";
      }
      return null;
    }
    default:
      return null;
  }
}

export function validateTrimestreForm(values: TrimestreFormValues): TrimestreFormErrors {
  const errors: TrimestreFormErrors = {};
  for (const field of TRIMESTRE_FORM_FIELDS) {
    const err = validateTrimestreField(field, values);
    if (err) errors[field] = err;
  }
  return errors;
}

export { hasFormErrors as hasTrimestreFormErrors };
