"use client";

import { usePathname, useRouter } from "next/navigation";
import { FiLogOut } from "react-icons/fi";
import styles from "./HomeNavbar.module.css";

function roleLabelForPath(pathname: string) {
  if (pathname.startsWith("/home/aprendiz")) return "Aprendiz";
  if (pathname.startsWith("/home/instructor")) return "Instructor";
  if (pathname.startsWith("/home/administrador")) return "Administrador";
  return "Usuario";
}

export function HomeNavbar() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const roleLabel = roleLabelForPath(pathname);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
    } catch {
      // ignore
    }
    router.push("/");
  };

  return (
    <header>
      <nav className={styles.nav} aria-label="Principal">
        <p className={styles.brand}>
          <span className={styles.brandSaa}>SAA</span>
          <span className={styles.brandRole}>{roleLabel}</span>
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.logout}
            onClick={handleLogout}
            aria-label="Cerrar sesion"
          >
            <FiLogOut className={styles.logoutIcon} aria-hidden />
            Cerrar sesion
          </button>
        </div>
      </nav>
    </header>
  );
}
