"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import styles from "@/src/features/instructor/components/InstructorGestion.module.css";

type AprendizOpt = { idUsuario: number; nombre: string; apellido: string; rolIdRol: number };
type Programa = {
  idProgramaFormacion: number;
  nombrePrograma: string;
  nivelFormacion: string;
  usuarioIdAprendiz: number;
  usuarioRolIdRol: number;
  usuario: { idUsuario: number; nombre: string; apellido: string };
};

export function AdminProgramasCrud() {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [aprendices, setAprendices] = useState<AprendizOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState("");
  const [aprendizKey, setAprendizKey] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await axios.get<{ ok: boolean; programas?: Programa[]; aprendices?: AprendizOpt[]; error?: string }>("/api/admin/programas");
      if (!data.ok) { setError(data.error ?? "Error al cargar"); return; }
      setProgramas(data.programas ?? []);
      setAprendices(data.aprendices ?? []);
    } catch { setError("Error al cargar programas"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!loading && editingId == null && aprendizKey === "" && aprendices[0]) {
      setAprendizKey(`${aprendices[0].idUsuario}-${aprendices[0].rolIdRol}`);
    }
  }, [loading, editingId, aprendices, aprendizKey]);

  const resetForm = () => {
    setEditingId(null); setNombre(""); setNivel("");
    setAprendizKey(aprendices[0] ? `${aprendices[0].idUsuario}-${aprendices[0].rolIdRol}` : "");
  };

  const parseAprendiz = () => {
    const [uid, rid] = aprendizKey.split("-");
    const u = Number.parseInt(uid ?? "", 10);
    const r = Number.parseInt(rid ?? "", 10);
    return Number.isFinite(u) && Number.isFinite(r) ? { usuarioIdAprendiz: u, usuarioRolIdRol: r } : null;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !nivel.trim()) { setError("Complete nombre y nivel"); return; }
    const ap = parseAprendiz();
    if (!ap) { setError("Seleccione aprendiz referente"); return; }
    setSaving(true); setError(null);
    try {
      const payload = { nombrePrograma: nombre, nivelFormacion: nivel, ...ap };
      if (editingId != null) await axios.put(`/api/admin/programas/${editingId}`, payload);
      else await axios.post("/api/admin/programas", payload);
      resetForm(); await load();
    } catch (err) {
      setError(axios.isAxiosError(err) && typeof err.response?.data?.error === "string" ? err.response.data.error : "No se pudo guardar");
    } finally { setSaving(false); }
  };

  const startEdit = (p: Programa) => {
    setEditingId(p.idProgramaFormacion); setNombre(p.nombrePrograma); setNivel(p.nivelFormacion);
    setAprendizKey(`${p.usuarioIdAprendiz}-${p.usuarioRolIdRol}`);
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
      <p className={styles.subtitle}>Catalogo de programas del SENA.</p>
      <section className={styles.formPanel}>
        <h2 className={styles.formTitle}>{editingId != null ? `Editar programa #${editingId}` : "Nuevo programa"}</h2>
        <form onSubmit={(e) => void submit(e)}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="prog-nombre">Nombre</label>
              <input id="prog-nombre" className={styles.input} value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={45} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="prog-nivel">Nivel</label>
              <input id="prog-nivel" className={styles.input} value={nivel} onChange={(e) => setNivel(e.target.value)} maxLength={45} placeholder="Tecnologo, Tecnico..." />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="prog-aprendiz">Aprendiz referente</label>
              <select id="prog-aprendiz" className={styles.select} value={aprendizKey} onChange={(e) => setAprendizKey(e.target.value)}>
                <option value="">Seleccione</option>
                {aprendices.map((a) => <option key={`${a.idUsuario}-${a.rolIdRol}`} value={`${a.idUsuario}-${a.rolIdRol}`}>{a.nombre} {a.apellido}</option>)}
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
            <thead><tr><th>ID</th><th>Nombre</th><th>Nivel</th><th>Referente</th><th>Acciones</th></tr></thead>
            <tbody>
              {programas.length === 0 ? <tr><td colSpan={5} style={{ color: "#6b7280" }}>Sin registros</td></tr> :
                programas.map((p) => (
                  <tr key={p.idProgramaFormacion}>
                    <td>{p.idProgramaFormacion}</td><td>{p.nombrePrograma}</td><td>{p.nivelFormacion}</td>
                    <td>{p.usuario.nombre} {p.usuario.apellido}</td>
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
