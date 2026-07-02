export const APRENDICES_IMPORT_SHEET = "Aprendices";

export type AprendicesImportColumnKey =
  | "nombre"
  | "apellido"
  | "numeroDocumento"
  | "tipoDocumento"
  | "genero"
  | "telefono"
  | "correoElectronico"
  | "usuario"
  | "contrasenia"
  | "estado";

export type AprendicesImportRow = Record<AprendicesImportColumnKey, string>;

export const APRENDICES_IMPORT_COLUMNS: {
  key: AprendicesImportColumnKey;
  header: string;
  width: number;
  required: boolean;
}[] = [
  { key: "nombre", header: "nombre", width: 18, required: true },
  { key: "apellido", header: "apellido", width: 18, required: true },
  { key: "numeroDocumento", header: "numero_documento", width: 16, required: true },
  { key: "tipoDocumento", header: "tipo_documento", width: 14, required: true },
  { key: "genero", header: "genero", width: 10, required: true },
  { key: "telefono", header: "telefono", width: 14, required: true },
  { key: "correoElectronico", header: "correo_electronico", width: 28, required: true },
  { key: "usuario", header: "usuario", width: 16, required: true },
  { key: "contrasenia", header: "contrasena", width: 18, required: true },
  { key: "estado", header: "estado", width: 12, required: false }
];

export const APRENDICES_IMPORT_EXAMPLE_ROW: AprendicesImportRow = {
  nombre: "Juan",
  apellido: "Perez",
  numeroDocumento: "12345678",
  tipoDocumento: "CC",
  genero: "M",
  telefono: "3001234567",
  correoElectronico: "juan.perez@correo.com",
  usuario: "jperez",
  contrasenia: "Aprendiz2024!",
  estado: "activo"
};

const HEADER_ALIASES: Record<string, AprendicesImportColumnKey> = {
  nombre: "nombre",
  apellido: "apellido",
  numero_documento: "numeroDocumento",
  numerodocumento: "numeroDocumento",
  documento: "numeroDocumento",
  tipo_documento: "tipoDocumento",
  tipodocumento: "tipoDocumento",
  genero: "genero",
  telefono: "telefono",
  correo_electronico: "correoElectronico",
  correoelectronico: "correoElectronico",
  correo: "correoElectronico",
  email: "correoElectronico",
  usuario: "usuario",
  user: "usuario",
  contrasena: "contrasenia",
  contraseña: "contrasenia",
  password: "contrasenia",
  estado: "estado"
};

export function normalizeAprendicesImportHeader(value: unknown): AprendicesImportColumnKey | null {
  if (value == null) return null;
  const normalized = String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, "_");
  return HEADER_ALIASES[normalized] ?? null;
}

export function cellToImportString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object" && value !== null && "text" in value) {
    return cellToImportString((value as { text: unknown }).text);
  }
  if (typeof value === "object" && value !== null && "result" in value) {
    return cellToImportString((value as { result: unknown }).result);
  }
  return String(value).trim();
}

export function isAprendicesImportRowEmpty(row: AprendicesImportRow): boolean {
  return APRENDICES_IMPORT_COLUMNS.filter((c) => c.required).every(
    (c) => row[c.key].trim() === ""
  );
}
