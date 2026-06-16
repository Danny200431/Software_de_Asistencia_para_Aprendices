"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { AdminFieldError } from "@/src/features/admin/components/AdminFieldError";
import { fieldInputClass, focusFirstInvalidField } from "@/src/features/admin/lib/adminFormUi";
import {
  hasInstructorFichaFormErrors,
  validateInstructorFichaForm,
  type InstructorFichaFormErrors,
  type InstructorFichaFormField
} from "@/src/features/admin/lib/validateInstructorFichaForm";
import styles from "@/src/features/instructor/components/InstructorGestion.module.css";

type Asignacion = {
  fichaIdFicha: number;
  usuarioIdUsuario: number;
  instructor: { usuario: { idUsuario: number; nombre: string; apellido: string } };
  ficha: { idFicha: number; numeroFicha: string | null; programaNombre?: string | null };
};
type InstructorOpt = { usuarioIdUsuario: number; usuario: { idUsuario: number; nombre: string; apellido: string } };
type FichaOpt = { idFicha: number; numeroFicha: string | null; programaNombre: string | null };

export function AdminInstructorFichasCrud() {
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [instructores, setInstructores] = useState<InstructorOpt[]>([]);
  const [fichas, setFichas] = useState<FichaOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fichaId, setFichaId] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<InstructorFichaFormErrors>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await axios.get<{ ok: boolean; asignaciones?: Asignacion[]; instructores?: InstructorOpt[]; fichas?: FichaOpt[]; error?: string }>("/api/admin/instructor-fichas");
      if (!data.ok) { setError(data.error ?? "Error al cargar"); return; }
      setAsignaciones(data.asignaciones ?? []);
      setInstructores(data.instructores ?? []);
      setFichas(data.fichas ?? []);
    } catch { setError("Error al cargar asignaciones"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!loading && fichaId === "" && fichas[0]) setFichaId(String(fichas[0].idFicha));
    if (!loading && instructorId === "" && instructores[0]) setInstructorId(String(instructores[0].usuarioIdUsuario));
  }, [loading, fichas, instructores, fichaId, instructorId]);

  const showFieldError = (field: InstructorFichaFormField) => (formSubmitted ? fieldErrors[field] : undefined);
  const clearFieldError = (field: InstructorFichaFormField) => {
    if (!formSubmitted) return;
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    const errors = validateInstructorFichaForm(
      { fichaId, instructorId },
      { hasFichas: fichas.length > 0, hasInstructores: instructores.length > 0 }
    );
    setFieldErrors(errors);
    if (hasInstructorFichaFormErrors(errors)) { focusFirstInvalidField(); return; }
    setSaving(true); setError(null);
    try {
      await axios.post("/api/admin/instructor-fichas", {
        fichaIdFicha: Number.parseInt(fichaId, 10),
        usuarioIdUsuario: Number.parseInt(instructorId, 10)
      });
      setFormSubmitted(false);
      setFieldErrors({});
      await load();
    } catch (err) {
      setError(axios.isAxiosError(err) && typeof err.response?.data?.error === "string" ? err.response.data.error : "No se pudo asignar");
    } finally { setSaving(false); }
  };

  const remove = async (fId: number, uId: number) => {
    if (!globalThis.confirm("Quitar esta asignacion?")) return;
    try {
      await axios.delete("/api/admin/instructor-fichas", { data: { fichaIdFicha: fId, usuarioIdUsuario: uId } });
      await load();
    } catch (err) {
      setError(axios.isAxiosError(err) && typeof err.response?.data?.error === "string" ? err.response.data.error : "No se pudo desasignar");
    }
  };

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Asignar fichas a instructores</h1>
      <p className={styles.subtitle}>Vincule instructores con las fichas que gestionan.</p>
      <section className={styles.formPanel}>
        <h2 className={styles.formTitle}>Nueva asignacion</h2>
        <form noValidate onSubmit={(e) => void submit(e)}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="if-ficha">Ficha</label>
              <select
                id="if-ficha"
                className={fieldInputClass(!!showFieldError("fichaId"), styles.select, styles.selectInvalid)}
                value={fichaId}
                onChange={(e) => { setFichaId(e.target.value); clearFieldError("fichaId"); }}
                aria-invalid={showFieldError("fichaId") ? true : undefined}
                aria-describedby={showFieldError("fichaId") ? "if-ficha-error" : undefined}
              >
                <option value="">Seleccione</option>
                {fichas.map((f) => <option key={f.idFicha} value={String(f.idFicha)}>{f.numeroFicha ?? f.idFicha} — {f.programaNombre ?? "Sin programa"}</option>)}
              </select>
              <AdminFieldError id="if-ficha-error" message={showFieldError("fichaId")} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="if-inst">Instructor</label>
              <select
                id="if-inst"
                className={fieldInputClass(!!showFieldError("instructorId"), styles.select, styles.selectInvalid)}
                value={instructorId}
                onChange={(e) => { setInstructorId(e.target.value); clearFieldError("instructorId"); }}
                aria-invalid={showFieldError("instructorId") ? true : undefined}
                aria-describedby={showFieldError("instructorId") ? "if-inst-error" : undefined}
              >
                <option value="">Seleccione</option>
                {instructores.map((i) => <option key={i.usuarioIdUsuario} value={String(i.usuarioIdUsuario)}>{i.usuario.nombre} {i.usuario.apellido}</option>)}
              </select>
              <AdminFieldError id="if-inst-error" message={showFieldError("instructorId")} />
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
            <thead><tr><th>Ficha</th><th>Programa</th><th>Instructor</th><th>Acciones</th></tr></thead>
            <tbody>
              {asignaciones.length === 0 ? <tr><td colSpan={4} style={{ color: "#6b7280" }}>Sin asignaciones</td></tr> :
                asignaciones.map((a) => (
                  <tr key={`${a.fichaIdFicha}-${a.usuarioIdUsuario}`}>
                    <td>{a.ficha.numeroFicha ?? a.fichaIdFicha}</td>
                    <td>{a.ficha.programaNombre ?? "—"}</td>
                    <td>{a.instructor.usuario.nombre} {a.instructor.usuario.apellido}</td>
                    <td>
                      <button type="button" className={`${styles.rowBtn} ${styles.rowBtnDanger}`} onClick={() => void remove(a.fichaIdFicha, a.usuarioIdUsuario)}>Quitar</button>
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
