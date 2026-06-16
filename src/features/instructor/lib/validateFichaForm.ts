export type FichaFormField = "numeroFicha" | "programaId" | "aprendizKey";

export type FichaFormValues = {
  numeroFicha: string;
  programaId: string;
  aprendizKey: string;
  editingId: number | null;
};

export type FichaFormErrors = Partial<Record<FichaFormField, string>>;

export type FichaValidationContext = {
  hasProgramas: boolean;
  hasAprendices: boolean;
};

const FICHA_NUMBER_RE = /^[a-zA-Z0-9._\s-]+$/;

function parsePositiveInt(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseAprendizKey(aprendizKey: string): { usuarioIdUsuario: number; usuarioRolIdRol: number } | null {
  const [uid, rid] = aprendizKey.split("-").map((x) => Number.parseInt(x, 10));
  if (!Number.isFinite(uid) || !Number.isFinite(rid) || uid < 1 || rid < 1) return null;
  return { usuarioIdUsuario: uid, usuarioRolIdRol: rid };
}

export const FICHA_FORM_FIELDS: FichaFormField[] = ["numeroFicha", "programaId", "aprendizKey"];

export function validateFichaField(
  field: FichaFormField,
  values: FichaFormValues,
  context?: FichaValidationContext
): string | null {
  const isNew = values.editingId == null;

  switch (field) {
    case "numeroFicha": {
      const v = values.numeroFicha.trim();
      if (!v) return "El numero de ficha es obligatorio";
      if (v.length < 3) return "El numero de ficha debe tener al menos 3 caracteres";
      if (v.length > 45) return "El numero de ficha no puede superar 45 caracteres";
      if (!FICHA_NUMBER_RE.test(v)) {
        return "El numero de ficha solo puede contener letras, numeros, espacios, puntos o guiones";
      }
      return null;
    }
    case "programaId": {
      if (!context?.hasProgramas) return "No hay programas de formacion disponibles";
      if (!values.programaId.trim()) return "Seleccione un programa de formacion";
      if (parsePositiveInt(values.programaId) == null) {
        return "Seleccione un programa de formacion valido";
      }
      return null;
    }
    case "aprendizKey": {
      if (!isNew) return null;
      if (!context?.hasAprendices) return "No hay aprendices disponibles para vincular";
      if (!values.aprendizKey.trim()) return "Seleccione un aprendiz";
      if (parseAprendizKey(values.aprendizKey) == null) return "Seleccione un aprendiz valido";
      return null;
    }
    default:
      return null;
  }
}

export function validateFichaForm(
  values: FichaFormValues,
  context?: FichaValidationContext
): FichaFormErrors {
  const errors: FichaFormErrors = {};
  for (const field of FICHA_FORM_FIELDS) {
    const err = validateFichaField(field, values, context);
    if (err) errors[field] = err;
  }
  return errors;
}

export function hasFichaFormErrors(errors: FichaFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function parseAprendizFromKey(aprendizKey: string) {
  return parseAprendizKey(aprendizKey);
}
