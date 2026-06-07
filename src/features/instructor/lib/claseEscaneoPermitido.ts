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

function normalizarHora(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const hora = Number.parseInt(match[1], 10);
  const minuto = Number.parseInt(match[2], 10);
  if (!Number.isFinite(hora) || !Number.isFinite(minuto)) return null;

  return `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
}

function claseInicioUtcMs(fecha: string, horaInicio: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null;

  const hora = normalizarHora(horaInicio);
  if (!hora) return null;

  const parsed = Date.parse(`${fecha}T${hora}:00-05:00`);
  return Number.isNaN(parsed) ? null : parsed;
}

export function evaluarEscaneoClase(
  clase: ClaseEscaneoInput,
  now: Date = new Date()
): ClaseEscaneoResult {
  const fecha = clase.fecha?.trim() ?? "";
  const horaInicio = clase.horaInicio;

  if (!fecha) {
    return { permitido: true, motivo: null };
  }

  const hoy = formatearFechaBogota(now);

  if (!horaInicio?.trim()) {
    if (fecha < hoy) {
      return {
        permitido: false,
        motivo: "La fecha de la clase ya paso y no es posible registrar asistencia por QR."
      };
    }

    return { permitido: true, motivo: null };
  }

  const inicioMs = claseInicioUtcMs(fecha, horaInicio);
  if (inicioMs == null) {
    if (fecha < hoy) {
      return {
        permitido: false,
        motivo: "La fecha de la clase ya paso y no es posible registrar asistencia por QR."
      };
    }

    return { permitido: true, motivo: null };
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
