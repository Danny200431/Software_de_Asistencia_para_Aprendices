"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { AdminFieldError } from "@/src/features/admin/components/AdminFieldError";
import { fieldInputClass, focusFirstInvalidField } from "@/src/features/admin/lib/adminFormUi";
import {
  hasCentroFormErrors,
  validateCentroForm,
  type CentroFormErrors,
  type CentroFormField
} from "@/src/features/admin/lib/validateCentroForm";
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
  const [fieldErrors, setFieldErrors] = useState<CentroFormErrors>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

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

  const showFieldError = (field: CentroFormField) => (formSubmitted ? fieldErrors[field] : undefined);
  const clearFieldError = (field: CentroFormField) => {
    if (!formSubmitted) return;
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const resetForm = () => {
    setEditingId(null); setCiudad(""); setDirreccion("");
    setFieldErrors({}); setFormSubmitted(false); setError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    const errors = validateCentroForm({ ciudad, dirreccion });
    setFieldErrors(errors);
    if (hasCentroFormErrors(errors)) { focusFirstInvalidField(); return; }
    setSaving(true); setError(null);
    try {
      if (editingId != null) {
        await axios.put(`/api/admin/centros/${editingId}`, { ciudad: ciudad.trim(), dirreccion: dirreccion.trim() });
      } else {
        await axios.post("/api/admin/centros", { ciudad: ciudad.trim(), dirreccion: dirreccion.trim() });
      }
      resetForm(); await load();
    } catch (err) {
      setError(axios.isAxiosError(err) && typeof err.response?.data?.error === "string" ? err.response.data.error : "No se pudo guardar");
    } finally { setSaving(false); }
  };

  const startEdit = (c: Centro) => {
    setFieldErrors({}); setFormSubmitted(false); setError(null);
    setEditingId(c.idCentroDeFormacion); setCiudad(c.ciudad); setDirreccion(c.dirreccion);
  };

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
        <form noValidate onSubmit={(e) => void submit(e)}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="centro-ciudad">Ciudad</label>
              <input
                id="centro-ciudad"
                className={fieldInputClass(!!showFieldError("ciudad"), styles.input)}
                value={ciudad}
                onChange={(e) => { setCiudad(e.target.value); clearFieldError("ciudad"); }}
                maxLength={45}
                aria-invalid={showFieldError("ciudad") ? true : undefined}
                aria-describedby={showFieldError("ciudad") ? "centro-ciudad-error" : undefined}
              />
              <AdminFieldError id="centro-ciudad-error" message={showFieldError("ciudad")} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="centro-dir">Direccion</label>
              <input
                id="centro-dir"
                className={fieldInputClass(!!showFieldError("dirreccion"), styles.input)}
                value={dirreccion}
                onChange={(e) => { setDirreccion(e.target.value); clearFieldError("dirreccion"); }}
                maxLength={45}
                aria-invalid={showFieldError("dirreccion") ? true : undefined}
                aria-describedby={showFieldError("dirreccion") ? "centro-dir-error" : undefined}
              />
              <AdminFieldError id="centro-dir-error" message={showFieldError("dirreccion")} />
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
