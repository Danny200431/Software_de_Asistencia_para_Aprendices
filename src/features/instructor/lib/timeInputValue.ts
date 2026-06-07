/** Convierte un valor de hora guardado en BD/texto al formato `HH:MM` de `<input type="time">`. */
export function toTimeInputValue(raw: string | null | undefined): string {
  if (raw == null || String(raw).trim() === "") return "";
  const s = String(raw).trim();

  const match = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (match) {
    let h = Number.parseInt(match[1], 10);
    let m = Number.parseInt(match[2], 10);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return "";

    const meridian = match[4]?.toLowerCase();
    if (meridian === "pm" && h < 12) h += 12;
    if (meridian === "am" && h === 12) h = 0;

    h = Math.min(23, Math.max(0, h));
    m = Math.min(59, Math.max(0, m));

    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  const compact = s.match(/^(\d{3,4})$/);
  if (compact) {
    const digits = compact[1].padStart(4, "0");
    const h = Number.parseInt(digits.slice(0, 2), 10);
    const m = Number.parseInt(digits.slice(2, 4), 10);
    if (!Number.isFinite(h) || !Number.isFinite(m) || h > 23 || m > 59) return "";
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  return "";
}
