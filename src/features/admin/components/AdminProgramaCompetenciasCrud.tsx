"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
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

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!programaId || !competenciaId) { setError("Seleccione programa y competencia"); return; }
    setSaving(true); setError(null);
    try {
      await axios.post("/api/admin/programa-competencias", {
        programaFormacionIdProgramaFormacion: Number.parseInt(programaId, 10),
        cursoCompetenciaIdCurso: Number.parseInt(competenciaId, 10)
      });
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
        <form onSubmit={(e) => void submit(e)}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="asig-prog">Programa</label>
              <select id="asig-prog" className={styles.select} value={programaId} onChange={(e) => setProgramaId(e.target.value)}>
                <option value="">Seleccione</option>
                {programas.map((p) => <option key={p.idProgramaFormacion} value={String(p.idProgramaFormacion)}>{p.nombrePrograma}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="asig-comp">Competencia</label>
              <select id="asig-comp" className={styles.select} value={competenciaId} onChange={(e) => setCompetenciaId(e.target.value)}>
                <option value="">Seleccione</option>
                {competencias.map((c) => <option key={c.idCurso} value={String(c.idCurso)}>{c.nombreCurso}</option>)}
              </select>
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
