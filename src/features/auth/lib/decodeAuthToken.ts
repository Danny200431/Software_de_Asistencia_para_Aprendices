import type { AuthUserPayload } from "@/src/server/config/types/auth.types";

function decodeBase64Url(segment: string): string {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(pad);
  return atob(padded);
}

/** Lee el payload del JWT sin verificar firma (solo para UI en el cliente). */
export function decodeAuthTokenPayload(token: string): AuthUserPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const json = decodeBase64Url(parts[1]);
    return JSON.parse(json) as AuthUserPayload;
  } catch {
    return null;
  }
}
