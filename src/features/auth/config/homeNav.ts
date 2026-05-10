import type { AuthUserPayload } from "@/src/server/config/types/auth.types";

export type HomeUserRole = "aprendiz" | "instructor" | "administrador";

export type HomeNavLink = {
  label: string;
  href: string;
};

/** Ruta base del panel por rol (login y marca del navbar). */
export const HOME_PATH_BY_ROLE: Record<HomeUserRole, string> = {
  aprendiz: "/home/aprendiz",
  instructor: "/home/instructor/aprendices",
  administrador: "/home/administrador"
};

const ROLE_LABEL: Record<HomeUserRole, string> = {
  aprendiz: "Aprendiz",
  instructor: "Instructor",
  administrador: "Administrador"
};

/**
 * Enlaces del navbar por rol. Solo instructor tiene entradas por ahora;
 * amplía aquí aprendiz / administrador cuando existan pantallas.
 */
export const NAV_LINKS_BY_ROLE: Record<HomeUserRole, HomeNavLink[]> = {
  aprendiz: [],
  instructor: [
    { label: "Asistencia", href: "/home/instructor/aprendices" },
    { label: "Clases", href: "/home/instructor/clases" },
    { label: "Fichas", href: "/home/instructor/fichas" }
  ],
  administrador: []
};

export function normalizeHomeRole(rol: string | undefined): HomeUserRole | null {
  const r = rol?.trim().toLowerCase();
  if (r === "aprendiz" || r === "instructor" || r === "administrador") return r;
  return null;
}

export function homeRoleFromPathname(pathname: string): HomeUserRole | null {
  if (pathname.startsWith("/home/aprendiz")) return "aprendiz";
  if (pathname.startsWith("/home/instructor")) return "instructor";
  if (pathname.startsWith("/home/administrador")) return "administrador";
  return null;
}

export function labelForHomeRole(role: HomeUserRole): string {
  return ROLE_LABEL[role];
}

export function resolveHomeRole(
  pathname: string,
  payload: AuthUserPayload | null
): HomeUserRole | null {
  const fromToken = normalizeHomeRole(payload?.rol);
  if (fromToken) return fromToken;
  return homeRoleFromPathname(pathname);
}
