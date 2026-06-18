const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDateOnly(value: string): Date {
  if (!DATE_RE.test(value)) {
    throw new Error("Fecha invalida");
  }
  return new Date(`${value}T12:00:00`);
}

function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** diaSemana: 0 = domingo, 1 = lunes, ... 6 = sabado (convencion Date.getDay()). */
export function fechasSemanalesEnRango(
  fechaInicio: string,
  fechaFin: string,
  diaSemana: number
): string[] {
  if (!Number.isInteger(diaSemana) || diaSemana < 0 || diaSemana > 6) {
    throw new Error("Dia de la semana invalido");
  }

  const inicio = parseDateOnly(fechaInicio);
  const fin = parseDateOnly(fechaFin);
  if (inicio > fin) {
    throw new Error("La fecha de inicio debe ser anterior o igual a la fecha de fin");
  }

  const current = new Date(inicio);
  while (current.getDay() !== diaSemana && current <= fin) {
    current.setDate(current.getDate() + 1);
  }

  const fechas: string[] = [];
  while (current <= fin) {
    fechas.push(formatDateOnly(current));
    current.setDate(current.getDate() + 7);
  }

  return fechas;
}

export function fechaDentroDeRango(fecha: string, fechaInicio: string, fechaFin: string): boolean {
  const d = parseDateOnly(fecha);
  const inicio = parseDateOnly(fechaInicio);
  const fin = parseDateOnly(fechaFin);
  return d >= inicio && d <= fin;
}
