import ExcelJS from "exceljs";
import { prisma } from "@/src/server/config/db/prisma";
import { buildAprendicesImportTemplate } from "@/src/features/instructor/lib/buildAprendicesImportTemplate";
import {
  APRENDICES_IMPORT_COLUMNS,
  APRENDICES_IMPORT_EXAMPLE_ROW,
  APRENDICES_IMPORT_SHEET,
  type AprendicesImportColumnKey,
  type AprendicesImportRow,
  cellToImportString,
  isAprendicesImportRowEmpty,
  normalizeAprendicesImportHeader
} from "@/src/features/instructor/lib/aprendicesImportColumns";
import {
  InstructorAprendicesCrudService,
  type AprendizCreateInput
} from "@/src/server/services/instructor-aprendices-crud.service";

export type AprendicesImportContext = {
  idProgramaFormacion: string;
  fichaIdFicha: number;
  programaNombre: string;
  fichaNumero: string;
};

export type AprendicesImportRowError = {
  fila: number;
  mensaje: string;
};

export type AprendicesImportResult = {
  creados: number;
  omitidos: number;
  errores: AprendicesImportRowError[];
};

export class InstructorAprendicesImportError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "InstructorAprendicesImportError";
    this.status = status;
  }
}

export class InstructorAprendicesImportService {
  private crud = new InstructorAprendicesCrudService();

  async resolveImportContext(
    idProgramaFormacion: string,
    fichaIdFicha: number
  ): Promise<AprendicesImportContext> {
    const prog = String(idProgramaFormacion ?? "").trim();
    if (!prog) {
      throw new InstructorAprendicesImportError("Seleccione un programa de formacion");
    }
    if (!Number.isFinite(fichaIdFicha) || fichaIdFicha < 1) {
      throw new InstructorAprendicesImportError("Seleccione una ficha valida");
    }

    const programaId = Number.parseInt(prog, 10);
    if (!Number.isFinite(programaId)) {
      throw new InstructorAprendicesImportError("Programa de formacion invalido");
    }

    const [programa, ficha] = await Promise.all([
      prisma.programaFormacion.findUnique({
        where: { idProgramaFormacion: programaId },
        select: { idProgramaFormacion: true, nombrePrograma: true }
      }),
      prisma.ficha.findUnique({
        where: { idFicha: fichaIdFicha },
        select: { idFicha: true, numeroFicha: true, idProgramaFormacion: true }
      })
    ]);

    if (!programa) {
      throw new InstructorAprendicesImportError("Programa de formacion no encontrado");
    }
    if (!ficha) {
      throw new InstructorAprendicesImportError("Ficha no encontrada");
    }
    if (String(ficha.idProgramaFormacion ?? "").trim() !== String(programa.idProgramaFormacion)) {
      throw new InstructorAprendicesImportError("La ficha no pertenece al programa seleccionado");
    }

    return {
      idProgramaFormacion: String(programa.idProgramaFormacion),
      fichaIdFicha: ficha.idFicha,
      programaNombre: programa.nombrePrograma,
      fichaNumero:
        ficha.numeroFicha != null && ficha.numeroFicha.trim() !== ""
          ? ficha.numeroFicha
          : `#${ficha.idFicha}`
    };
  }

  async generateTemplateBuffer(context: AprendicesImportContext): Promise<{
    buffer: Buffer;
    filename: string;
  }> {
    const { buffer, filename } = await buildAprendicesImportTemplate({
      programaNombre: context.programaNombre,
      fichaNumero: context.fichaNumero
    });

    return {
      buffer: Buffer.from(buffer),
      filename
    };
  }

