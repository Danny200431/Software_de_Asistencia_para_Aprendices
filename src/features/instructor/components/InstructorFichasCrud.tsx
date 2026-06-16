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
import styles from "./InstructorGestion.module.css";

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
      {message ? (
        <p id={id} className={styles.fieldError} role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}

export function InstructorFichasCrud() {
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
    setError(null);
    setLoading(true);
    try {
      const { data } = await axios.get<{
        ok: boolean;
        fichas?: FichaRow[];
        programas?: ProgramaOpt[];
        aprendices?: UsuarioMini[];
        error?: string;
      }>("/api/instructor/fichas");
      if (!data.ok) {
        setError(data.error ?? "No se pudieron cargar los datos");
        return;
      }
      setFichas(data.fichas ?? []);
      setProgramas(data.programas ?? []);
      setAprendices(data.aprendices ?? []);
    } catch {
      setError("No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setNumeroFicha("");
    setProgramaId(programas[0] ? String(programas[0].idProgramaFormacion) : "");
    setAprendizKey(aprendices[0] ? `${aprendices[0].idUsuario}-${aprendices[0].rolIdRol}` : "");
    setFieldErrors({});
    setFormSubmitted(false);
  };

  const getFormValues = (): FichaFormValues => ({
    numeroFicha,
    programaId,
    aprendizKey,
    editingId
  });

  const getValidationContext = () => ({
    hasProgramas: programas.length > 0,
    hasAprendices: aprendices.length > 0
  });

  const clearFieldError = (field: FichaFormField) => {
    if (!formSubmitted) return;
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const showFieldError = (field: FichaFormField) =>
    formSubmitted ? fieldErrors[field] : undefined;

  const inputClass = (field: FichaFormField, base: string) =>
    showFieldError(field) ? `${base} ${styles.inputInvalid}` : base;

  const mapApiErrorToFieldErrors = (msg: string): FichaFormErrors => {
    const errors: FichaFormErrors = {};
    const lower = msg.toLowerCase();
    if (lower.includes("numero") && lower.includes("ficha")) errors.numeroFicha = msg;
    else if (lower.includes("programa")) errors.programaId = msg;
    else if (lower.includes("aprendiz")) errors.aprendizKey = msg;
    return errors;
  };

  useEffect(() => {
    if (loading || editingId != null) return;
    if (programaId === "" && programas[0]) setProgramaId(String(programas[0].idProgramaFormacion));
    if (aprendizKey === "" && aprendices[0]) setAprendizKey(`${aprendices[0].idUsuario}-${aprendices[0].rolIdRol}`);
  }, [loading, editingId, programas, aprendices, programaId, aprendizKey]);

  const startEdit = (f: FichaRow) => {
    setFieldErrors({});
    setFormSubmitted(false);
    setEditingId(f.idFicha);
    setNumeroFicha(f.numeroFicha ?? "");
    setProgramaId(
      f.idProgramaFormacion != null && f.idProgramaFormacion !== "" ? f.idProgramaFormacion : ""
    );
    setAprendizKey(`${f.usuario.idUsuario}-${f.usuario.rolIdRol}`);
  };

  const parseAprendiz = () => parseAprendizFromKey(aprendizKey);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    setError(null);
    setFormSubmitted(true);

    const errors = validateFichaForm(getFormValues(), getValidationContext());
    setFieldErrors(errors);

    if (hasFichaFormErrors(errors)) {
      const firstInvalid = document.querySelector<HTMLElement>("[aria-invalid='true']");
      firstInvalid?.focus();
      return;
    }

    setSaving(true);
    const numero = numeroFicha.trim();
    const programa = programaId.trim();

    try {
      if (editingId != null) {
        await axios.put(`/api/instructor/fichas/${editingId}`, {
          numeroFicha: numero,
          idProgramaFormacion: programa
        });
      } else {
        const ap = parseAprendiz();
        if (!ap) {
          setFieldErrors((prev) => ({
            ...prev,
            aprendizKey: "Seleccione un aprendiz valido"
          }));
          setSaving(false);
          return;
        }
        await axios.post("/api/instructor/fichas", {
          numeroFicha: numero,
          idProgramaFormacion: programa,
          usuarioIdUsuario: ap.usuarioIdUsuario,
          usuarioRolIdRol: ap.usuarioRolIdRol
        });
      }
      resetForm();
      await load();
    } catch (err) {
      const msg =
        axios.isAxiosError(err) &&
        err.response?.data &&
        typeof err.response.data === "object" &&
        "error" in err.response.data &&
        typeof err.response.data.error === "string"
          ? err.response.data.error
          : null;
      const fallback = msg ?? "No se pudo guardar la ficha";
      const fieldErrorsFromApi = msg ? mapApiErrorToFieldErrors(msg) : {};
      if (Object.keys(fieldErrorsFromApi).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...fieldErrorsFromApi }));
        setFormSubmitted(true);
        setError(null);
      } else {
        setError(fallback);
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!globalThis.confirm("Eliminar esta ficha, sus clases y asistencias vinculadas?")) return;
    setError(null);
    try {
      await axios.delete(`/api/instructor/fichas/${id}`);
      if (editingId === id) resetForm();
      await load();
    } catch {
      setError("No se pudo eliminar la ficha");
    }
  };

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Gestion de fichas</h1>
      <p className={styles.subtitle}>
        Crear, editar y eliminar fichas. Al crear se vincula al aprendiz seleccionado.
      </p>

      <section className={styles.formPanel} aria-labelledby="ficha-form-titulo">
        <h2 id="ficha-form-titulo" className={styles.formTitle}>
          {editingId != null ? `Editar ficha #${editingId}` : "Nueva ficha"}
        </h2>
        <form id="ficha-form" noValidate onSubmit={(e) => void submit(e)}>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ficha-numero">
              Numero de ficha
            </label>
            <input
              id="ficha-numero"
              className={inputClass("numeroFicha", styles.input)}
              value={numeroFicha}
              onChange={(e) => {
                setNumeroFicha(e.target.value);
                clearFieldError("numeroFicha");
              }}
              placeholder="Ej. 287001"
              maxLength={45}
              autoComplete="off"
              aria-invalid={showFieldError("numeroFicha") ? true : undefined}
              aria-describedby={showFieldError("numeroFicha") ? "ficha-numero-error" : undefined}
            />
            <FieldError
              id="ficha-numero-error"
              message={showFieldError("numeroFicha") || undefined}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ficha-programa">
              Programa de formacion
            </label>
            <select
              id="ficha-programa"
              className={inputClass("programaId", styles.select)}
              value={programaId}
              onChange={(e) => {
                setProgramaId(e.target.value);
                clearFieldError("programaId");
              }}
              aria-invalid={showFieldError("programaId") ? true : undefined}
              aria-describedby={showFieldError("programaId") ? "ficha-programa-error" : undefined}
            >
              <option value="">Seleccione programa</option>
              {programas.map((p) => (
                <option key={p.idProgramaFormacion} value={String(p.idProgramaFormacion)}>
                  {p.nombrePrograma}
                </option>
              ))}
            </select>
            <FieldError
              id="ficha-programa-error"
              message={showFieldError("programaId") || undefined}
            />
          </div>
          {editingId == null ? (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="ficha-aprendiz">
                Aprendiz
              </label>
              <select
                id="ficha-aprendiz"
                className={inputClass("aprendizKey", styles.select)}
                value={aprendizKey}
                onChange={(e) => {
                  setAprendizKey(e.target.value);
                  clearFieldError("aprendizKey");
                }}
                aria-invalid={showFieldError("aprendizKey") ? true : undefined}
                aria-describedby={showFieldError("aprendizKey") ? "ficha-aprendiz-error" : undefined}
              >
                <option value="">Seleccione aprendiz</option>
                {aprendices.map((u) => (
                  <option key={`${u.idUsuario}-${u.rolIdRol}`} value={`${u.idUsuario}-${u.rolIdRol}`}>
                    {u.nombre} {u.apellido} (doc. {u.idUsuario})
                  </option>
                ))}
              </select>
              <FieldError
                id="ficha-aprendiz-error"
                message={showFieldError("aprendizKey") || undefined}
              />
            </div>
          ) : (
            <div className={styles.field}>
              <span className={styles.label}>Aprendiz</span>
              <p className={styles.loadingMuted} style={{ margin: 0, minHeight: "2.5rem", display: "flex", alignItems: "center" }}>
                {(() => {
                  const [uid, rid] = aprendizKey.split("-");
                  const u = aprendices.find((a) => String(a.idUsuario) === uid && String(a.rolIdRol) === rid);
                  return u ? `${u.nombre} ${u.apellido}` : "—";
                })()}
              </p>
              <span style={{ fontSize: "0.78rem", color: "#6b7280" }}>El aprendiz no se modifica al editar.</span>
              <div className={styles.fieldErrorSlot} aria-hidden />
            </div>
          )}
        </div>
        <div className={styles.formActions}>
          <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving}>
            {editingId != null ? "Guardar cambios" : "Crear ficha"}
          </button>
          {editingId != null ? (
            <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} disabled={saving} onClick={resetForm}>
              Cancelar edicion
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
                <th>Numero</th>
                <th>Programa</th>
                <th>Aprendiz</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {fichas.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ color: "#6b7280" }}>
                    No hay fichas registradas.
                  </td>
                </tr>
              ) : (
                fichas.map((f) => (
                  <tr key={f.idFicha}>
                    <td>{f.idFicha}</td>
                    <td>{f.numeroFicha ?? "—"}</td>
                    <td>{f.programaNombre ?? f.idProgramaFormacion ?? "—"}</td>
                    <td>
                      {f.usuario.nombre} {f.usuario.apellido}
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button type="button" className={styles.rowBtn} onClick={() => startEdit(f)}>
                          Editar
                        </button>
                        <button type="button" className={`${styles.rowBtn} ${styles.rowBtnDanger}`} onClick={() => void remove(f.idFicha)}>
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
