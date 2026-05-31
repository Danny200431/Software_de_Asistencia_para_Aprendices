"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toDateInputValue } from "@/src/features/instructor/lib/dateInputValue";
import styles from "./InstructorGestion.module.css";

type AmbienteOpt = { idAmbiente: number; nombreAmbiente: string | null; ubicacion: string | null };
type CursoOpt = { idCurso: number; nombreCurso: string };
type FichaOpt = { idFicha: number; numeroFicha: string | null };
type ClaseRow = {
  idClase: number;
  nombreTema: string | null;
  fecha: string | null;
  horaInicio: string | null;
  ambiente: { idAmbiente: number; nombreAmbiente: string | null };
  cursoCompetencia: { idCurso: number; nombreCurso: string };
  ficha: { idFicha: number; numeroFicha: string | null };
};

export function InstructorClasesCrud() {
  const [clases, setClases] = useState<ClaseRow[]>([]);
  const [ambientes, setAmbientes] = useState<AmbienteOpt[]>([]);
  const [cursos, setCursos] = useState<CursoOpt[]>([]);
  const [fichas, setFichas] = useState<FichaOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombreTema, setNombreTema] = useState("");
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [ambienteId, setAmbienteId] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [fichaId, setFichaId] = useState("");

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await axios.get<{
        ok: boolean;
        clases?: ClaseRow[];
        ambientes?: AmbienteOpt[];
        cursos?: CursoOpt[];
        fichas?: FichaOpt[];
        error?: string;
      }>("/api/instructor/clases");
      if (!data.ok) {
        setError(data.error ?? "No se pudieron cargar los datos");
        return;
      }
      setClases(data.clases ?? []);
      setAmbientes(data.ambientes ?? []);
      setCursos(data.cursos ?? []);
      setFichas(data.fichas ?? []);
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
    setNombreTema("");
    setFecha("");
    setHoraInicio("");
    setAmbienteId(ambientes[0] ? String(ambientes[0].idAmbiente) : "");
    setCursoId(cursos[0] ? String(cursos[0].idCurso) : "");
    setFichaId(fichas[0] ? String(fichas[0].idFicha) : "");
  };

  useEffect(() => {
    if (loading || editingId != null) return;
    if (ambienteId === "" && ambientes[0]) setAmbienteId(String(ambientes[0].idAmbiente));
    if (cursoId === "" && cursos[0]) setCursoId(String(cursos[0].idCurso));
    if (fichaId === "" && fichas[0]) setFichaId(String(fichas[0].idFicha));
  }, [loading, editingId, ambientes, cursos, fichas, ambienteId, cursoId, fichaId]);

  const startEdit = (c: ClaseRow) => {
    setEditingId(c.idClase);
    setNombreTema(c.nombreTema ?? "");
    setFecha(toDateInputValue(c.fecha));
    setHoraInicio(c.horaInicio ?? "");
    setAmbienteId(String(c.ambiente.idAmbiente));
    setCursoId(String(c.cursoCompetencia.idCurso));
    setFichaId(String(c.ficha.idFicha));
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    const amb = Number.parseInt(ambienteId, 10);
    const cur = Number.parseInt(cursoId, 10);
    const fic = Number.parseInt(fichaId, 10);
    const tema = nombreTema.trim();
    if (!tema) {
      setError("Indique el nombre o tema de la clase");
      setSaving(false);
      return;
    }
    if (!Number.isFinite(amb) || !Number.isFinite(cur) || !Number.isFinite(fic)) {
      setError("Complete ambiente, competencia y ficha");
      setSaving(false);
      return;
    }

    try {
      if (editingId != null) {
        await axios.put(`/api/instructor/clases/${editingId}`, {
          nombreTema: tema,
          fecha: fecha || null,
          horaInicio: horaInicio || null,
          ambienteIdAmbiente: amb,
          cursoCompetenciaIdCurso: cur,
          fichaIdFicha: fic
        });
      } else {
        await axios.post("/api/instructor/clases", {
          nombreTema: tema,
          fecha: fecha || null,
          horaInicio: horaInicio || null,
          ambienteIdAmbiente: amb,
          cursoCompetenciaIdCurso: cur,
          fichaIdFicha: fic
        });
      }
      resetForm();
      await load();
    } catch {
      setError("No se pudo guardar la clase");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!globalThis.confirm("Eliminar esta clase y sus registros de asistencia asociados?")) return;
    setError(null);
    try {
      await axios.delete(`/api/instructor/clases/${id}`);
      if (editingId === id) resetForm();
      await load();
    } catch {
      setError("No se pudo eliminar la clase");
    }
  };

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Gestion de clases</h1>
      <p className={styles.subtitle}>
        Crear, editar y eliminar clases (nombre o tema, fecha, hora, ambiente, competencia y ficha).
      </p>

      <section className={styles.formPanel} aria-labelledby="clase-form-titulo">
        <h2 id="clase-form-titulo" className={styles.formTitle}>
          {editingId != null ? `Editar clase #${editingId}` : "Nueva clase"}
        </h2>
        <div className={styles.formGrid}>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label className={styles.label} htmlFor="clase-nombre-tema">
              Nombre o tema de la clase
            </label>
            <input
              id="clase-nombre-tema"
              className={styles.input}
              value={nombreTema}
              onChange={(e) => setNombreTema(e.target.value)}
              placeholder="Ej. Introduccion a bases de datos"
              maxLength={120}
              autoComplete="off"
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="clase-fecha">
              Fecha
            </label>
            <input
              id="clase-fecha"
              type="date"
              className={`${styles.input} ${styles.inputDate}`}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="clase-hora">
              Hora inicio
            </label>
            <input
              id="clase-hora"
              className={styles.input}
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              placeholder="HH:MM"
              autoComplete="off"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="clase-ambiente">
              Ambiente
            </label>
            <select
              id="clase-ambiente"
              className={styles.select}
              value={ambienteId}
              onChange={(e) => setAmbienteId(e.target.value)}
            >
              {ambientes.map((a) => (
                <option key={a.idAmbiente} value={a.idAmbiente}>
                  {a.nombreAmbiente ?? `Ambiente ${a.idAmbiente}`}
                  {a.ubicacion ? ` · ${a.ubicacion}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="clase-curso">
              Competencia
            </label>
            <select
              id="clase-curso"
              className={styles.select}
              value={cursoId}
              onChange={(e) => setCursoId(e.target.value)}
            >
              {cursos.map((c) => (
                <option key={c.idCurso} value={c.idCurso}>
                  {c.nombreCurso}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="clase-ficha">
              Ficha
            </label>
            <select
              id="clase-ficha"
              className={styles.select}
              value={fichaId}
              onChange={(e) => setFichaId(e.target.value)}
            >
              {fichas.map((f) => (
                <option key={f.idFicha} value={f.idFicha}>
                  {f.numeroFicha ?? `Ficha ${f.idFicha}`}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.formActions}>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving} onClick={() => void submit()}>
            {editingId != null ? "Guardar cambios" : "Crear clase"}
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
                <th>Nombre / tema</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Ambiente</th>
                <th>Competencia</th>
                <th>Ficha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clases.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ color: "#6b7280" }}>
                    No hay clases registradas.
                  </td>
                </tr>
              ) : (
                clases.map((c) => (
                  <tr key={c.idClase}>
                    <td>{c.idClase}</td>
                    <td>{c.nombreTema ?? "—"}</td>
                    <td>{c.fecha ?? "—"}</td>
                    <td>{c.horaInicio ?? "—"}</td>
                    <td>{c.ambiente.nombreAmbiente ?? c.ambiente.idAmbiente}</td>
                    <td>{c.cursoCompetencia.nombreCurso}</td>
                    <td>{c.ficha.numeroFicha ?? c.ficha.idFicha}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <button type="button" className={styles.rowBtn} onClick={() => startEdit(c)}>
                          Editar
                        </button>
                        <button type="button" className={`${styles.rowBtn} ${styles.rowBtnDanger}`} onClick={() => void remove(c.idClase)}>
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