  private parseWorksheetRows(sheet: ExcelJS.Worksheet): {
    rows: { fila: number; data: AprendicesImportRow }[];
    missingHeaders: string[];
  } {
    const headerRow = sheet.getRow(1);
    const columnByIndex = new Map<number, AprendicesImportColumnKey>();

    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const key = normalizeAprendicesImportHeader(cell.value);
      if (key) columnByIndex.set(colNumber, key);
    });

    const requiredHeaders = APRENDICES_IMPORT_COLUMNS.filter((c) => c.required).map((c) => c.header);
    const presentKeys = new Set(columnByIndex.values());
    const missingHeaders = requiredHeaders.filter((header) => {
      const col = APRENDICES_IMPORT_COLUMNS.find((c) => c.header === header);
      return col ? !presentKeys.has(col.key) : false;
    });

    if (missingHeaders.length > 0) {
      return { rows: [], missingHeaders };
    }

    const rows: { fila: number; data: AprendicesImportRow }[] = [];

    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
      const row = sheet.getRow(rowNumber);
      const data = {} as AprendicesImportRow;

      for (const col of APRENDICES_IMPORT_COLUMNS) {
        data[col.key] = "";
      }

      columnByIndex.forEach((key, colNumber) => {
        data[key] = cellToImportString(row.getCell(colNumber).value);
      });

      if (isAprendicesImportRowEmpty(data)) continue;
      rows.push({ fila: rowNumber, data });
    }

    return { rows, missingHeaders: [] };
  }

  private isExampleRow(row: AprendicesImportRow): boolean {
    return (
      row.nombre.trim().toLowerCase() === APRENDICES_IMPORT_EXAMPLE_ROW.nombre.toLowerCase() &&
      row.apellido.trim().toLowerCase() === APRENDICES_IMPORT_EXAMPLE_ROW.apellido.toLowerCase() &&
      row.numeroDocumento === APRENDICES_IMPORT_EXAMPLE_ROW.numeroDocumento &&
      row.correoElectronico.trim().toLowerCase() ===
        APRENDICES_IMPORT_EXAMPLE_ROW.correoElectronico.toLowerCase()
    );
  }

  private duplicateInBatchMessage(
    field: "numeroDocumento" | "correoElectronico" | "telefono" | "usuario",
    value: string,
    seen: Map<string, number>,
    currentRow: number
  ): string | null {
    const normalized =
      field === "correoElectronico"
        ? value.trim().toLowerCase()
        : field === "telefono"
          ? value.replace(/\D/g, "")
          : value.trim();

    if (!normalized) return null;

    const previousRow = seen.get(normalized);
    if (previousRow != null) {
      const labels = {
        numeroDocumento: "numero de documento",
        correoElectronico: "correo electronico",
        telefono: "telefono",
        usuario: "usuario"
      };
      return `Duplicado en el archivo (${labels[field]}) con la fila ${previousRow}`;
    }

    seen.set(normalized, currentRow);
    return null;
  }

  async importFromBuffer(
    fileBuffer: ArrayBuffer,
    context: AprendicesImportContext
  ): Promise<AprendicesImportResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);

    const sheet =
      workbook.getWorksheet(APRENDICES_IMPORT_SHEET) ??
      workbook.worksheets.find((ws) => ws.name.toLowerCase() === APRENDICES_IMPORT_SHEET.toLowerCase()) ??
      workbook.worksheets[0];

    if (!sheet) {
      throw new InstructorAprendicesImportError("El archivo Excel no contiene hojas");
    }

    const { rows, missingHeaders } = this.parseWorksheetRows(sheet);
    if (missingHeaders.length > 0) {
      throw new InstructorAprendicesImportError(
        `Faltan columnas obligatorias: ${missingHeaders.join(", ")}`
      );
    }

    if (rows.length === 0) {
      throw new InstructorAprendicesImportError(
        "No hay filas para importar. Complete al menos un aprendiz en la hoja Aprendices."
      );
    }

    const result: AprendicesImportResult = { creados: 0, omitidos: 0, errores: [] };
    const seenDocumento = new Map<string, number>();
    const seenCorreo = new Map<string, number>();
    const seenTelefono = new Map<string, number>();
    const seenUsuario = new Map<string, number>();

    for (const { fila, data } of rows) {
      if (this.isExampleRow(data)) {
        result.omitidos += 1;
        continue;
      }

      const batchErrors = [
        this.duplicateInBatchMessage("numeroDocumento", data.numeroDocumento, seenDocumento, fila),
        this.duplicateInBatchMessage("correoElectronico", data.correoElectronico, seenCorreo, fila),
        this.duplicateInBatchMessage("telefono", data.telefono, seenTelefono, fila),
        this.duplicateInBatchMessage("usuario", data.usuario, seenUsuario, fila)
      ].filter((msg): msg is string => msg != null);

      if (batchErrors.length > 0) {
        result.errores.push({ fila, mensaje: batchErrors[0] });
        continue;
      }

      const input: AprendizCreateInput = {
        nombre: data.nombre,
        apellido: data.apellido,
        numeroDocumento: data.numeroDocumento,
        idTipoDocumento: data.tipoDocumento.trim() !== "" ? data.tipoDocumento : "CC",
        idGenero: data.genero.trim() !== "" ? data.genero : "M",
        telefono: data.telefono,
        correoElectronico: data.correoElectronico,
        usemame: data.usuario,
        contrasenia: data.contrasenia,
        idProgramaFormacion: context.idProgramaFormacion,
        fichaIdFicha: context.fichaIdFicha,
        estado: data.estado.trim() !== "" ? (data.estado as AprendizCreateInput["estado"]) : undefined
      };

      try {
        await this.crud.createAprendizCompleto(input);
        result.creados += 1;
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : "No se pudo crear el aprendiz";
        result.errores.push({ fila, mensaje });
      }
    }

    return result;
  }
}
