import ExcelJS from "exceljs";
import {
  APRENDICES_IMPORT_COLUMNS,
  APRENDICES_IMPORT_EXAMPLE_ROW,
  APRENDICES_IMPORT_SHEET
} from "@/src/features/instructor/lib/aprendicesImportColumns";
import { PASSWORD_RULES } from "@/src/lib/validatePassword";

export type AprendicesImportTemplateContext = {
  programaNombre: string;
  fichaNumero: string;
};

export async function buildAprendicesImportTemplate(
  context: AprendicesImportTemplateContext
): Promise<{ buffer: ArrayBuffer; filename: string }> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Software de Asistencia";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(APRENDICES_IMPORT_SHEET, {
    views: [{ state: "frozen", ySplit: 1 }]
  });

  sheet.columns = APRENDICES_IMPORT_COLUMNS.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width
  }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FF1F2937" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF4F6F9" }
  };
  headerRow.alignment = { vertical: "middle" };

  sheet.addRow({
    nombre: APRENDICES_IMPORT_EXAMPLE_ROW.nombre,
    apellido: APRENDICES_IMPORT_EXAMPLE_ROW.apellido,
    numeroDocumento: APRENDICES_IMPORT_EXAMPLE_ROW.numeroDocumento,
    tipoDocumento: APRENDICES_IMPORT_EXAMPLE_ROW.tipoDocumento,
    genero: APRENDICES_IMPORT_EXAMPLE_ROW.genero,
    telefono: APRENDICES_IMPORT_EXAMPLE_ROW.telefono,
    correoElectronico: APRENDICES_IMPORT_EXAMPLE_ROW.correoElectronico,
    usuario: APRENDICES_IMPORT_EXAMPLE_ROW.usuario,
    contrasenia: APRENDICES_IMPORT_EXAMPLE_ROW.contrasenia,
    estado: APRENDICES_IMPORT_EXAMPLE_ROW.estado
  });

  const exampleRow = sheet.getRow(2);
  exampleRow.font = { italic: true, color: { argb: "FF6B7280" } };

  const instructions = workbook.addWorksheet("Instrucciones");
  instructions.getColumn(1).width = 92;

  const lines = [
    "Carga masiva de aprendices",
    "",
    `Programa: ${context.programaNombre}`,
    `Ficha: ${context.fichaNumero}`,
    "",
    "1. Complete una fila por aprendiz en la hoja Aprendices.",
    "2. Elimine o reemplace la fila de ejemplo antes de cargar el archivo.",
    "3. Las columnas obligatorias son: nombre, apellido, numero_documento, tipo_documento, genero, telefono, correo_electronico, usuario y contrasena.",
    "4. tipo_documento: use CC u otro codigo valido (por defecto CC).",
    "5. genero: M, F u O.",
    "6. estado: activo o inactivo. Si se deja vacio, se usa activo.",
    "7. contrasena: " +
      PASSWORD_RULES.map((rule) => rule.label.toLowerCase()).join(", ") +
      ".",
    "8. documento, correo, telefono y usuario deben ser unicos en el sistema.",
    "9. Todos los aprendices del archivo se registraran en la ficha indicada arriba."
  ];

  lines.forEach((line, index) => {
    const row = instructions.getRow(index + 1);
    row.getCell(1).value = line;
    if (index === 0) row.font = { bold: true, size: 12 };
  });

  const rawBuffer = await workbook.xlsx.writeBuffer();
  const buffer =
    rawBuffer instanceof ArrayBuffer
      ? rawBuffer
      : new Uint8Array(rawBuffer as Buffer).buffer;

  const safeFicha = context.fichaNumero.replace(/[^\w.-]+/g, "_");
  return {
    buffer,
    filename: `plantilla-aprendices-${safeFicha}.xlsx`
  };
}
