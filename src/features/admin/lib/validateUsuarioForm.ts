import { validatePassword } from "@/src/lib/validatePassword";
import {
  EMAIL_RE,
  hasFormErrors,
  PHONE_RE,
  USERNAME_RE,
  validatePersonName,
  validatePositiveSelect
} from "./adminFormShared";

export type UsuarioFormField =
  | "nombre"
  | "apellido"
  | "correoElectronico"
  | "telefono"
  | "numeroDocumento"
  | "usemame"
  | "contrasenia"
  | "rolId";

export type UsuarioFormValues = {
  nombre: string;
  apellido: string;
  correoElectronico: string;
  telefono: string;
  numeroDocumento: string;
  usemame: string;
  contrasenia: string;
  rolId: string;
  editingId: number | null;
};

export type UsuarioFormErrors = Partial<Record<UsuarioFormField, string>>;

export type UsuarioExistingRecord = {
  idUsuario: number;
  numeroDocumento: string;
  correoElectronico: string;
  telefono: string;
  usemame: string;
};

export type UsuarioValidationContext = {
  existing?: UsuarioExistingRecord[];
  hasRoles?: boolean;
};

function duplicateError(
  field: "numeroDocumento" | "correoElectronico" | "telefono" | "usemame",
  value: string,
  values: UsuarioFormValues,
  context?: UsuarioValidationContext
): string | null {
  if (!context?.existing?.length) return null;
  const exceptId = values.editingId;
  const others = context.existing.filter((e) => e.idUsuario !== exceptId);

  if (field === "numeroDocumento") {
    const v = value.trim();
    if (others.some((e) => e.numeroDocumento.trim() === v)) {
      return "Ya existe un usuario con ese numero de documento";
    }
    return null;
  }

  if (field === "correoElectronico") {
    const v = value.trim().toLowerCase();
    if (others.some((e) => e.correoElectronico.trim().toLowerCase() === v)) {
      return "Ya existe un usuario con ese correo electronico";
    }
    return null;
  }

  if (field === "usemame") {
    const v = value.trim();
    if (others.some((e) => e.usemame.trim() === v)) {
      return "El nombre de usuario ya esta en uso";
    }
    return null;
  }

  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  if (others.some((e) => e.telefono.replace(/\D/g, "") === digits)) {
    return "Ya existe un usuario con ese numero de telefono";
  }
  return null;
}

export const USUARIO_FORM_FIELDS: UsuarioFormField[] = [
  "nombre",
  "apellido",
  "correoElectronico",
  "telefono",
  "numeroDocumento",
  "usemame",
  "contrasenia",
  "rolId"
];

export function validateUsuarioField(
  field: UsuarioFormField,
  values: UsuarioFormValues,
  context?: UsuarioValidationContext
): string | null {
  const isNew = values.editingId == null;

  switch (field) {
    case "nombre":
      return validatePersonName(values.nombre, "nombre");
    case "apellido":
      return validatePersonName(values.apellido, "apellido");
    case "correoElectronico": {
      const v = values.correoElectronico.trim();
      if (!v) return "El correo electronico es obligatorio";
      if (!EMAIL_RE.test(v)) return "Ingrese un correo electronico valido";
      return duplicateError("correoElectronico", v, values, context);
    }
    case "telefono": {
      const v = values.telefono.trim();
      if (!v) return "El telefono es obligatorio";
      if (!PHONE_RE.test(v)) {
        return "Ingrese un telefono valido (7 a 20 digitos, puede incluir +, - o espacios)";
      }
      return duplicateError("telefono", v, values, context);
    }
    case "numeroDocumento": {
      const v = values.numeroDocumento.trim();
      if (!v) return "El numero de documento es obligatorio";
      if (!/^\d{5,15}$/.test(v)) {
        return "Ingrese un documento valido (solo numeros, entre 5 y 15 digitos)";
      }
      return duplicateError("numeroDocumento", v, values, context);
    }
    case "usemame": {
      const v = values.usemame.trim();
      if (!v) return "El usuario (login) es obligatorio";
      if (v.length < 3) return "El usuario debe tener al menos 3 caracteres";
      if (!USERNAME_RE.test(v)) {
        return "El usuario solo puede contener letras, numeros, puntos, guiones y guion bajo";
      }
      return duplicateError("usemame", v, values, context);
    }
    case "contrasenia": {
      if (isNew) return validatePassword(values.contrasenia);
      if (values.contrasenia.trim() !== "") return validatePassword(values.contrasenia);
      return null;
    }
    case "rolId":
      if (!isNew) return null;
      return validatePositiveSelect(values.rolId, "un rol", context?.hasRoles ?? true);
    default:
      return null;
  }
}

export function validateUsuarioForm(
  values: UsuarioFormValues,
  context?: UsuarioValidationContext
): UsuarioFormErrors {
  const errors: UsuarioFormErrors = {};
  for (const field of USUARIO_FORM_FIELDS) {
    const err = validateUsuarioField(field, values, context);
    if (err) errors[field] = err;
  }
  return errors;
}

export { hasFormErrors as hasUsuarioFormErrors };
