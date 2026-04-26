import jwt from "jsonwebtoken";
import type { AuthUserPayload } from "@/src/server/config/types/auth.types";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const EXPIRES_IN = "24h";

export function signAuthToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyAuthToken(token: string): AuthUserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUserPayload;
  } catch {
    return null;
  }
}
