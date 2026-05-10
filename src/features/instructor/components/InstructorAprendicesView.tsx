"use client";

import { InstructorAprendicesCrud } from "./InstructorAprendicesCrud";
import { InstructorHomeFilters } from "./InstructorHomeFilters";
import styles from "./InstructorAprendicesView.module.css";

export function InstructorAprendicesView() {
  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>Gestion de asistencia</h1>
      <p className={styles.subtitle}>
        Vincule aprendices con fichas y consulte las asistencias filtrando por programa, competencia,
        ficha y clase.
      </p>

      <InstructorAprendicesCrud />

      <div className={styles.consultaRegion}>
        <InstructorHomeFilters embedded />
      </div>
    </main>
  );
}
