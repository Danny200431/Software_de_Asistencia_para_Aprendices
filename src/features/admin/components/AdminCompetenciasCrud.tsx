"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
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

  const resetForm = () => {
    setEditingId(null); setNombre(""); setNivel(""); setDuracion("");
    setInstructorId(instructores[0] ? String(instructores[0].usuarioIdUsuario) : "");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !duracion.trim() || !instructorId) { setError("Complete campos obligatorios"); return; }
    setSaving(true); setError(null);
    try {
      const payload = { nombreCurso: nombre, nivelFormacion: nivel || null, duracion, idUsuario: instructorId };
      if (editingId != null) await axios.put(`/api/admin/competencias/${editingId}`, payload);
      else await axios.post("/api/admin/competencias", payload);
      resetForm(); await load();
    } catch (err) {
      setError(axios.isAxiosError(err) && typeof err.response?.data?.error === "string" ? err.response.data.error : "No se pudo guardar");
    } finally { setSaving(false); }
  };

  const startEdit = (c: Competencia) => {
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
        <form onSubmit={(e) => void submit(e)}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="comp-nombre">Nombre</label>
              <input id="comp-nombre" className={styles.input} value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={45} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="comp-nivel">Nivel</label>
              <input id="comp-nivel" className={styles.input} value={nivel} onChange={(e) => setNivel(e.target.value)} maxLength={45} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="comp-dur">Duracion</label>
              <input id="comp-dur" className={styles.input} value={duracion} onChange={(e) => setDuracion(e.target.value)} maxLength={45} placeholder="120 horas" />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="comp-inst">Instructor</label>
              <select id="comp-inst" className={styles.select} value={instructorId} onChange={(e) => setInstructorId(e.target.value)}>
                <option value="">Seleccione</option>
                {instructores.map((i) => <option key={i.usuarioIdUsuario} value={String(i.usuarioIdUsuario)}>{i.usuario.nombre} {i.usuario.apellido}</option>)}
              </select>
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
