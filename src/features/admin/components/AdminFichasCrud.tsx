"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { AdminFieldError } from "@/src/features/admin/components/AdminFieldError";
import { fieldInputClass, focusFirstInvalidField } from "@/src/features/admin/lib/adminFormUi";
import {
  hasFichaFormErrors,
  validateFichaForm,
  type FichaFormErrors,
  type FichaFormField
} from "@/src/features/instructor/lib/validateFichaForm";
import styles from "@/src/features/instructor/components/InstructorGestion.module.css";

type ProgramaOpt = { idProgramaFormacion: number; nombrePrograma: string };
type FichaRow = {
  idFicha: number;
  numeroFicha: string | null;
  idProgramaFormacion: string | null;
  programaNombre: string | null;
  aprendicesCount: number;
};

export function AdminFichasCrud() {
  const [fichas, setFichas] = useState<FichaRow[]>([]);
  const [programas, setProgramas] = useState<ProgramaOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [numeroFicha, setNumeroFicha] = useState("");
  const [programaId, setProgramaId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FichaFormErrors>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  const load = useCallback(async () => {
    setError(null); setLoading(true);
    try {
      const { data } = await axios.get<{ ok: boolean; fichas?: FichaRow[]; programas?: ProgramaOpt[]; error?: string }>("/api/admin/fichas");
      if (!data.ok) { setError(data.error ?? "No se pudieron cargar los datos"); return; }
      setFichas(data.fichas ?? []);
      setProgramas(data.programas ?? []);
    } catch { setError("No se pudieron cargar los datos"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const resetForm = () => {
    setEditingId(null); setNumeroFicha("");
    setProgramaId(programas[0] ? String(programas[0].idProgramaFormacion) : "");
    setFieldErrors({}); setFormSubmitted(false); setError(null);
  };

  const showFieldError = (field: FichaFormField) => (formSubmitted ? fieldErrors[field] : undefined);
  const clearFieldError = (field: FichaFormField) => {
    if (!formSubmitted) return;
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  useEffect(() => {
    if (loading || editingId != null) return;
    if (programaId === "" && programas[0]) setProgramaId(String(programas[0].idProgramaFormacion));
  }, [loading, editingId, programas, programaId]);

  const startEdit = (f: FichaRow) => {
    setFieldErrors({}); setFormSubmitted(false); setError(null);
    setEditingId(f.idFicha);
    setNumeroFicha(f.numeroFicha ?? "");
    setProgramaId(f.idProgramaFormacion ?? "");
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault(); setError(null); setFormSubmitted(true);
    const errors = validateFichaForm(
      { numeroFicha, programaId, editingId },
      { hasProgramas: programas.length > 0 }
    );
    setFieldErrors(errors);
    if (hasFichaFormErrors(errors)) { focusFirstInvalidField(); return; }
    setSaving(true);
    try {
      const payload = { numeroFicha: numeroFicha.trim(), idProgramaFormacion: programaId.trim() };
      if (editingId != null) {
        await axios.put(`/api/admin/fichas/${editingId}`, payload);
      } else {
        await axios.post("/api/admin/fichas", payload);
      }
      resetForm(); await load();
    } catch (err) {
      setError(axios.isAxiosError(err) && typeof err.response?.data?.error === "string" ? err.response.data.error : "No se pudo guardar la ficha");
    } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!globalThis.confirm("Eliminar esta ficha y sus clases vinculadas?")) return;
    setError(null);
    try {
      await axios.delete(`/api/admin/fichas/${id}`);
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(axios.isAxiosError(err) && typeof err.response?.data?.error === "string" ? err.response.data.error : "No se pudo eliminar la ficha");
    }
  };

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Gestion de fichas</h1>
      <p className={styles.subtitle}>
        Crear y administrar fichas de formacion. Los aprendices eligen su ficha desde el modulo de aprendices.
      </p>
      <section className={styles.formPanel}>
        <h2 className={styles.formTitle}>{editingId != null ? `Editar ficha #${editingId}` : "Nueva ficha"}</h2>
        <form noValidate onSubmit={(e) => void submit(e)}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="ficha-numero">Numero de ficha</label>
              <input
                id="ficha-numero"
                className={fieldInputClass(!!showFieldError("numeroFicha"), styles.input)}
                value={numeroFicha}
                onChange={(e) => { setNumeroFicha(e.target.value); clearFieldError("numeroFicha"); }}
                maxLength={45}
                placeholder="Ej. 287001"
                aria-invalid={showFieldError("numeroFicha") ? true : undefined}
                aria-describedby={showFieldError("numeroFicha") ? "ficha-numero-error" : undefined}
              />
              <AdminFieldError id="ficha-numero-error" message={showFieldError("numeroFicha")} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="ficha-programa">Programa</label>
              <select
                id="ficha-programa"
                className={fieldInputClass(!!showFieldError("programaId"), styles.select, styles.selectInvalid)}
                value={programaId}
                onChange={(e) => { setProgramaId(e.target.value); clearFieldError("programaId"); }}
                aria-invalid={showFieldError("programaId") ? true : undefined}
                aria-describedby={showFieldError("programaId") ? "ficha-programa-error" : undefined}
              >
                <option value="">Seleccione</option>
                {programas.map((p) => <option key={p.idProgramaFormacion} value={String(p.idProgramaFormacion)}>{p.nombrePrograma}</option>)}
              </select>
              <AdminFieldError id="ficha-programa-error" message={showFieldError("programaId")} />
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving}>{editingId != null ? "Guardar" : "Crear"}</button>
            {editingId != null && <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={resetForm}>Cancelar</button>}
          </div>
          {error && <p className={styles.error} role="alert">{error}</p>}
        </form>
      </section>
      {loading ? <p className={styles.loadingMuted}>Cargando...</p> : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>ID</th><th>Numero</th><th>Programa</th><th>Aprendices</th><th>Acciones</th></tr></thead>
            <tbody>
              {fichas.length === 0 ? <tr><td colSpan={5} style={{ color: "#6b7280" }}>Sin fichas</td></tr> :
                fichas.map((f) => (
                  <tr key={f.idFicha}>
                    <td>{f.idFicha}</td>
                    <td>{f.numeroFicha ?? "—"}</td>
                    <td>{f.programaNombre ?? f.idProgramaFormacion ?? "—"}</td>
                    <td>{f.aprendicesCount}</td>
                    <td><div className={styles.rowActions}>
                      <button type="button" className={styles.rowBtn} onClick={() => startEdit(f)}>Editar</button>
                      <button type="button" className={`${styles.rowBtn} ${styles.rowBtnDanger}`} onClick={() => void remove(f.idFicha)}>Eliminar</button>
                    </div></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
