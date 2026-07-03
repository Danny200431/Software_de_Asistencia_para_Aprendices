"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  exportAsistenciaClaseExcel,
  exportAsistenciaClasePdf
} from "@/src/features/instructor/lib/exportAsistenciaClase";
import { evaluarEscaneoClase } from "@/src/features/instructor/lib/claseEscaneoPermitido";
import { toDateInputValue } from "@/src/features/instructor/lib/dateInputValue";
import { InstructorAttendanceChart } from "./InstructorAttendanceChart";
import { InstructorAttendanceQrScanner } from "./InstructorAttendanceQrScanner";
import styles from "./InstructorHomeFilters.module.css";

type Programa = { idProgramaFormacion: number; nombrePrograma: string };
type Competencia = { idCurso: number; nombreCurso: string };
type Ficha = { idFicha: number; numeroFicha: string | null };
type Clase = {
  idClase: number;
  nombreTema: string | null;
  fecha: string | null;
  horaInicio: string | null;
  ambiente: { nombreAmbiente: string | null };
  competenciaNombre?: string | null;
};

type HorarioSesion = { idClase: number; fecha: string | null };
type HorarioEntry = {
  diaSemana: number;
  horaInicio: string | null;
  nombreTema: string | null;
  competenciaNombre: string;
  ambienteNombre: string | null;
  sessions: HorarioSesion[];
};

type SesionClase = {
  idClase: number;
  fecha: string;
  horaInicio: string | null;
  nombreTema: string | null;
  competenciaNombre: string;
  ambienteNombre: string | null;
};

type DiaHorario = {
  fecha: string;
  diaLabel: string;
  fechaLabel: string;
};

const DIAS_SEMANA_LABEL: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miercoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sabado",
  0: "Domingo"
};

function authConfig() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
}

