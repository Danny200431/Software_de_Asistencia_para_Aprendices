"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { AdminFieldError } from "@/src/features/admin/components/AdminFieldError";
import { fieldInputClass, focusFirstInvalidField } from "@/src/features/admin/lib/adminFormUi";
import {
  hasProgramaCompetenciaFormErrors,
  validateProgramaCompetenciaForm,
  type ProgramaCompetenciaFormErrors,
  type ProgramaCompetenciaFormField
} from "@/src/features/admin/lib/validateProgramaCompetenciaForm";
import styles from "@/src/features/instructor/components/InstructorGestion.module.css";

type Asignacion = {
  cursoCompetenciaIdCurso: number;
  programaFormacionIdProgramaFormacion: number;
  programaFormacion: { idProgramaFormacion: number; nombrePrograma: string };
  cursoCompetencia: { idCurso: number; nombreCurso: string };
};
type ProgramaOpt = { idProgramaFormacion: number; nombrePrograma: string };
type CompetenciaOpt = { idCurso: number; nombreCurso: string };

export function AdminProgramaCompetenciasCrud() {
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [programas, setProgramas] = useState<ProgramaOpt[]>([]);
  const [competencias, setCompetencias] = useState<CompetenciaOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [programaId, setProgramaId] = useState("");
  const [competenciaId, setCompetenciaId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ProgramaCompetenciaFormErrors>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await axios.get<{ ok: boolean; asignaciones?: Asignacion[]; programas?: ProgramaOpt[]; competencias?: CompetenciaOpt[]; error?: string }>("/api/admin/programa-competencias");
      if (!data.ok) { setError(data.error ?? "Error al cargar"); return; }
      setAsignaciones(data.asignaciones ?? []);
      setProgramas(data.programas ?? []);
      setCompetencias(data.competencias ?? []);
    } catch { setError("Error al cargar asignaciones"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!loading && programaId === "" && programas[0]) setProgramaId(String(programas[0].idProgramaFormacion));
    if (!loading && competenciaId === "" && competencias[0]) setCompetenciaId(String(competencias[0].idCurso));
  }, [loading, programas, competencias, programaId, competenciaId]);

  const showFieldError = (field: ProgramaCompetenciaFormField) => (formSubmitted ? fieldErrors[field] : undefined);
  const clearFieldError = (field: ProgramaCompetenciaFormField) => {
    if (!formSubmitted) return;
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    const errors = validateProgramaCompetenciaForm(
      { programaId, competenciaId },
      { hasProgramas: programas.length > 0, hasCompetencias: competencias.length > 0 }
    );
    setFieldErrors(errors);
    if (hasProgramaCompetenciaFormErrors(errors)) { focusFirstInvalidField(); return; }
    setSaving(true); setError(null);
    try {
      await axios.post("/api/admin/programa-competencias", {
        programaFormacionIdProgramaFormacion: Number.parseInt(programaId, 10),
        cursoCompetenciaIdCurso: Number.parseInt(competenciaId, 10)
      });
      setFormSubmitted(false);
      setFieldErrors({});
      await load();
    } catch (err) {
      setError(axios.isAxiosError(err) && typeof err.response?.data?.error === "string" ? err.response.data.error : "No se pudo asignar");
    } finally { setSaving(false); }
  };

  const remove = async (cursoId: number) => {
    if (!globalThis.confirm("Desasignar esta competencia del programa?")) return;
    try {
      await axios.delete("/api/admin/programa-competencias", { data: { cursoCompetenciaIdCurso: cursoId } });
      await load();
    } catch (err) {
      setError(axios.isAxiosError(err) && typeof err.response?.data?.error === "string" ? err.response.data.error : "No se pudo desasignar");
    }
  };

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Asignar competencias a programas</h1>
      <p className={styles.subtitle}>Vincule competencias del catalogo a un programa de formacion.</p>
      <section className={styles.formPanel}>
        <h2 className={styles.formTitle}>Nueva asignacion</h2>
        <form noValidate onSubmit={(e) => void submit(e)}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="asig-prog">Programa</label>
              <select
                id="asig-prog"
                className={fieldInputClass(!!showFieldError("programaId"), styles.select, styles.selectInvalid)}
                value={programaId}
                onChange={(e) => { setProgramaId(e.target.value); clearFieldError("programaId"); }}
                aria-invalid={showFieldError("programaId") ? true : undefined}
                aria-describedby={showFieldError("programaId") ? "asig-prog-error" : undefined}
              >
                <option value="">Seleccione</option>
                {programas.map((p) => <option key={p.idProgramaFormacion} value={String(p.idProgramaFormacion)}>{p.nombrePrograma}</option>)}
              </select>
              <AdminFieldError id="asig-prog-error" message={showFieldError("programaId")} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="asig-comp">Competencia</label>
              <select
                id="asig-comp"
                className={fieldInputClass(!!showFieldError("competenciaId"), styles.select, styles.selectInvalid)}
                value={competenciaId}
                onChange={(e) => { setCompetenciaId(e.target.value); clearFieldError("competenciaId"); }}
                aria-invalid={showFieldError("competenciaId") ? true : undefined}
                aria-describedby={showFieldError("competenciaId") ? "asig-comp-error" : undefined}
              >
                <option value="">Seleccione</option>
                {competencias.map((c) => <option key={c.idCurso} value={String(c.idCurso)}>{c.nombreCurso}</option>)}
              </select>
              <AdminFieldError id="asig-comp-error" message={showFieldError("competenciaId")} />
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving}>Asignar</button>
          </div>
          {error && <p className={styles.error} role="alert">{error}</p>}
        </form>
      </section>
      {loading ? <p className={styles.loadingMuted}>Cargando...</p> : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Programa</th><th>Competencia</th><th>Acciones</th></tr></thead>
            <tbody>
              {asignaciones.length === 0 ? <tr><td colSpan={3} style={{ color: "#6b7280" }}>Sin asignaciones</td></tr> :
                asignaciones.map((a) => (
                  <tr key={a.cursoCompetenciaIdCurso}>
                    <td>{a.programaFormacion.nombrePrograma}</td>
                    <td>{a.cursoCompetencia.nombreCurso}</td>
                    <td>
                      <button type="button" className={`${styles.rowBtn} ${styles.rowBtnDanger}`} onClick={() => void remove(a.cursoCompetenciaIdCurso)}>Desasignar</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
