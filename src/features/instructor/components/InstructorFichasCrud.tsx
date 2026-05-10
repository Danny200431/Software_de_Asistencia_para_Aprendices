"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
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
  };

  useEffect(() => {
    if (loading || editingId != null) return;
    if (programaId === "" && programas[0]) setProgramaId(String(programas[0].idProgramaFormacion));
    if (aprendizKey === "" && aprendices[0]) setAprendizKey(`${aprendices[0].idUsuario}-${aprendices[0].rolIdRol}`);
  }, [loading, editingId, programas, aprendices, programaId, aprendizKey]);

  const startEdit = (f: FichaRow) => {
    setEditingId(f.idFicha);
    setNumeroFicha(f.numeroFicha ?? "");
    setProgramaId(
      f.idProgramaFormacion != null && f.idProgramaFormacion !== "" ? f.idProgramaFormacion : ""
    );
    setAprendizKey(`${f.usuario.idUsuario}-${f.usuario.rolIdRol}`);
  };

  const parseAprendiz = () => {
    const [uid, rid] = aprendizKey.split("-").map((x) => Number.parseInt(x, 10));
    if (!Number.isFinite(uid) || !Number.isFinite(rid)) return null;
    return { usuarioIdUsuario: uid, usuarioRolIdRol: rid };
  };

  const submit = async () => {
    setSaving(true);
    setError(null);

    try {
      if (editingId != null) {
        await axios.put(`/api/instructor/fichas/${editingId}`, {
          numeroFicha: numeroFicha || null,
          idProgramaFormacion: programaId.trim() !== "" ? programaId.trim() : null
        });
      } else {
        const ap = parseAprendiz();
        if (!ap) {
          setError("Seleccione un aprendiz");
          setSaving(false);
          return;
        }
        await axios.post("/api/instructor/fichas", {
          numeroFicha: numeroFicha || null,
          idProgramaFormacion: programaId.trim() !== "" ? programaId.trim() : null,
          usuarioIdUsuario: ap.usuarioIdUsuario,
          usuarioRolIdRol: ap.usuarioRolIdRol
        });
      }
      resetForm();
      await load();
    } catch {
      setError("No se pudo guardar la ficha");
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
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ficha-numero">
              Numero de ficha
            </label>
            <input
              id="ficha-numero"
              className={styles.input}
              value={numeroFicha}
              onChange={(e) => setNumeroFicha(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ficha-programa">
              Programa de formacion
            </label>
            <select
              id="ficha-programa"
              className={styles.select}
              value={programaId}
              onChange={(e) => setProgramaId(e.target.value)}
            >
              <option value="">Sin programa</option>
              {programas.map((p) => (
                <option key={p.idProgramaFormacion} value={String(p.idProgramaFormacion)}>
                  {p.nombrePrograma}
                </option>
              ))}
            </select>
          </div>
          {editingId == null ? (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="ficha-aprendiz">
                Aprendiz
              </label>
              <select
                id="ficha-aprendiz"
                className={styles.select}
                value={aprendizKey}
                onChange={(e) => setAprendizKey(e.target.value)}
              >
                {aprendices.map((u) => (
                  <option key={`${u.idUsuario}-${u.rolIdRol}`} value={`${u.idUsuario}-${u.rolIdRol}`}>
                    {u.nombre} {u.apellido} (doc. {u.idUsuario})
                  </option>
                ))}
              </select>
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
            </div>
          )}
        </div>
        <div className={styles.formActions}>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving} onClick={() => void submit()}>
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
