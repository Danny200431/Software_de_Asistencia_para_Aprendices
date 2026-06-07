import { toDateInputValue } from "@/src/features/instructor/lib/dateInputValue";
import { toTimeInputValue } from "@/src/features/instructor/lib/timeInputValue";

const TIMEZONE = "America/Bogota";
const VENTANA_ESCANEO_MS = 4 * 60 * 60 * 1000;

export type ClaseEscaneoInput = {
  fecha: string | null | undefined;
  horaInicio: string | null | undefined;
};

export type ClaseEscaneoResult = {
  permitido: boolean;
  motivo: string | null;
};

function formatearFechaBogota(date: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function claseInicioUtcMs(fecha: string, horaInicio: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null;

  const hora = toTimeInputValue(horaInicio);
  if (!hora) return null;

  const parsed = Date.parse(`${fecha}T${hora}:00-05:00`);
  return Number.isNaN(parsed) ? null : parsed;
}

export function evaluarEscaneoClase(
  clase: ClaseEscaneoInput,
  now: Date = new Date()
): ClaseEscaneoResult {
  const fecha = toDateInputValue(clase.fecha);
  const horaInicio = toTimeInputValue(clase.horaInicio);

  if (!fecha) {
    return { permitido: true, motivo: null };
  }

  const hoy = formatearFechaBogota(now);

  if (fecha > hoy) {
    return {
      permitido: false,
      motivo: "Solo puede escanear asistencia el dia programado para la clase."
    };
  }

  if (fecha === hoy) {
    return { permitido: true, motivo: null };
  }

  if (!horaInicio) {
    return {
      permitido: false,
      motivo: "La fecha de la clase ya paso y no es posible registrar asistencia por QR."
    };
  }

  const inicioMs = claseInicioUtcMs(fecha, horaInicio);
  if (inicioMs == null) {
    return {
      permitido: false,
      motivo: "La fecha de la clase ya paso y no es posible registrar asistencia por QR."
    };
  }

  const limiteMs = inicioMs + VENTANA_ESCANEO_MS;
  if (now.getTime() > limiteMs) {
    return {
      permitido: false,
      motivo:
        "El periodo de escaneo finalizo. Solo se permite registrar asistencia hasta 4 horas despues del inicio de la clase."
    };
  }

  return { permitido: true, motivo: null };
}
