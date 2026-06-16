"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  hasFichaFormErrors,
  parseAprendizFromKey,
  validateFichaForm,
  type FichaFormErrors,
  type FichaFormField,
  type FichaFormValues
} from "@/src/features/instructor/lib/validateFichaForm";
import styles from "@/src/features/instructor/components/InstructorGestion.module.css";

type UsuarioMini = { idUsuario: number; nombre: string; apellido: string; rolIdRol: number };
type ProgramaOpt = { idProgramaFormacion: number; nombrePrograma: string };
type FichaRow = {
  idFicha: number;
  numeroFicha: string | null;
  idProgramaFormacion: string | null;
  programaNombre: string | null;
  usuario: UsuarioMini;
};

function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <div className={styles.fieldErrorSlot}>
      {message ? <p id={id} className={styles.fieldError} role="alert">{message}</p> : null}
    </div>
  );
}

export function AdminFichasCrud() {
  const [fichas, setFichas] = useState<FichaRow[]>([]);
  const [programas, setProgramas] = useState<ProgramaOpt[]>([]);
  const [aprendices, setAprendices] = useState<UsuarioMini[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [numeroFicha, setNumeroFicha] = useState("");
  const [programaId, setProgramaId] = useState("");
  const [aprendizKey, setAprendizKey] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FichaFormErrors>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  const load = useCallback(async () => {
    setError(null); setLoading(true);
    try {
      const { data } = await axios.get<{ ok: boolean; fichas?: FichaRow[]; programas?: ProgramaOpt[]; aprendices?: UsuarioMini[]; error?: string }>("/api/admin/fichas");
      if (!data.ok) { setError(data.error ?? "No se pudieron cargar los datos"); return; }
      setFichas(data.fichas ?? []); setProgramas(data.programas ?? []); setAprendices(data.aprendices ?? []);
    } catch { setError("No se pudieron cargar los datos"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const resetForm = () => {
    setEditingId(null); setNumeroFicha("");
    setProgramaId(programas[0] ? String(programas[0].idProgramaFormacion) : "");
    setAprendizKey(aprendices[0] ? `${aprendices[0].idUsuario}-${aprendices[0].rolIdRol}` : "");
    setFieldErrors({}); setFormSubmitted(false);
  };

  const getFormValues = (): FichaFormValues => ({ numeroFicha, programaId, aprendizKey, editingId });
  const showFieldError = (field: FichaFormField) => formSubmitted ? fieldErrors[field] : undefined;
  const inputClass = (field: FichaFormField, base: string) => showFieldError(field) ? `${base} ${styles.inputInvalid}` : base;

  useEffect(() => {
    if (loading || editingId != null) return;
    if (programaId === "" && programas[0]) setProgramaId(String(programas[0].idProgramaFormacion));
    if (aprendizKey === "" && aprendices[0]) setAprendizKey(`${aprendices[0].idUsuario}-${aprendices[0].rolIdRol}`);
  }, [loading, editingId, programas, aprendices, programaId, aprendizKey]);

  const startEdit = (f: FichaRow) => {
    setFieldErrors({}); setFormSubmitted(false); setEditingId(f.idFicha);
    setNumeroFicha(f.numeroFicha ?? "");
    setProgramaId(f.idProgramaFormacion ?? "");
    setAprendizKey(`${f.usuario.idUsuario}-${f.usuario.rolIdRol}`);
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault(); setError(null); setFormSubmitted(true);
    const errors = validateFichaForm(getFormValues(), { hasProgramas: programas.length > 0, hasAprendices: aprendices.length > 0 });
    setFieldErrors(errors);
    if (hasFichaFormErrors(errors)) return;
    setSaving(true);
    try {
      if (editingId != null) {
        await axios.put(`/api/admin/fichas/${editingId}`, { numeroFicha: numeroFicha.trim(), idProgramaFormacion: programaId.trim() });
      } else {
        const ap = parseAprendizFromKey(aprendizKey);
        if (!ap) { setFieldErrors({ aprendizKey: "Seleccione un aprendiz valido" }); setSaving(false); return; }
        await axios.post("/api/admin/fichas", { numeroFicha: numeroFicha.trim(), idProgramaFormacion: programaId.trim(), ...ap });
      }
      resetForm(); await load();
    } catch (err) {
      setError(axios.isAxiosError(err) && typeof err.response?.data?.error === "string" ? err.response.data.error : "No se pudo guardar la ficha");
    } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!globalThis.confirm("Eliminar esta ficha, sus clases y asistencias vinculadas?")) return;
    try {
      await axios.delete(`/api/admin/fichas/${id}`);
      if (editingId === id) resetForm();
      await load();
    } catch { setError("No se pudo eliminar la ficha"); }
  };

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Gestion de fichas</h1>
      <p className={styles.subtitle}>Crear, editar y eliminar fichas de formacion.</p>
      <section className={styles.formPanel}>
        <h2 className={styles.formTitle}>{editingId != null ? `Editar ficha #${editingId}` : "Nueva ficha"}</h2>
        <form noValidate onSubmit={(e) => void submit(e)}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="ficha-numero">Numero de ficha</label>
              <input id="ficha-numero" className={inputClass("numeroFicha", styles.input)} value={numeroFicha} onChange={(e) => setNumeroFicha(e.target.value)} maxLength={45} />
              <FieldError id="ficha-numero-error" message={showFieldError("numeroFicha")} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="ficha-programa">Programa</label>
              <select id="ficha-programa" className={inputClass("programaId", styles.select)} value={programaId} onChange={(e) => setProgramaId(e.target.value)}>
                <option value="">Seleccione</option>
                {programas.map((p) => <option key={p.idProgramaFormacion} value={String(p.idProgramaFormacion)}>{p.nombrePrograma}</option>)}
              </select>
              <FieldError id="ficha-programa-error" message={showFieldError("programaId")} />
            </div>
            {editingId == null ? (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ficha-aprendiz">Aprendiz</label>
                <select id="ficha-aprendiz" className={inputClass("aprendizKey", styles.select)} value={aprendizKey} onChange={(e) => setAprendizKey(e.target.value)}>
                  <option value="">Seleccione</option>
                  {aprendices.map((u) => <option key={`${u.idUsuario}-${u.rolIdRol}`} value={`${u.idUsuario}-${u.rolIdRol}`}>{u.nombre} {u.apellido}</option>)}
                </select>
                <FieldError id="ficha-aprendiz-error" message={showFieldError("aprendizKey")} />
              </div>
            ) : null}
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
            <thead><tr><th>ID</th><th>Numero</th><th>Programa</th><th>Aprendiz</th><th>Acciones</th></tr></thead>
            <tbody>
              {fichas.length === 0 ? <tr><td colSpan={5} style={{ color: "#6b7280" }}>Sin fichas</td></tr> :
                fichas.map((f) => (
                  <tr key={f.idFicha}>
                    <td>{f.idFicha}</td><td>{f.numeroFicha ?? "—"}</td>
                    <td>{f.programaNombre ?? f.idProgramaFormacion ?? "—"}</td>
                    <td>{f.usuario.nombre} {f.usuario.apellido}</td>
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
