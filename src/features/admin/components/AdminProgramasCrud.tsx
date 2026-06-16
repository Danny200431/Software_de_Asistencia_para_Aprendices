"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { AdminFieldError } from "@/src/features/admin/components/AdminFieldError";
import { fieldInputClass, focusFirstInvalidField } from "@/src/features/admin/lib/adminFormUi";
import {
  hasProgramaFormErrors,
  validateProgramaForm,
  type ProgramaFormErrors,
  type ProgramaFormField
} from "@/src/features/admin/lib/validateProgramaForm";
import styles from "@/src/features/instructor/components/InstructorGestion.module.css";

type Programa = {
  idProgramaFormacion: number;
  nombrePrograma: string;
  nivelFormacion: string;
  fichasCount: number;
};

export function AdminProgramasCrud() {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ProgramaFormErrors>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await axios.get<{ ok: boolean; programas?: Programa[]; error?: string }>("/api/admin/programas");
      if (!data.ok) { setError(data.error ?? "Error al cargar"); return; }
      setProgramas(data.programas ?? []);
    } catch { setError("Error al cargar programas"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const showFieldError = (field: ProgramaFormField) => (formSubmitted ? fieldErrors[field] : undefined);
  const clearFieldError = (field: ProgramaFormField) => {
    if (!formSubmitted) return;
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const resetForm = () => {
    setEditingId(null); setNombre(""); setNivel("");
    setFieldErrors({}); setFormSubmitted(false); setError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    const errors = validateProgramaForm({ nombrePrograma: nombre, nivelFormacion: nivel });
    setFieldErrors(errors);
    if (hasProgramaFormErrors(errors)) { focusFirstInvalidField(); return; }
    setSaving(true); setError(null);
    try {
      const payload = { nombrePrograma: nombre.trim(), nivelFormacion: nivel.trim() };
      if (editingId != null) await axios.put(`/api/admin/programas/${editingId}`, payload);
      else await axios.post("/api/admin/programas", payload);
      resetForm(); await load();
    } catch (err) {
      setError(axios.isAxiosError(err) && typeof err.response?.data?.error === "string" ? err.response.data.error : "No se pudo guardar");
    } finally { setSaving(false); }
  };

  const startEdit = (p: Programa) => {
    setFieldErrors({}); setFormSubmitted(false); setError(null);
    setEditingId(p.idProgramaFormacion); setNombre(p.nombrePrograma); setNivel(p.nivelFormacion);
  };

  const remove = async (id: number) => {
    if (!globalThis.confirm("Eliminar este programa?")) return;
    try {
      await axios.delete(`/api/admin/programas/${id}`);
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(axios.isAxiosError(err) && typeof err.response?.data?.error === "string" ? err.response.data.error : "No se pudo eliminar");
    }
  };

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Programas de formacion</h1>
      <p className={styles.subtitle}>Catalogo de programas del SENA. Las fichas se vinculan al programa desde el modulo de fichas.</p>
      <section className={styles.formPanel}>
        <h2 className={styles.formTitle}>{editingId != null ? `Editar programa #${editingId}` : "Nuevo programa"}</h2>
        <form noValidate onSubmit={(e) => void submit(e)}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="prog-nombre">Nombre</label>
              <input
                id="prog-nombre"
                className={fieldInputClass(!!showFieldError("nombrePrograma"), styles.input)}
                value={nombre}
                onChange={(e) => { setNombre(e.target.value); clearFieldError("nombrePrograma"); }}
                maxLength={45}
                aria-invalid={showFieldError("nombrePrograma") ? true : undefined}
                aria-describedby={showFieldError("nombrePrograma") ? "prog-nombre-error" : undefined}
              />
              <AdminFieldError id="prog-nombre-error" message={showFieldError("nombrePrograma")} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="prog-nivel">Nivel</label>
              <input
                id="prog-nivel"
                className={fieldInputClass(!!showFieldError("nivelFormacion"), styles.input)}
                value={nivel}
                onChange={(e) => { setNivel(e.target.value); clearFieldError("nivelFormacion"); }}
                maxLength={45}
                placeholder="Tecnologo, Tecnico..."
                aria-invalid={showFieldError("nivelFormacion") ? true : undefined}
                aria-describedby={showFieldError("nivelFormacion") ? "prog-nivel-error" : undefined}
              />
              <AdminFieldError id="prog-nivel-error" message={showFieldError("nivelFormacion")} />
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
            <thead><tr><th>ID</th><th>Nombre</th><th>Nivel</th><th>Fichas</th><th>Acciones</th></tr></thead>
            <tbody>
              {programas.length === 0 ? <tr><td colSpan={5} style={{ color: "#6b7280" }}>Sin registros</td></tr> :
                programas.map((p) => (
                  <tr key={p.idProgramaFormacion}>
                    <td>{p.idProgramaFormacion}</td>
                    <td>{p.nombrePrograma}</td>
                    <td>{p.nivelFormacion}</td>
                    <td>{p.fichasCount}</td>
                    <td><div className={styles.rowActions}>
                      <button type="button" className={styles.rowBtn} onClick={() => startEdit(p)}>Editar</button>
                      <button type="button" className={`${styles.rowBtn} ${styles.rowBtnDanger}`} onClick={() => void remove(p.idProgramaFormacion)}>Eliminar</button>
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
