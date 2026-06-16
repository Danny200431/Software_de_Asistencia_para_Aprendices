"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiAward,
  FiBookOpen,
  FiHome,
  FiLink,
  FiMapPin,
  FiUserCheck,
  FiUsers
} from "react-icons/fi";
import { decodeAuthTokenPayload } from "@/src/features/auth/lib/decodeAuthToken";
import styles from "./AdminDashboard.module.css";

type ModuleItem = {
  href: string;
  label: string;
  desc: string;
  icon: typeof FiHome;
  tone: "blue" | "green" | "violet";
};

type ModuleSection = {
  title: string;
  items: ModuleItem[];
};

const SECTIONS: ModuleSection[] = [
  {
    title: "Infraestructura",
    items: [
      {
        href: "/home/administrador/centros",
        label: "Centros de formacion",
        desc: "Administrar sedes y ubicaciones del SENA.",
        icon: FiMapPin,
        tone: "blue"
      },
      {
        href: "/home/administrador/ambientes",
        label: "Ambientes",
        desc: "Gestionar salones, talleres y espacios de clase.",
        icon: FiHome,
        tone: "blue"
      }
    ]
  },
  {
    title: "Formacion academica",
    items: [
      {
        href: "/home/administrador/programas",
        label: "Programas",
        desc: "Catalogo de programas de formacion.",
        icon: FiBookOpen,
        tone: "green"
      },
      {
        href: "/home/administrador/competencias",
        label: "Competencias",
        desc: "Cursos y competencias del plan formativo.",
        icon: FiAward,
        tone: "green"
      },
      {
        href: "/home/administrador/programa-competencias",
        label: "Asignar competencias",
        desc: "Vincular competencias a cada programa.",
        icon: FiLink,
        tone: "green"
      }
    ]
  },
  {
    title: "Usuarios y fichas",
    items: [
      {
        href: "/home/administrador/usuarios",
        label: "Usuarios",
        desc: "Aprendices, instructores y administradores.",
        icon: FiUsers,
        tone: "violet"
      },
      {
        href: "/home/administrador/fichas",
        label: "Fichas",
        desc: "Grupos de formacion y numeros de ficha.",
        icon: FiBookOpen,
        tone: "violet"
      },
      {
        href: "/home/administrador/instructor-fichas",
        label: "Instructores y fichas",
        desc: "Asignar fichas a los instructores responsables.",
        icon: FiUserCheck,
        tone: "violet"
      }
    ]
  }
];

const TONE_CLASS = {
  blue: styles.iconWrapBlue,
  green: styles.iconWrapGreen,
  violet: styles.iconWrapViolet
} as const;

export function AdminDashboard() {
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const payload = decodeAuthTokenPayload(token);
      const nombre = payload?.nombre?.trim() ?? "";
      const apellido = payload?.apellido?.trim() ?? "";
      const fullName = [nombre, apellido].filter(Boolean).join(" ");
      if (fullName) setDisplayName(fullName);
    } catch {
      // ignore
    }
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Panel administrativo</p>
          <h1 className={styles.heading}>
            Bienvenido al <span className={styles.headingAccent}>centro de control</span>
          </h1>
          <p className={styles.subtitle}>
            Configure la infraestructura, el catalogo academico y los usuarios del sistema de
            asistencia para aprendices.
          </p>
          {displayName ? (
            <p className={styles.welcome}>
              Sesion iniciada como <strong>{displayName}</strong>
            </p>
          ) : null}
        </header>

        <div className={styles.sections}>
          {SECTIONS.map((section) => (
            <section key={section.title} className={styles.section} aria-labelledby={`section-${section.title}`}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionBar} aria-hidden />
                <h2 id={`section-${section.title}`} className={styles.sectionTitle}>
                  {section.title}
                </h2>
              </div>
              <div className={styles.grid}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} className={styles.card}>
                      <div className={styles.cardTop}>
                        <span className={`${styles.iconWrap} ${TONE_CLASS[item.tone]}`}>
                          <Icon className={styles.icon} aria-hidden />
                        </span>
                        <FiArrowRight className={styles.cardArrow} aria-hidden />
                      </div>
                      <h3 className={styles.cardTitle}>{item.label}</h3>
                      <p className={styles.cardDesc}>{item.desc}</p>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
