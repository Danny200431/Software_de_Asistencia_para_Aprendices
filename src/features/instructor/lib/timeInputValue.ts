/** Convierte un valor de hora guardado en BD/texto al formato `HH:MM` de `<input type="time">`. */
export function toTimeInputValue(raw: string | null | undefined): string {
  if (raw == null || String(raw).trim() === "") return "";
  const s = String(raw).trim();

  const match = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return "";

  let h = Number.parseInt(match[1], 10);
  let m = Number.parseInt(match[2], 10);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "";

  h = Math.min(23, Math.max(0, h));
  m = Math.min(59, Math.max(0, m));

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
