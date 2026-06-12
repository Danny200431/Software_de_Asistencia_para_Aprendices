import { validatePassword } from "@/src/lib/validatePassword";

export type AprendizFormField =
  | "nombre"
  | "apellido"
  | "numeroDocumento"
  | "idTipoDocumento"
  | "idGenero"
  | "telefono"
  | "correoElectronico"
  | "usemame"
  | "contrasenia"
  | "idProgramaFormacion"
  | "fichaIdFicha";

export type AprendizFormValues = {
  nombre: string;
  apellido: string;
  numeroDocumento: string;
  idTipoDocumento: string;
  idGenero: string;
  telefono: string;
  correoElectronico: string;
  usemame: string;
  contrasenia: string;
  idProgramaFormacion: string;
  fichaIdFicha: string;
  editingUsuarioId: number | null;
};

export type AprendizFormErrors = Partial<Record<AprendizFormField, string>>;

export type AprendizExistingRecord = {
  usuarioIdUsuario: number;
  numeroDocumento: string;
  correoElectronico: string;
  telefono: string;
};

export type AprendizValidationContext = {
  existing?: AprendizExistingRecord[];
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d\s+\-()]{7,20}$/;
const PERSON_NAME_RE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;

function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

function duplicateError(
  field: "numeroDocumento" | "correoElectronico" | "telefono",
  value: string,
  values: AprendizFormValues,
  context?: AprendizValidationContext
): string | null {
  if (!context?.existing?.length) return null;

  const exceptId = values.editingUsuarioId;
  const others = context.existing.filter((e) => e.usuarioIdUsuario !== exceptId);

  if (field === "numeroDocumento") {
    const v = value.trim();
    if (others.some((e) => e.numeroDocumento.trim() === v)) {
      return "Ya existe un aprendiz con ese numero de documento";
    }
    return null;
  }

  if (field === "correoElectronico") {
    const v = value.trim().toLowerCase();
    if (others.some((e) => e.correoElectronico.trim().toLowerCase() === v)) {
      return "Ya existe un aprendiz con ese correo electronico";
    }
    return null;
  }

  const digits = normalizePhoneDigits(value);
  if (!digits) return null;
  if (others.some((e) => normalizePhoneDigits(e.telefono) === digits)) {
    return "Ya existe un aprendiz con ese numero de telefono";
  }
  return null;
}

function validatePersonName(value: string, label: "nombre" | "apellido"): string | null {
  const v = value.trim();
  const labelText = label === "nombre" ? "nombre" : "apellido";
  if (!v) return `El ${labelText} es obligatorio`;
  if (v.length < 2) return `El ${labelText} debe tener al menos 2 caracteres`;
  if (/\d/.test(v)) return `El ${labelText} no puede contener numeros`;
  if (!PERSON_NAME_RE.test(v)) {
    return `El ${labelText} solo puede contener letras, espacios, guiones o apostrofes`;
  }
  return null;
}

export const APRENDIZ_FORM_FIELDS: AprendizFormField[] = [
  "nombre",
  "apellido",
  "numeroDocumento",
  "idTipoDocumento",
  "idGenero",
  "telefono",
  "correoElectronico",
  "usemame",
  "contrasenia",
  "idProgramaFormacion",
  "fichaIdFicha"
];

export function validateAprendizField(
  field: AprendizFormField,
  values: AprendizFormValues,
  context?: AprendizValidationContext
): string | null {
  const isNew = values.editingUsuarioId == null;

  switch (field) {
    case "nombre":
      return validatePersonName(values.nombre, "nombre");
    case "apellido":
      return validatePersonName(values.apellido, "apellido");
    case "numeroDocumento": {
      const v = values.numeroDocumento.trim();
      if (!v) return "El numero de documento es obligatorio";
      if (!/^\d{5,15}$/.test(v)) {
        return "Ingrese un documento valido (solo numeros, entre 5 y 15 digitos)";
      }
      return duplicateError("numeroDocumento", v, values, context);
    }
    case "idTipoDocumento": {
      if (!values.idTipoDocumento.trim()) return "El tipo de documento es obligatorio";
      return null;
    }
    case "idGenero": {
      if (!values.idGenero.trim()) return "El genero es obligatorio";
      return null;
    }
    case "telefono": {
      const v = values.telefono.trim();
      if (!v) return "El telefono es obligatorio";
      if (!PHONE_RE.test(v)) {
        return "Ingrese un telefono valido (7 a 20 digitos, puede incluir +, - o espacios)";
      }
      return duplicateError("telefono", v, values, context);
    }
    case "correoElectronico": {
      const v = values.correoElectronico.trim();
      if (!v) return "El correo electronico es obligatorio";
      if (!EMAIL_RE.test(v)) return "Ingrese un correo electronico valido";
      return duplicateError("correoElectronico", v, values, context);
    }
    case "usemame": {
      const v = values.usemame.trim();
      if (!v) return "El usuario (login) es obligatorio";
      if (v.length < 3) return "El usuario debe tener al menos 3 caracteres";
      if (!/^[a-zA-Z0-9._-]+$/.test(v)) {
        return "El usuario solo puede contener letras, numeros, puntos, guiones y guion bajo";
      }
      return null;
    }
    case "contrasenia": {
      if (isNew) {
        return validatePassword(values.contrasenia);
      }
      if (values.contrasenia.trim() !== "") {
        return validatePassword(values.contrasenia);
      }
      return null;
    }
    case "idProgramaFormacion": {
      if (!values.idProgramaFormacion.trim()) return "Seleccione un programa de formacion";
      return null;
    }
    case "fichaIdFicha": {
      const fichaNum = Number.parseInt(values.fichaIdFicha, 10);
      if (!Number.isFinite(fichaNum) || fichaNum < 1) {
        return "Seleccione una ficha del programa";
      }
      return null;
    }
    default:
      return null;
  }
}

export function validateAprendizForm(
  values: AprendizFormValues,
  context?: AprendizValidationContext
): AprendizFormErrors {
  const errors: AprendizFormErrors = {};
  for (const field of APRENDIZ_FORM_FIELDS) {
    const err = validateAprendizField(field, values, context);
    if (err) errors[field] = err;
  }
  return errors;
}

export function hasAprendizFormErrors(errors: AprendizFormErrors): boolean {
  return Object.keys(errors).length > 0;
}