function fechaHoyBogota(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Bogota" }).format(new Date());
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatFecha(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addDays(fecha: string, days: number): string {
  const d = new Date(`${fecha}T12:00:00`);
  d.setDate(d.getDate() + days);
  return formatFecha(d);
}

/** Devuelve el lunes de la semana que contiene la fecha dada. */
function inicioSemana(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00`);
  const dia = d.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + diff);
  return formatFecha(d);
}

function formatDiaMes(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00`);
  return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short" }).format(d);
}

type AsistenciaRow = {
  idAsistencia: number;
  fecha: string | null;
  horaIngreso: string | null;
  estado: string | null;
  idAprendiz: string | null;
  aprendizNombre: string | null;
  documentoAprendiz: string | null;
};

function claseDisplayLabel(c: Clase): string {
  return [
    c.nombreTema,
    c.fecha ?? "Sin fecha",
    c.horaInicio ?? "",
    c.ambiente.nombreAmbiente ? `· ${c.ambiente.nombreAmbiente}` : ""
  ]
    .filter(Boolean)
    .join(" ");
}

function estadoClass(estado: string | null | undefined) {
  const e = estado?.trim().toLowerCase() ?? "";
  if (e === "presente") return styles.estadoPresente;
  if (e === "tarde" || e === "tardanza") return styles.estadoTarde;
  if (e === "ausente") return styles.estadoAusente;
  return styles.estadoOtro;
}

export function InstructorHomeFilters() {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [clases, setClases] = useState<Clase[]>([]);

  const [programaId, setProgramaId] = useState("");
  const [competenciaId, setCompetenciaId] = useState("");
  const [fichaId, setFichaId] = useState("");
  const [claseId, setClaseId] = useState("");

  const [asistencias, setAsistencias] = useState<AsistenciaRow[]>([]);

  const [horario, setHorario] = useState<HorarioEntry[]>([]);
  const [horarioClase, setHorarioClase] = useState<Clase | null>(null);
  const [horarioMensaje, setHorarioMensaje] = useState<string | null>(null);
  const [loadingHorario, setLoadingHorario] = useState(false);
  const [semanaInicio, setSemanaInicio] = useState<string | null>(null);

  const [loadingProgramas, setLoadingProgramas] = useState(true);
  const [loadingRelaciones, setLoadingRelaciones] = useState(false);
  const [loadingClases, setLoadingClases] = useState(false);
  const [loadingAsistencias, setLoadingAsistencias] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingProgramas(true);
      setError(null);
      try {
        const { data } = await axios.get<{ ok: boolean; programas?: Programa[] }>(
          "/api/instructor/filtros?tipo=programas",
          authConfig()
        );
        if (cancelled) return;
        if (data.ok && data.programas) setProgramas(data.programas);
        else setError("No se pudieron cargar los programas");
      } catch {
        if (!cancelled) setError("No se pudieron cargar los programas");
      } finally {
        if (!cancelled) setLoadingProgramas(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadCompetenciasYFichas = useCallback(async (pid: string) => {
    if (!pid) {
      setCompetencias([]);
      setFichas([]);
      return;
    }
    setLoadingRelaciones(true);
    setError(null);
    try {
      const [compRes, fichasRes] = await Promise.all([
        axios.get<{ ok: boolean; competencias?: Competencia[] }>(
          `/api/instructor/filtros?tipo=competencias&programaId=${encodeURIComponent(pid)}`,
          authConfig()
        ),
        axios.get<{ ok: boolean; fichas?: Ficha[] }>(
          `/api/instructor/filtros?tipo=fichas&programaId=${encodeURIComponent(pid)}`,
          authConfig()
        )
      ]);
      if (compRes.data.ok && compRes.data.competencias) {
        setCompetencias(compRes.data.competencias);
      } else {
        setCompetencias([]);
      }
      if (fichasRes.data.ok && fichasRes.data.fichas) {
        setFichas(fichasRes.data.fichas);
      } else {
        setFichas([]);
      }
    } catch {
      setError("No se pudieron cargar competencias o fichas");
      setCompetencias([]);
      setFichas([]);
    } finally {
      setLoadingRelaciones(false);
    }
  }, []);

  const onProgramaChange = (value: string) => {
    setProgramaId(value);
    setCompetenciaId("");
    setFichaId("");
    setClaseId("");
    setScannerOpen(false);
    setClases([]);
    setAsistencias([]);
    setHorarioClase(null);
    setHorarioMensaje(null);
    setSemanaInicio(null);
    if (!value) {
      setCompetencias([]);
      setFichas([]);
      return;
    }
    void loadCompetenciasYFichas(value);
  };

  const onCompetenciaChange = (value: string) => {
    setCompetenciaId(value);
    setClaseId("");
    setScannerOpen(false);
    setClases([]);
    setAsistencias([]);
  };

  const onFichaChange = (value: string) => {
    setFichaId(value);
    setClaseId("");
    setScannerOpen(false);
    setClases([]);
    setAsistencias([]);
    setHorarioClase(null);
    setHorarioMensaje(null);
    setSemanaInicio(null);
  };

  const loadAsistencias = useCallback(async (selectedClaseId: string) => {
    if (!selectedClaseId) {
      setAsistencias([]);
      return;
    }

    setLoadingAsistencias(true);
    setAsistencias([]);
    setError(null);
    try {
      const { data } = await axios.get<{
        ok: boolean;
        asistencias?: AsistenciaRow[];
      }>(
        `/api/instructor/filtros?tipo=asistencias&claseId=${encodeURIComponent(selectedClaseId)}`,
        authConfig()
      );
      if (data.ok && data.asistencias) setAsistencias(data.asistencias);
      else setAsistencias([]);
    } catch {
      setError("No se pudo cargar la asistencia de la clase");
      setAsistencias([]);
    } finally {
      setLoadingAsistencias(false);
    }
  }, []);

  const onClaseChange = (value: string) => {
    setClaseId(value);
    setScannerOpen(false);
    setHorarioClase(null);
    setHorarioMensaje(null);
  };

  useEffect(() => {
    if (!fichaId || !competenciaId) {
      setClases([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingClases(true);
      setError(null);
      try {
        const { data } = await axios.get<{ ok: boolean; clases?: Clase[] }>(
          `/api/instructor/filtros?tipo=clases&fichaId=${encodeURIComponent(fichaId)}&competenciaId=${encodeURIComponent(competenciaId)}`,
          authConfig()
        );
        if (cancelled) return;
        if (data.ok && data.clases) setClases(data.clases);
        else setClases([]);
      } catch {
        if (!cancelled) {
          setError("No se pudieron cargar las clases");
          setClases([]);
        }
      } finally {
        if (!cancelled) setLoadingClases(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fichaId, competenciaId]);

  useEffect(() => {
    if (!fichaId) {
      setHorario([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingHorario(true);
      try {
        const { data } = await axios.get<{ ok: boolean; horario?: HorarioEntry[] }>(
          `/api/instructor/filtros?tipo=horario&fichaId=${encodeURIComponent(fichaId)}`,
          authConfig()
        );
        if (cancelled) return;
        setHorario(data.ok && data.horario ? data.horario : []);
      } catch {
        if (!cancelled) setHorario([]);
      } finally {
        if (!cancelled) setLoadingHorario(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fichaId]);

  const sesiones = useMemo<SesionClase[]>(() => {
    const out: SesionClase[] = [];
    for (const entry of horario) {
      for (const s of entry.sessions) {
        const fecha = toDateInputValue(s.fecha);
        if (!fecha) continue;
        out.push({
          idClase: s.idClase,
          fecha,
          horaInicio: entry.horaInicio,
          nombreTema: entry.nombreTema,
          competenciaNombre: entry.competenciaNombre,
          ambienteNombre: entry.ambienteNombre
        });
      }
    }
    return out;
  }, [horario]);

  useEffect(() => {
    if (!fichaId) {
      setSemanaInicio(null);
      return;
    }
    setSemanaInicio(inicioSemana(fechaHoyBogota()));
  }, [fichaId]);

  const diasSemana = useMemo<DiaHorario[]>(() => {
    if (!semanaInicio) return [];
    return Array.from({ length: 7 }, (_, i) => {
      const fecha = addDays(semanaInicio, i);
      const diaNumero = new Date(`${fecha}T12:00:00`).getDay();
      return {
        fecha,
        diaLabel: DIAS_SEMANA_LABEL[diaNumero],
        fechaLabel: formatDiaMes(fecha)
      };
    });
  }, [semanaInicio]);

  const sesionesPorFecha = useMemo(() => {
    const map = new Map<string, SesionClase[]>();
    for (const s of sesiones) {
      const list = map.get(s.fecha) ?? [];
      list.push(s);
      map.set(s.fecha, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.horaInicio ?? "").localeCompare(b.horaInicio ?? ""));
    }
    return map;
  }, [sesiones]);

  const programaNombre = programas.find((p) => String(p.idProgramaFormacion) === programaId)
    ?.nombrePrograma;
  const competenciaNombre = competencias.find((c) => String(c.idCurso) === competenciaId)?.nombreCurso;
  const fichaNumero = fichas.find((f) => String(f.idFicha) === fichaId)?.numeroFicha ?? fichaId;
  const claseSeleccionada = clases.find((c) => String(c.idClase) === claseId);
  const claseActiva: Clase | null = horarioClase ?? claseSeleccionada ?? null;
  const claseActivaId = claseActiva ? String(claseActiva.idClase) : "";
  const escaneoClase = claseActiva
    ? evaluarEscaneoClase({
        fecha: claseActiva.fecha,
        horaInicio: claseActiva.horaInicio
      })
    : { permitido: false, motivo: null };
  const puedeEscanear = Boolean(claseActiva) && escaneoClase.permitido;

  const handleAttendanceRegistered = useCallback(async () => {
    if (!claseActivaId) return;
    await loadAsistencias(claseActivaId);
  }, [claseActivaId, loadAsistencias]);

  useEffect(() => {
    if (!claseActivaId) {
      setAsistencias([]);
      return;
    }
    void loadAsistencias(claseActivaId);
  }, [claseActivaId, loadAsistencias]);

  useEffect(() => {
    if (!puedeEscanear) {
      setScannerOpen(false);
    }
  }, [puedeEscanear]);

  const handleSesionClick = (s: SesionClase) => {
    const hoy = fechaHoyBogota();

    if (s.fecha !== hoy) {
      setHorarioMensaje(
        `Solo puede escanear el dia de la clase. Esta sesion es del ${s.fecha}.`
      );
      return;
    }

    setHorarioMensaje(null);
    setClaseId("");
    setHorarioClase({
      idClase: s.idClase,
      nombreTema: s.nombreTema,
      fecha: s.fecha,
      horaInicio: s.horaInicio,
      ambiente: { nombreAmbiente: s.ambienteNombre },
      competenciaNombre: s.competenciaNombre
    });
    setScannerOpen(true);
  };

  const disableCompetenciaFicha =
    !programaId || loadingProgramas || loadingRelaciones;
  const disableClase = !fichaId || !competenciaId || loadingClases;
  const canExport = Boolean(claseActiva) && !loadingAsistencias;

  const buildExportContext = useCallback(() => {
    if (!claseActiva) return null;

    return {
      claseId: claseActiva.idClase,
      claseFecha: claseActiva.fecha,
      claseHoraInicio: claseActiva.horaInicio,
      ambiente: claseActiva.ambiente.nombreAmbiente,
      programaNombre: programaNombre ?? null,
      competenciaNombre: claseActiva.competenciaNombre ?? competenciaNombre ?? null,
      fichaNumero: fichaNumero ? String(fichaNumero) : null,
      asistencias
    };
  }, [
    asistencias,
    claseActiva,
    competenciaNombre,
    fichaNumero,
    programaNombre
  ]);

  const handleExportPdf = () => {
    const context = buildExportContext();
    if (!context) return;
    exportAsistenciaClasePdf(context);
  };

  const handleExportExcel = async () => {
    const context = buildExportContext();
    if (!context) return;
    await exportAsistenciaClaseExcel(context);
  };

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Gestion de asistencia</h1>
      <p className={styles.subtitle}>
        Consulte el registro de asistencia eligiendo programa de formacion, competencia, ficha y clase.
      </p>

      <section
        id="instructor-filtros"
        className={styles.panel}
        aria-labelledby="filtros-titulo"
      >
        <h2 id="filtros-titulo" className={styles.panelTitle}>
          Filtros de consulta
        </h2>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="filtro-programa">
              Programa de formacion
            </label>
            <select
              id="filtro-programa"
              className={styles.select}
              value={programaId}
              onChange={(e) => onProgramaChange(e.target.value)}
              disabled={loadingProgramas}
            >
              <option value="">
                {loadingProgramas ? "Cargando..." : "Seleccione un programa"}
              </option>
              {programas.map((p) => (
                <option key={p.idProgramaFormacion} value={p.idProgramaFormacion}>
                  {p.nombrePrograma}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="filtro-competencia">
              Competencia
            </label>
            <select
              id="filtro-competencia"
              className={styles.select}
              value={competenciaId}
              onChange={(e) => onCompetenciaChange(e.target.value)}
              disabled={disableCompetenciaFicha}
            >
              <option value="">
                {!programaId
                  ? "Seleccione primero un programa"
                  : loadingRelaciones
                    ? "Cargando..."
                    : "Seleccione una competencia"}
              </option>
              {competencias.map((c) => (
                <option key={c.idCurso} value={c.idCurso}>
                  {c.nombreCurso}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="filtro-ficha">
              Ficha
            </label>
            <select
              id="filtro-ficha"
              className={styles.select}
              value={fichaId}
              onChange={(e) => onFichaChange(e.target.value)}
              disabled={disableCompetenciaFicha}
            >
              <option value="">
                {!programaId
                  ? "Seleccione primero un programa"
                  : loadingRelaciones
                    ? "Cargando..."
                    : "Seleccione una ficha"}
              </option>
              {fichas.map((f) => (
                <option key={f.idFicha} value={f.idFicha}>
                  {f.numeroFicha ?? `Ficha ${f.idFicha}`}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="filtro-clase">
              Clase
            </label>
            <select
              id="filtro-clase"
              className={styles.select}
              value={claseId}
              onChange={(e) => onClaseChange(e.target.value)}
              disabled={disableClase}
            >
              <option value="">
                {!fichaId || !competenciaId
                  ? "Seleccione ficha y competencia"
                  : loadingClases
                    ? "Cargando..."
                    : "Seleccione una clase"}
              </option>
              {clases.map((c) => (
                <option key={c.idClase} value={c.idClase}>
                  {claseDisplayLabel(c)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {programaId && competenciaId && fichaId ? (
          <p className={styles.summary}>
            Clase para consultar asistencia:{" "}
            <strong>{programaNombre ?? programaId}</strong>
            {" · "}
            <strong>{competenciaNombre ?? competenciaId}</strong>
            {" · "}
            Ficha <strong>{fichaNumero}</strong>
            {claseActiva ? (
              <>
                {" · "}
                Clase{" "}
                <strong>
                  {claseActiva.nombreTema ?? `#${claseActiva.idClase}`}
                </strong>
                {claseActiva.fecha ? ` (${claseActiva.fecha})` : ""}
              </>
            ) : null}
          </p>
        ) : null}

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </section>

      {fichaId ? (
        <section
          id="instructor-horario"
          className={styles.horarioPanel}
          aria-labelledby="horario-titulo"
        >
          <h2 id="horario-titulo" className={styles.asistenciasTitle}>
            Horario de la ficha
          </h2>
          <p className={styles.asistenciasMeta}>
            Clases programadas para la ficha <strong>{fichaNumero}</strong> por fecha. Haga clic en
            la clase del dia de hoy para escanear la asistencia.
          </p>

          {loadingHorario ? (
            <p className={styles.loadingMuted}>Cargando horario...</p>
          ) : horario.length === 0 || !semanaInicio ? (
            <p className={styles.emptyMuted}>No hay clases programadas para esta ficha.</p>
          ) : (
            <>
              <div className={styles.semanaNav}>
                <button
                  type="button"
                  className={styles.semanaNavBtn}
                  onClick={() => setSemanaInicio((prev) => (prev ? addDays(prev, -7) : prev))}
                  aria-label="Semana anterior"
                >
                  ‹
                </button>
                <div className={styles.semanaNavCenter}>
                  <span className={styles.semanaNavLabel}>
                    {formatDiaMes(semanaInicio)} — {formatDiaMes(addDays(semanaInicio, 6))}
                  </span>
                  <button
                    type="button"
                    className={styles.semanaHoyBtn}
                    onClick={() => setSemanaInicio(inicioSemana(fechaHoyBogota()))}
                  >
                    Hoy
                  </button>
                </div>
                <button
                  type="button"
                  className={styles.semanaNavBtn}
                  onClick={() => setSemanaInicio((prev) => (prev ? addDays(prev, 7) : prev))}
                  aria-label="Semana siguiente"
                >
                  ›
                </button>
              </div>

              {horarioMensaje ? (
                <p className={styles.scanHint} role="status">
                  {horarioMensaje}
                </p>
              ) : null}

              <div className={styles.horarioGrid}>
                {diasSemana.map((dia) => {
                  const hoy = fechaHoyBogota();
                  const esDiaHoy = dia.fecha === hoy;
                  const sesionesDia = sesionesPorFecha.get(dia.fecha) ?? [];
                  return (
                    <div
                      key={dia.fecha}
                      className={`${styles.horarioDia} ${esDiaHoy ? styles.horarioDiaHoy : ""}`}
                    >
                      <h3 className={styles.horarioDiaTitulo}>
                        <span>{dia.diaLabel}</span>
                        <span className={styles.horarioDiaFecha}>{dia.fechaLabel}</span>
                      </h3>
                      {sesionesDia.length === 0 ? (
                        <p className={styles.horarioDiaVacio}>Sin clases</p>
                      ) : (
                        sesionesDia.map((s) => {
                          const activa = Boolean(
                            horarioClase && horarioClase.idClase === s.idClase
                          );
                          return (
                            <button
                              key={s.idClase}
                              type="button"
                              className={`${styles.horarioCard} ${
                                esDiaHoy ? styles.horarioCardHoy : ""
                              } ${activa ? styles.horarioCardActiva : ""}`}
                              onClick={() => handleSesionClick(s)}
                            >
                              <span className={styles.horarioCardHora}>
                                {s.horaInicio ?? "Sin hora"}
                              </span>
                              <span className={styles.horarioCardTema}>
                                {s.nombreTema ?? "Clase"}
                              </span>
                              <span className={styles.horarioCardMeta}>
                                {s.competenciaNombre}
                                {s.ambienteNombre ? ` · ${s.ambienteNombre}` : ""}
                              </span>
                              {esDiaHoy ? (
                                <span className={styles.horarioCardTags}>
                                  <span className={styles.horarioBadgeHoy}>Hoy · escanear</span>
                                </span>
                              ) : null}
                            </button>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      ) : null}

      {claseActiva ? (
        <section
          id="instructor-escaner"
          className={styles.escanerPanel}
          aria-labelledby="escaner-titulo"
        >
          <h2 id="escaner-titulo" className={styles.asistenciasTitle}>
            Registro de asistencia por QR
          </h2>
          <p className={styles.asistenciasMeta}>
            Clase seleccionada: <strong>{claseDisplayLabel(claseActiva)}</strong>
          </p>

          <div className={styles.actionsRow}>
            <button
              type="button"
              className={styles.scanButton}
              onClick={() => setScannerOpen((current) => !current)}
              aria-expanded={scannerOpen}
              disabled={!puedeEscanear}
              title={!puedeEscanear ? escaneoClase.motivo ?? undefined : undefined}
            >
              {scannerOpen ? "Ocultar escaner QR" : "Escanear QR de aprendices"}
            </button>
            {!puedeEscanear && escaneoClase.motivo ? (
              <p className={styles.scanHint} role="status">
                {escaneoClase.motivo}
              </p>
            ) : null}
          </div>

          {scannerOpen && puedeEscanear ? (
            <div className={styles.scannerWrap}>
              <InstructorAttendanceQrScanner
                claseId={claseActiva.idClase}
                claseLabel={claseDisplayLabel(claseActiva)}
                onAttendanceRegistered={handleAttendanceRegistered}
                onClose={() => setScannerOpen(false)}
              />
            </div>
          ) : null}
        </section>
      ) : null}

      <section
        id="instructor-asistencias"
        className={styles.asistenciasPanel}
        aria-labelledby="asistencias-titulo"
      >
        <h2 id="asistencias-titulo" className={styles.asistenciasTitle}>
          Asistencia registrada en la clase
        </h2>

        {!claseActiva ? (
          <p className={styles.hint}>
            Seleccione una clase en los filtros o en el horario para ver la asistencia.
          </p>
        ) : (
          <>
            {claseActiva ? (
              <p className={styles.asistenciasMeta}>
                {claseActiva.nombreTema ?? `Clase #${claseActiva.idClase}`}
                {claseActiva.fecha ? ` · ${claseActiva.fecha}` : ""}
                {claseActiva.horaInicio ? ` · ${claseActiva.horaInicio}` : ""}
                {claseActiva.ambiente.nombreAmbiente
                  ? ` · ${claseActiva.ambiente.nombreAmbiente}`
                  : ""}
              </p>
            ) : null}

            <InstructorAttendanceChart
              asistencias={asistencias}
              loading={loadingAsistencias}
            />

            {claseActiva ? (
              <div className={styles.exportRow}>
                <button
                  type="button"
                  className={`${styles.exportButton} ${styles.exportButtonPdf}`}
                  onClick={handleExportPdf}
                  disabled={!canExport}
                >
                  Descargar PDF
                </button>
                <button
                  type="button"
                  className={`${styles.exportButton} ${styles.exportButtonExcel}`}
                  onClick={handleExportExcel}
                  disabled={!canExport}
                >
                  Descargar Excel
                </button>
              </div>
            ) : null}

            {!loadingAsistencias && asistencias.length === 0 ? (
              <p className={styles.emptyMuted}>
                No hay asistencia registrada para esta clase.
              </p>
            ) : null}

            {!loadingAsistencias && asistencias.length > 0 ? (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Aprendiz</th>
                      <th scope="col">Documento</th>
                      <th scope="col">Fecha</th>
                      <th scope="col">Hora ingreso</th>
                      <th scope="col">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asistencias.map((a) => (
                      <tr key={a.idAsistencia}>
                        <td>{a.aprendizNombre ?? a.idAprendiz ?? "—"}</td>
                        <td>{a.documentoAprendiz ?? "—"}</td>
                        <td>{a.fecha ?? "—"}</td>
                        <td>{a.horaIngreso ?? "—"}</td>
                        <td>
                          {a.estado ? (
                            <span className={`${styles.estado} ${estadoClass(a.estado)}`}>
                              {a.estado}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
