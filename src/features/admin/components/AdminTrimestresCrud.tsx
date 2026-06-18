"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { AdminFieldError } from "@/src/features/admin/components/AdminFieldError";
import { fieldInputClass, focusFirstInvalidField } from "@/src/features/admin/lib/adminFormUi";
import {
  hasTrimestreFormErrors,
  validateTrimestreForm,
  type TrimestreFormErrors,
  type TrimestreFormField
} from "@/src/features/admin/lib/validateTrimestreForm";
import styles from "@/src/features/instructor/components/InstructorGestion.module.css";

type Trimestre = {
  idTrimestre: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  clasesCount: number;
};

export function AdminTrimestresCrud() {
  const [trimestres, setTrimestres] = useState<Trimestre[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [fieldErrors, setFieldErrors] = useState<TrimestreFormErrors>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get<{ ok: boolean; trimestres?: Trimestre[]; error?: string }>(
        "/api/admin/trimestres"
      );
      if (!data.ok) {
        setError(data.error ?? "Error al cargar");
        return;
      }
      setTrimestres(data.trimestres ?? []);
    } catch {
      setError("Error al cargar trimestres");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const showFieldError = (field: TrimestreFormField) => (formSubmitted ? fieldErrors[field] : undefined);
  const clearFieldError = (field: TrimestreFormField) => {
    if (!formSubmitted) return;
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setNombre("");
    setFechaInicio("");
    setFechaFin("");
    setFieldErrors({});
    setFormSubmitted(false);
    setError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    const errors = validateTrimestreForm({ nombre, fechaInicio, fechaFin });
    setFieldErrors(errors);
    if (hasTrimestreFormErrors(errors)) {
      focusFirstInvalidField();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        nombre: nombre.trim(),
        fechaInicio: fechaInicio.trim(),
        fechaFin: fechaFin.trim()
      };
      if (editingId != null) await axios.put(`/api/admin/trimestres/${editingId}`, payload);
      else await axios.post("/api/admin/trimestres", payload);
      resetForm();
      await load();
    } catch (err) {
      setError(
        axios.isAxiosError(err) && typeof err.response?.data?.error === "string"
          ? err.response.data.error
          : "No se pudo guardar"
      );
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (t: Trimestre) => {
    setFieldErrors({});
    setFormSubmitted(false);
    setError(null);
    setEditingId(t.idTrimestre);
    setNombre(t.nombre);
    setFechaInicio(t.fechaInicio);
    setFechaFin(t.fechaFin);
  };

  const remove = async (id: number) => {
    if (!globalThis.confirm("Eliminar este trimestre?")) return;
    try {
      await axios.delete(`/api/admin/trimestres/${id}`);
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(
        axios.isAxiosError(err) && typeof err.response?.data?.error === "string"
          ? err.response.data.error
          : "No se pudo eliminar"
      );
    }
  };

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Trimestres academicos</h1>
      <p className={styles.subtitle}>
        Defina los periodos del ano lectivo. Los instructores asignan clases a estos trimestres y pueden
        repetirlas semanalmente dentro del rango de fechas.
      </p>
      <section className={styles.formPanel}>
        <h2 className={styles.formTitle}>
          {editingId != null ? `Editar trimestre #${editingId}` : "Nuevo trimestre"}
        </h2>
        <form noValidate onSubmit={(e) => void submit(e)}>
          <div className={styles.formGrid}>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label} htmlFor="trim-nombre">
                Nombre
              </label>
              <input
                id="trim-nombre"
                className={fieldInputClass(!!showFieldError("nombre"), styles.input)}
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  clearFieldError("nombre");
                }}
                maxLength={80}
                placeholder="Ej. Trimestre 1 - 2025"
                aria-invalid={showFieldError("nombre") ? true : undefined}
                aria-describedby={showFieldError("nombre") ? "trim-nombre-error" : undefined}
              />
              <AdminFieldError id="trim-nombre-error" message={showFieldError("nombre")} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="trim-inicio">
                Fecha inicio
              </label>
              <input
                id="trim-inicio"
                type="date"
                className={fieldInputClass(!!showFieldError("fechaInicio"), `${styles.input} ${styles.inputDate}`)}
                value={fechaInicio}
                onChange={(e) => {
                  setFechaInicio(e.target.value);
                  clearFieldError("fechaInicio");
                  clearFieldError("fechaFin");
                }}
                aria-invalid={showFieldError("fechaInicio") ? true : undefined}
                aria-describedby={showFieldError("fechaInicio") ? "trim-inicio-error" : undefined}
              />
              <AdminFieldError id="trim-inicio-error" message={showFieldError("fechaInicio")} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="trim-fin">
                Fecha fin
              </label>
              <input
                id="trim-fin"
                type="date"
                className={fieldInputClass(!!showFieldError("fechaFin"), `${styles.input} ${styles.inputDate}`)}
                value={fechaFin}
                onChange={(e) => {
                  setFechaFin(e.target.value);
                  clearFieldError("fechaFin");
                }}
                aria-invalid={showFieldError("fechaFin") ? true : undefined}
                aria-describedby={showFieldError("fechaFin") ? "trim-fin-error" : undefined}
              />
              <AdminFieldError id="trim-fin-error" message={showFieldError("fechaFin")} />
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving}>
              {editingId != null ? "Guardar" : "Crear"}
            </button>
            {editingId != null ? (
              <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={resetForm}>
                Cancelar
              </button>
            ) : null}
          </div>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
        </form>
      </section>
      {loading ? (
        <p className={styles.loadingMuted}>Cargando...</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Clases</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {trimestres.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ color: "#6b7280" }}>
                    Sin registros
                  </td>
                </tr>
              ) : (
                trimestres.map((t) => (
                  <tr key={t.idTrimestre}>
                    <td>{t.idTrimestre}</td>
                    <td>{t.nombre}</td>
                    <td>{t.fechaInicio}</td>
                    <td>{t.fechaFin}</td>
                    <td>{t.clasesCount}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <button type="button" className={styles.rowBtn} onClick={() => startEdit(t)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          className={`${styles.rowBtn} ${styles.rowBtnDanger}`}
                          onClick={() => void remove(t.idTrimestre)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
