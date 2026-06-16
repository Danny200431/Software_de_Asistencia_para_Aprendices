export const MAX_TEXT_LENGTH = 45;

export const PERSON_NAME_RE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^[\d\s+\-()]{7,20}$/;
export const USERNAME_RE = /^[a-zA-Z0-9._-]+$/;
export const FICHA_NUMBER_RE = /^[a-zA-Z0-9._\s-]+$/;
export const DURACION_RE = /^[\d\s]+(horas?|hrs?|h)?$/i;

export function parsePositiveInt(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function parseAprendizKey(aprendizKey: string): { usuarioIdUsuario: number; usuarioRolIdRol: number } | null {
  const [uid, rid] = aprendizKey.split("-").map((x) => Number.parseInt(x, 10));
  if (!Number.isFinite(uid) || !Number.isFinite(rid) || uid < 1 || rid < 1) return null;
  return { usuarioIdUsuario: uid, usuarioRolIdRol: rid };
}

export function validatePersonName(value: string, label: "nombre" | "apellido"): string | null {
  const v = value.trim();
  const labelText = label === "nombre" ? "nombre" : "apellido";
  if (!v) return `El ${labelText} es obligatorio`;
  if (v.length < 2) return `El ${labelText} debe tener al menos 2 caracteres`;
  if (v.length > MAX_TEXT_LENGTH) return `El ${labelText} no puede superar ${MAX_TEXT_LENGTH} caracteres`;
  if (/\d/.test(v)) return `El ${labelText} no puede contener numeros`;
  if (!PERSON_NAME_RE.test(v)) {
    return `El ${labelText} solo puede contener letras, espacios, guiones o apostrofes`;
  }
  return null;
}

export function validateRequiredText(
  value: string,
  label: string,
  options?: { min?: number; max?: number; pattern?: RegExp; patternMsg?: string }
): string | null {
  const v = value.trim();
  const min = options?.min ?? 2;
  const max = options?.max ?? MAX_TEXT_LENGTH;
  if (!v) return `${label} es obligatorio`;
  if (v.length < min) return `${label} debe tener al menos ${min} caracteres`;
  if (v.length > max) return `${label} no puede superar ${max} caracteres`;
  if (options?.pattern && !options.pattern.test(v)) {
    return options.patternMsg ?? `${label} tiene un formato invalido`;
  }
  return null;
}

export function validatePositiveSelect(
  value: string,
  label: string,
  hasOptions: boolean
): string | null {
  if (!hasOptions) return `No hay ${label.toLowerCase()} disponibles`;
  if (!value.trim()) return `Seleccione ${label.toLowerCase()}`;
  if (parsePositiveInt(value) == null) return `Seleccione ${label.toLowerCase()} valido`;
  return null;
}

export function hasFormErrors<T extends string>(errors: Partial<Record<T, string>>): boolean {
  return Object.keys(errors).length > 0;
}
