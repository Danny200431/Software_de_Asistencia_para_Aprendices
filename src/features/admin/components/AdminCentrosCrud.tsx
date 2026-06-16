"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import styles from "@/src/features/instructor/components/InstructorGestion.module.css";

type Centro = { idCentroDeFormacion: number; ciudad: string; dirreccion: string };

export function AdminCentrosCrud() {
  const [centros, setCentros] = useState<Centro[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [ciudad, setCiudad] = useState("");
  const [dirreccion, setDirreccion] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get<{ ok: boolean; centros?: Centro[]; error?: string }>("/api/admin/centros");
      if (!data.ok) { setError(data.error ?? "Error al cargar"); return; }
      setCentros(data.centros ?? []);
    } catch { setError("Error al cargar centros"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const resetForm = () => { setEditingId(null); setCiudad(""); setDirreccion(""); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ciudad.trim() || !dirreccion.trim()) { setError("Complete ciudad y direccion"); return; }
    setSaving(true); setError(null);
    try {
      if (editingId != null) {
        await axios.put(`/api/admin/centros/${editingId}`, { ciudad, dirreccion });
      } else {
        await axios.post("/api/admin/centros", { ciudad, dirreccion });
      }
      resetForm(); await load();
    } catch (err) {
      setError(axios.isAxiosError(err) && typeof err.response?.data?.error === "string" ? err.response.data.error : "No se pudo guardar");
    } finally { setSaving(false); }
  };

  const startEdit = (c: Centro) => { setEditingId(c.idCentroDeFormacion); setCiudad(c.ciudad); setDirreccion(c.dirreccion); };

  const remove = async (id: number) => {
    if (!globalThis.confirm("Eliminar este centro?")) return;
    try {
      await axios.delete(`/api/admin/centros/${id}`);
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(axios.isAxiosError(err) && typeof err.response?.data?.error === "string" ? err.response.data.error : "No se pudo eliminar");
    }
  };

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Centros de formacion</h1>
      <p className={styles.subtitle}>Gestionar centros de formacion del SENA.</p>
      <section className={styles.formPanel}>
        <h2 className={styles.formTitle}>{editingId != null ? `Editar centro #${editingId}` : "Nuevo centro"}</h2>
        <form onSubmit={(e) => void submit(e)}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="centro-ciudad">Ciudad</label>
              <input id="centro-ciudad" className={styles.input} value={ciudad} onChange={(e) => setCiudad(e.target.value)} maxLength={45} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="centro-dir">Direccion</label>
              <input id="centro-dir" className={styles.input} value={dirreccion} onChange={(e) => setDirreccion(e.target.value)} maxLength={45} />
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
            <thead><tr><th>ID</th><th>Ciudad</th><th>Direccion</th><th>Acciones</th></tr></thead>
            <tbody>
              {centros.length === 0 ? <tr><td colSpan={4} style={{ color: "#6b7280" }}>Sin registros</td></tr> :
                centros.map((c) => (
                  <tr key={c.idCentroDeFormacion}>
                    <td>{c.idCentroDeFormacion}</td><td>{c.ciudad}</td><td>{c.dirreccion}</td>
                    <td><div className={styles.rowActions}>
                      <button type="button" className={styles.rowBtn} onClick={() => startEdit(c)}>Editar</button>
                      <button type="button" className={`${styles.rowBtn} ${styles.rowBtnDanger}`} onClick={() => void remove(c.idCentroDeFormacion)}>Eliminar</button>
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
