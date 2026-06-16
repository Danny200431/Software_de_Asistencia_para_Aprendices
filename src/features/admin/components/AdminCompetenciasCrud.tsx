"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { AdminFieldError } from "@/src/features/admin/components/AdminFieldError";
import { fieldInputClass, focusFirstInvalidField } from "@/src/features/admin/lib/adminFormUi";
import {
  hasCompetenciaFormErrors,
  validateCompetenciaForm,
  type CompetenciaFormErrors,
  type CompetenciaFormField
} from "@/src/features/admin/lib/validateCompetenciaForm";
import styles from "@/src/features/instructor/components/InstructorGestion.module.css";

type InstructorOpt = { usuarioIdUsuario: number; usuario: { idUsuario: number; nombre: string; apellido: string } };
type Competencia = {
  idCurso: number;
  nombreCurso: string;
  nivelFormacion: string | null;
  duracion: string;
  idUsuario: string;
  programasCursos: { programaFormacion: { idProgramaFormacion: number; nombrePrograma: string } }[];
};

export function AdminCompetenciasCrud() {
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [instructores, setInstructores] = useState<InstructorOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState("");
  const [duracion, setDuracion] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<CompetenciaFormErrors>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await axios.get<{ ok: boolean; competencias?: Competencia[]; instructores?: InstructorOpt[]; error?: string }>("/api/admin/competencias");
      if (!data.ok) { setError(data.error ?? "Error al cargar"); return; }
      setCompetencias(data.competencias ?? []);
      setInstructores(data.instructores ?? []);
    } catch { setError("Error al cargar competencias"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!loading && editingId == null && instructorId === "" && instructores[0]) {
      setInstructorId(String(instructores[0].usuarioIdUsuario));
    }
  }, [loading, editingId, instructores, instructorId]);

  const showFieldError = (field: CompetenciaFormField) => (formSubmitted ? fieldErrors[field] : undefined);
  const clearFieldError = (field: CompetenciaFormField) => {
    if (!formSubmitted) return;
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const resetForm = () => {
    setEditingId(null); setNombre(""); setNivel(""); setDuracion("");
    setInstructorId(instructores[0] ? String(instructores[0].usuarioIdUsuario) : "");
    setFieldErrors({}); setFormSubmitted(false); setError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    const errors = validateCompetenciaForm(
      { nombreCurso: nombre, nivelFormacion: nivel, duracion, instructorId },
      { hasInstructores: instructores.length > 0 }
    );
    setFieldErrors(errors);
    if (hasCompetenciaFormErrors(errors)) { focusFirstInvalidField(); return; }
    setSaving(true); setError(null);
    try {
      const payload = {
        nombreCurso: nombre.trim(),
        nivelFormacion: nivel.trim() || null,
        duracion: duracion.trim(),
        idUsuario: instructorId
      };
      if (editingId != null) await axios.put(`/api/admin/competencias/${editingId}`, payload);
      else await axios.post("/api/admin/competencias", payload);
      resetForm(); await load();
    } catch (err) {
      setError(axios.isAxiosError(err) && typeof err.response?.data?.error === "string" ? err.response.data.error : "No se pudo guardar");
    } finally { setSaving(false); }
  };

  const startEdit = (c: Competencia) => {
    setFieldErrors({}); setFormSubmitted(false); setError(null);
    setEditingId(c.idCurso); setNombre(c.nombreCurso); setNivel(c.nivelFormacion ?? "");
    setDuracion(c.duracion); setInstructorId(c.idUsuario);
  };

  const remove = async (id: number) => {
    if (!globalThis.confirm("Eliminar esta competencia?")) return;
    try {
      await axios.delete(`/api/admin/competencias/${id}`);
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(axios.isAxiosError(err) && typeof err.response?.data?.error === "string" ? err.response.data.error : "No se pudo eliminar");
    }
  };

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Competencias</h1>
      <p className={styles.subtitle}>Gestionar competencias / cursos del catalogo.</p>
      <section className={styles.formPanel}>
        <h2 className={styles.formTitle}>{editingId != null ? `Editar competencia #${editingId}` : "Nueva competencia"}</h2>
        <form noValidate onSubmit={(e) => void submit(e)}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="comp-nombre">Nombre</label>
              <input
                id="comp-nombre"
                className={fieldInputClass(!!showFieldError("nombreCurso"), styles.input)}
                value={nombre}
                onChange={(e) => { setNombre(e.target.value); clearFieldError("nombreCurso"); }}
                maxLength={45}
                aria-invalid={showFieldError("nombreCurso") ? true : undefined}
                aria-describedby={showFieldError("nombreCurso") ? "comp-nombre-error" : undefined}
              />
              <AdminFieldError id="comp-nombre-error" message={showFieldError("nombreCurso")} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="comp-nivel">Nivel (opcional)</label>
              <input
                id="comp-nivel"
                className={fieldInputClass(!!showFieldError("nivelFormacion"), styles.input)}
                value={nivel}
                onChange={(e) => { setNivel(e.target.value); clearFieldError("nivelFormacion"); }}
                maxLength={45}
                aria-invalid={showFieldError("nivelFormacion") ? true : undefined}
                aria-describedby={showFieldError("nivelFormacion") ? "comp-nivel-error" : undefined}
              />
              <AdminFieldError id="comp-nivel-error" message={showFieldError("nivelFormacion")} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="comp-dur">Duracion</label>
              <input
                id="comp-dur"
                className={fieldInputClass(!!showFieldError("duracion"), styles.input)}
                value={duracion}
                onChange={(e) => { setDuracion(e.target.value); clearFieldError("duracion"); }}
                maxLength={45}
                placeholder="120 horas"
                aria-invalid={showFieldError("duracion") ? true : undefined}
                aria-describedby={showFieldError("duracion") ? "comp-dur-error" : undefined}
              />
              <AdminFieldError id="comp-dur-error" message={showFieldError("duracion")} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="comp-inst">Instructor</label>
              <select
                id="comp-inst"
                className={fieldInputClass(!!showFieldError("instructorId"), styles.select, styles.selectInvalid)}
                value={instructorId}
                onChange={(e) => { setInstructorId(e.target.value); clearFieldError("instructorId"); }}
                aria-invalid={showFieldError("instructorId") ? true : undefined}
                aria-describedby={showFieldError("instructorId") ? "comp-inst-error" : undefined}
              >
                <option value="">Seleccione</option>
                {instructores.map((i) => <option key={i.usuarioIdUsuario} value={String(i.usuarioIdUsuario)}>{i.usuario.nombre} {i.usuario.apellido}</option>)}
              </select>
              <AdminFieldError id="comp-inst-error" message={showFieldError("instructorId")} />
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
            <thead><tr><th>ID</th><th>Nombre</th><th>Nivel</th><th>Duracion</th><th>Programa</th><th>Acciones</th></tr></thead>
            <tbody>
              {competencias.length === 0 ? <tr><td colSpan={6} style={{ color: "#6b7280" }}>Sin registros</td></tr> :
                competencias.map((c) => (
                  <tr key={c.idCurso}>
                    <td>{c.idCurso}</td><td>{c.nombreCurso}</td><td>{c.nivelFormacion ?? "—"}</td><td>{c.duracion}</td>
                    <td>{c.programasCursos[0]?.programaFormacion.nombrePrograma ?? "Sin asignar"}</td>
                    <td><div className={styles.rowActions}>
                      <button type="button" className={styles.rowBtn} onClick={() => startEdit(c)}>Editar</button>
                      <button type="button" className={`${styles.rowBtn} ${styles.rowBtnDanger}`} onClick={() => void remove(c.idCurso)}>Eliminar</button>
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
