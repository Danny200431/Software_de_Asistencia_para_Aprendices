"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { AdminFieldError } from "@/src/features/admin/components/AdminFieldError";
import { fieldInputClass, focusFirstInvalidField } from "@/src/features/admin/lib/adminFormUi";
import {
  hasAmbienteFormErrors,
  validateAmbienteForm,
  type AmbienteFormErrors,
  type AmbienteFormField
} from "@/src/features/admin/lib/validateAmbienteForm";
import styles from "@/src/features/instructor/components/InstructorGestion.module.css";

type CentroOpt = { idCentroDeFormacion: number; ciudad: string; dirreccion: string };
type Ambiente = {
  idAmbiente: number;
  nombreAmbiente: string | null;
  ubicacion: string | null;
  centroDeFormacionIdCentroDeFormacion: number;
  centroDeFormacion: { ciudad: string; dirreccion: string };
};

export function AdminAmbientesCrud() {
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [centros, setCentros] = useState<CentroOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [centroId, setCentroId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<AmbienteFormErrors>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await axios.get<{ ok: boolean; ambientes?: Ambiente[]; centros?: CentroOpt[]; error?: string }>("/api/admin/ambientes");
      if (!data.ok) { setError(data.error ?? "Error al cargar"); return; }
      setAmbientes(data.ambientes ?? []);
      setCentros(data.centros ?? []);
    } catch { setError("Error al cargar ambientes"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!loading && editingId == null && centroId === "" && centros[0]) setCentroId(String(centros[0].idCentroDeFormacion));
  }, [loading, editingId, centros, centroId]);

  const showFieldError = (field: AmbienteFormField) => (formSubmitted ? fieldErrors[field] : undefined);
  const clearFieldError = (field: AmbienteFormField) => {
    if (!formSubmitted) return;
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const resetForm = () => {
    setEditingId(null); setNombre(""); setUbicacion("");
    setCentroId(centros[0] ? String(centros[0].idCentroDeFormacion) : "");
    setFieldErrors({}); setFormSubmitted(false); setError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    const errors = validateAmbienteForm(
      { nombreAmbiente: nombre, ubicacion, centroId },
      { hasCentros: centros.length > 0 }
    );
    setFieldErrors(errors);
    if (hasAmbienteFormErrors(errors)) { focusFirstInvalidField(); return; }
    setSaving(true); setError(null);
    try {
      const payload = {
        nombreAmbiente: nombre.trim(),
        ubicacion: ubicacion.trim(),
        centroDeFormacionIdCentroDeFormacion: Number.parseInt(centroId, 10)
      };
      if (editingId != null) await axios.put(`/api/admin/ambientes/${editingId}`, payload);
      else await axios.post("/api/admin/ambientes", payload);
      resetForm(); await load();
    } catch (err) {
      setError(axios.isAxiosError(err) && typeof err.response?.data?.error === "string" ? err.response.data.error : "No se pudo guardar");
    } finally { setSaving(false); }
  };

  const startEdit = (a: Ambiente) => {
    setFieldErrors({}); setFormSubmitted(false); setError(null);
    setEditingId(a.idAmbiente); setNombre(a.nombreAmbiente ?? ""); setUbicacion(a.ubicacion ?? "");
    setCentroId(String(a.centroDeFormacionIdCentroDeFormacion));
  };

  const remove = async (id: number) => {
    if (!globalThis.confirm("Eliminar este ambiente?")) return;
    try {
      await axios.delete(`/api/admin/ambientes/${id}`);
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(axios.isAxiosError(err) && typeof err.response?.data?.error === "string" ? err.response.data.error : "No se pudo eliminar");
    }
  };

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Ambientes</h1>
      <p className={styles.subtitle}>Gestionar salones y espacios de formacion.</p>
      <section className={styles.formPanel}>
        <h2 className={styles.formTitle}>{editingId != null ? `Editar ambiente #${editingId}` : "Nuevo ambiente"}</h2>
        <form noValidate onSubmit={(e) => void submit(e)}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="amb-nombre">Nombre</label>
              <input
                id="amb-nombre"
                className={fieldInputClass(!!showFieldError("nombreAmbiente"), styles.input)}
                value={nombre}
                onChange={(e) => { setNombre(e.target.value); clearFieldError("nombreAmbiente"); }}
                maxLength={45}
                aria-invalid={showFieldError("nombreAmbiente") ? true : undefined}
                aria-describedby={showFieldError("nombreAmbiente") ? "amb-nombre-error" : undefined}
              />
              <AdminFieldError id="amb-nombre-error" message={showFieldError("nombreAmbiente")} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="amb-ubic">Ubicacion</label>
              <input
                id="amb-ubic"
                className={fieldInputClass(!!showFieldError("ubicacion"), styles.input)}
                value={ubicacion}
                onChange={(e) => { setUbicacion(e.target.value); clearFieldError("ubicacion"); }}
                maxLength={45}
                aria-invalid={showFieldError("ubicacion") ? true : undefined}
                aria-describedby={showFieldError("ubicacion") ? "amb-ubic-error" : undefined}
              />
              <AdminFieldError id="amb-ubic-error" message={showFieldError("ubicacion")} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="amb-centro">Centro</label>
              <select
                id="amb-centro"
                className={fieldInputClass(!!showFieldError("centroId"), styles.select, styles.selectInvalid)}
                value={centroId}
                onChange={(e) => { setCentroId(e.target.value); clearFieldError("centroId"); }}
                aria-invalid={showFieldError("centroId") ? true : undefined}
                aria-describedby={showFieldError("centroId") ? "amb-centro-error" : undefined}
              >
                <option value="">Seleccione</option>
                {centros.map((c) => <option key={c.idCentroDeFormacion} value={String(c.idCentroDeFormacion)}>{c.ciudad} — {c.dirreccion}</option>)}
              </select>
              <AdminFieldError id="amb-centro-error" message={showFieldError("centroId")} />
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
            <thead><tr><th>ID</th><th>Nombre</th><th>Ubicacion</th><th>Centro</th><th>Acciones</th></tr></thead>
            <tbody>
              {ambientes.length === 0 ? <tr><td colSpan={5} style={{ color: "#6b7280" }}>Sin registros</td></tr> :
                ambientes.map((a) => (
                  <tr key={a.idAmbiente}>
                    <td>{a.idAmbiente}</td><td>{a.nombreAmbiente ?? "—"}</td><td>{a.ubicacion ?? "—"}</td>
                    <td>{a.centroDeFormacion.ciudad}</td>
                    <td><div className={styles.rowActions}>
                      <button type="button" className={styles.rowBtn} onClick={() => startEdit(a)}>Editar</button>
                      <button type="button" className={`${styles.rowBtn} ${styles.rowBtnDanger}`} onClick={() => void remove(a.idAmbiente)}>Eliminar</button>
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
