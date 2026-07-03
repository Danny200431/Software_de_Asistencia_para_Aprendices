"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { QRCode } from "react-qr-code";
import styles from "./InstructorGestion.module.css";
import {
  type AprendizFormErrors,
  type AprendizFormField,
  type AprendizFormValues,
  type AprendizValidationContext,
  hasAprendizFormErrors,
  validateAprendizForm
} from "@/src/features/instructor/lib/validateAprendizForm";
import { PasswordRequirementsChecklist } from "./PasswordRequirementsChecklist";
import {
  readAprendicesImportError,
  uploadAprendicesImportFile,
  type AprendicesImportApiResult
} from "@/src/features/instructor/lib/aprendicesBulkImport";
import {
  APRENDIZ_ESTADO_DEFAULT,
  type AprendizEstado,
  formatAprendizEstadoLabel,
  normalizeAprendizEstado
} from "@/src/lib/aprendizEstado";

type ProgramaOpt = { idProgramaFormacion: number; nombrePrograma: string };
type FichaOpt = { idFicha: number; numeroFicha: string | null };

function authConfig() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
}

type AprendizRow = {
  fichaIdFicha: number;
  usuarioIdUsuario: number;
  estado: string;
  programaNombre: string | null;
  usuario: {
    idUsuario: number;
    nombre: string;
    apellido: string;
    numeroDocumento: string;
    correoElectronico: string;
    telefono: string;
    usemame: string;
    idTipoDocumento: string;
    idGenero: string;
    rolIdRol: number;
    qrCode: string | null;
  };
  ficha: {
    idFicha: number;
    numeroFicha: string | null;
    idProgramaFormacion: string | null;
  };
};

type FichaGroup = {
  fichaIdFicha: number;
  numeroFicha: string | null;
  programaNombre: string | null;
  aprendices: AprendizRow[];
};

const emptyForm = () => ({
  nombre: "",
  apellido: "",
  numeroDocumento: "",
  idTipoDocumento: "CC",
  idGenero: "M",
  telefono: "",
  correoElectronico: "",
  usemame: "",
  contrasenia: "",
  idProgramaFormacion: "",
  fichaIdFicha: "",
  estado: APRENDIZ_ESTADO_DEFAULT
});

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

export function InstructorAprendicesCrud() {
  const [aprendices, setAprendices] = useState<AprendizRow[]>([]);
  const [programas, setProgramas] = useState<ProgramaOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingUsuarioId, setEditingUsuarioId] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [idTipoDocumento, setIdTipoDocumento] = useState("CC");
  const [idGenero, setIdGenero] = useState("M");
  const [telefono, setTelefono] = useState("");
  const [correoElectronico, setCorreoElectronico] = useState("");
  const [usemame, setUsemame] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [idProgramaFormacion, setIdProgramaFormacion] = useState("");
  const [fichaIdFicha, setFichaIdFicha] = useState("");
  const [estado, setEstado] = useState<AprendizEstado>(APRENDIZ_ESTADO_DEFAULT);
  const [fichasOptions, setFichasOptions] = useState<FichaOpt[]>([]);
  const [loadingFichas, setLoadingFichas] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AprendizFormErrors>({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [qrModal, setQrModal] = useState<{
    nombre: string;
    apellido: string;
    value: string;
  } | null>(null);
  const [expandedFichas, setExpandedFichas] = useState<Set<number>>(new Set());

  const [bulkProgramaId, setBulkProgramaId] = useState("");
  const [bulkFichaId, setBulkFichaId] = useState("");
  const [bulkFichasOptions, setBulkFichasOptions] = useState<FichaOpt[]>([]);
  const [bulkLoadingFichas, setBulkLoadingFichas] = useState(false);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<AprendicesImportApiResult | null>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const bulkDownloadFormRef = useRef<HTMLFormElement>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await axios.get<{
        ok: boolean;
        aprendices?: AprendizRow[];
        programas?: ProgramaOpt[];
        error?: string;
      }>("/api/instructor/aprendices", authConfig());
      if (!data.ok) {
        setError(data.error ?? "No se pudieron cargar los datos");
        return;
      }
      setAprendices(data.aprendices ?? []);
      setProgramas(data.programas ?? []);
    } catch {
      setError("No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!qrModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQrModal(null);
    };
    globalThis.addEventListener("keydown", onKey);
    return () => globalThis.removeEventListener("keydown", onKey);
  }, [qrModal]);

  const getValidationContext = (): AprendizValidationContext => ({
    existing: aprendices.map((a) => ({
      usuarioIdUsuario: a.usuarioIdUsuario,
      numeroDocumento: a.usuario.numeroDocumento,
      correoElectronico: a.usuario.correoElectronico,
      telefono: a.usuario.telefono
    }))
  });

  const mapApiErrorToFieldErrors = (msg: string): AprendizFormErrors => {
    const errors: AprendizFormErrors = {};
    if (msg.includes("correo electronico")) errors.correoElectronico = msg;
    else if (msg.includes("telefono")) errors.telefono = msg;
    else if (msg.includes("documento")) errors.numeroDocumento = msg;
    else if (msg.includes("usuario")) errors.usemame = msg;
    else if (msg.includes("contraseña") || msg.includes("contrasenia")) errors.contrasenia = msg;
    return errors;
  };

  const getFormValues = (): AprendizFormValues => ({
    nombre,
    apellido,
    numeroDocumento,
    idTipoDocumento,
    idGenero,
    telefono,
    correoElectronico,
    usemame,
    contrasenia,
    idProgramaFormacion,
    fichaIdFicha,
    editingUsuarioId
  });

  const clearValidationState = () => {
    setFieldErrors({});
    setFormSubmitted(false);
  };

  const showFieldError = (field: AprendizFormField) =>
    formSubmitted ? fieldErrors[field] : undefined;

  const inputClass = (field: AprendizFormField, base: string) =>
    showFieldError(field) ? `${base} ${styles.inputInvalid}` : base;

  const applyEmpty = () => {
    const e = emptyForm();
    setNombre(e.nombre);
    setApellido(e.apellido);
    setNumeroDocumento(e.numeroDocumento);
    setIdTipoDocumento(e.idTipoDocumento);
    setIdGenero(e.idGenero);
    setTelefono(e.telefono);
    setCorreoElectronico(e.correoElectronico);
    setUsemame(e.usemame);
    setContrasenia(e.contrasenia);
    setIdProgramaFormacion(e.idProgramaFormacion);
    setFichaIdFicha(e.fichaIdFicha);
    setEstado(e.estado);
    setFichasOptions([]);
  };

  const loadFichasPorPrograma = async (programaId: string) => {
    if (!programaId) {
      setFichasOptions([]);
      return;
    }
    setLoadingFichas(true);
    try {
      const { data } = await axios.get<{ ok: boolean; fichas?: FichaOpt[] }>(
        `/api/instructor/filtros?tipo=fichas&programaId=${encodeURIComponent(programaId)}`,
        authConfig()
      );
      setFichasOptions(data.ok && data.fichas ? data.fichas : []);
    } catch {
      setFichasOptions([]);
    } finally {
      setLoadingFichas(false);
    }
  };

  const loadBulkFichasPorPrograma = async (programaId: string) => {
    if (!programaId) {
      setBulkFichasOptions([]);
      return;
    }
    setBulkLoadingFichas(true);
    try {
      const { data } = await axios.get<{ ok: boolean; fichas?: FichaOpt[] }>(
        `/api/instructor/filtros?tipo=fichas&programaId=${encodeURIComponent(programaId)}`,
        authConfig()
      );
      setBulkFichasOptions(data.ok && data.fichas ? data.fichas : []);
    } catch {
      setBulkFichasOptions([]);
    } finally {
      setBulkLoadingFichas(false);
    }
  };

  const bulkSelectionReady = bulkProgramaId.trim() !== "" && bulkFichaId.trim() !== "";

  const handleDownloadTemplate = () => {
    if (!bulkSelectionReady) {
      setBulkError("Seleccione programa y ficha antes de descargar la plantilla");
      return;
    }

    setBulkError(null);
    bulkDownloadFormRef.current?.requestSubmit();
  };

  const handleImportFile = async (file: File | null) => {
    if (!file) return;

    if (!bulkSelectionReady) {
      setBulkError("Seleccione programa y ficha antes de cargar el archivo");
      return;
    }

    setBulkError(null);
    setBulkResult(null);
    setBulkImporting(true);

    try {
      const result = await uploadAprendicesImportFile(file, bulkProgramaId, bulkFichaId);
      if (!result.ok) {
        setBulkError(result.error ?? "No se pudo importar el archivo");
        return;
      }

      setBulkResult(result);
      if ((result.creados ?? 0) > 0) {
        await load();
      }
    } catch (err) {
      setBulkError(await readAprendicesImportError(err));
    } finally {
      setBulkImporting(false);
      if (bulkFileInputRef.current) {
        bulkFileInputRef.current.value = "";
      }
    }
  };

  const resetForm = () => {
    setEditingUsuarioId(null);
    applyEmpty();
    clearValidationState();
  };

  const startEdit = async (row: AprendizRow) => {
    clearValidationState();
    setEditingUsuarioId(row.usuarioIdUsuario);
    setNombre(row.usuario.nombre);
    setApellido(row.usuario.apellido);
    setNumeroDocumento(row.usuario.numeroDocumento);
    setIdTipoDocumento(row.usuario.idTipoDocumento);
    setIdGenero(row.usuario.idGenero);
    setTelefono(row.usuario.telefono);
    setCorreoElectronico(row.usuario.correoElectronico);
    setUsemame(row.usuario.usemame);
    setContrasenia("");
    const prog =
      row.ficha.idProgramaFormacion != null && row.ficha.idProgramaFormacion !== ""
        ? row.ficha.idProgramaFormacion
        : "";
    setIdProgramaFormacion(prog);
    setFichaIdFicha("");
    await loadFichasPorPrograma(prog);
    setFichaIdFicha(String(row.fichaIdFicha));
    setEstado(normalizeAprendizEstado(row.estado) ?? APRENDIZ_ESTADO_DEFAULT);
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setFormSubmitted(true);

    const values = getFormValues();
    const errors = validateAprendizForm(values, getValidationContext());
    setFieldErrors(errors);

    if (hasAprendizFormErrors(errors)) {
      const firstInvalid = document.querySelector<HTMLElement>("[aria-invalid='true']");
      firstInvalid?.focus();
      return;
    }

    setSaving(true);

    try {
      const progTrim = idProgramaFormacion.trim();
      const fichaNum = Number.parseInt(fichaIdFicha, 10);

      if (editingUsuarioId != null) {
        const payload: Record<string, unknown> = {
          nombre,
          apellido,
          numeroDocumento,
          idTipoDocumento,
          idGenero,
          telefono,
          correoElectronico,
          usemame,
          idProgramaFormacion: progTrim,
          fichaIdFicha: fichaNum,
          estado
        };
        if (contrasenia.trim() !== "") {
          payload.contrasenia = contrasenia;
        }
        await axios.put(`/api/instructor/aprendices/${editingUsuarioId}`, payload, authConfig());
      } else {
        await axios.post(
          "/api/instructor/aprendices",
          {
            nombre,
            apellido,
            numeroDocumento,
            idTipoDocumento,
            idGenero,
            telefono,
            correoElectronico,
            usemame,
            contrasenia,
            tipoDocumentoIdTipoDocumento: 1,
            idProgramaFormacion: progTrim,
            fichaIdFicha: fichaNum,
            estado
          },
          authConfig()
        );
      }
      resetForm();
      await load();
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object"
          ? (err.response.data as { error?: string }).error
          : null;
      const fallback = msg ?? "No se pudo guardar el aprendiz";
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

  const remove = async (usuarioId: number) => {
    if (
      !globalThis.confirm(
        "Eliminar este aprendiz? Se eliminara su usuario y su vinculo como aprendiz. La ficha, las clases y las asistencias del grupo no se borran."
      )
    ) {
      return;
    }
    setError(null);
    try {
      await axios.delete(`/api/instructor/aprendices/${usuarioId}`, authConfig());
      if (editingUsuarioId === usuarioId) resetForm();
      await load();
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object"
          ? (err.response.data as { error?: string }).error
          : null;
      setError(msg ?? "No se pudo eliminar el aprendiz");
    }
  };

  const showPasswordRulesPopover =
    editingUsuarioId == null && formSubmitted && !!fieldErrors.contrasenia;

  const estadoBadgeClass = (value: string | null | undefined) => {
    const normalized = normalizeAprendizEstado(value);
    if (normalized === "activo") return styles.estadoActivo;
    if (normalized === "inactivo") return styles.estadoInactivo;
    return styles.estadoOtro;
  };

  const gruposPorFicha = useMemo<FichaGroup[]>(() => {
    const map = new Map<number, FichaGroup>();
    for (const a of aprendices) {
      let g = map.get(a.fichaIdFicha);
      if (!g) {
        g = {
          fichaIdFicha: a.fichaIdFicha,
          numeroFicha: a.ficha.numeroFicha,
          programaNombre: a.programaNombre,
          aprendices: []
        };
        map.set(a.fichaIdFicha, g);
      }
      g.aprendices.push(a);
    }
    const result = [...map.values()];
    for (const g of result) {
      g.aprendices.sort((x, y) =>
        `${x.usuario.apellido} ${x.usuario.nombre}`.localeCompare(
          `${y.usuario.apellido} ${y.usuario.nombre}`,
          "es"
        )
      );
    }
    result.sort((a, b) =>
      (a.numeroFicha ?? String(a.fichaIdFicha)).localeCompare(
        b.numeroFicha ?? String(b.fichaIdFicha),
        "es",
        { numeric: true }
      )
    );
    return result;
  }, [aprendices]);

  const toggleFicha = (fichaId: number) => {
    setExpandedFichas((prev) => {
      const next = new Set(prev);
      if (next.has(fichaId)) next.delete(fichaId);
      else next.add(fichaId);
      return next;
    });
  };

  const renderAprendizRow = (v: AprendizRow) => (
    <tr key={v.usuarioIdUsuario}>
      <td>
        {v.usuario.nombre} {v.usuario.apellido}
      </td>
      <td>{v.usuario.numeroDocumento}</td>
      <td>{v.usuario.usemame}</td>
      <td>{v.ficha.numeroFicha ?? v.ficha.idFicha}</td>
      <td>{v.programaNombre ?? "—"}</td>
      <td>
        <span className={`${styles.estadoBadge} ${estadoBadgeClass(v.estado)}`}>
          {formatAprendizEstadoLabel(v.estado)}
        </span>
      </td>
      <td>
        <div className={styles.rowActions}>
          <button type="button" className={styles.rowBtn} onClick={() => void startEdit(v)}>
            Editar
          </button>
          <button
            type="button"
            className={styles.rowBtn}
            disabled={!v.usuario.qrCode || v.usuario.qrCode.trim() === ""}
            onClick={() =>
              v.usuario.qrCode
                ? setQrModal({
                    nombre: v.usuario.nombre,
                    apellido: v.usuario.apellido,
                    value: v.usuario.qrCode
                  })
                : undefined
            }
          >
            Ver QR
          </button>
          <button
            type="button"
            className={`${styles.rowBtn} ${styles.rowBtnDanger}`}
            onClick={() => void remove(v.usuarioIdUsuario)}
          >
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Gestion de aprendices</h1>
      <p className={styles.subtitle}>
        Elija primero el programa de formacion y luego la ficha existente de ese programa. Complete
        los datos personales y el acceso al sistema. El codigo QR se genera solo al registrar; use
        Ver QR en la tabla para mostrarlo. Edite o elimine cuando sea necesario.
      </p>

      <section className={styles.formPanel} aria-labelledby="aprendices-bulk-titulo">
        <h2 id="aprendices-bulk-titulo" className={styles.formTitle}>
          Carga masiva por Excel
        </h2>
        <p className={styles.importHint}>
          Seleccione el programa y la ficha destino, descargue la plantilla, complete una fila por
          aprendiz y cargue el archivo. Todos los registros del Excel se asignaran a esa ficha.
        </p>
        <div className={`${styles.formGrid} ${styles.importFormGrid}`}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="bulk-programa">
              Programa de formacion
            </label>
            <select
              id="bulk-programa"
              className={styles.select}
              value={bulkProgramaId}
              onChange={(e) => {
                const value = e.target.value;
                setBulkProgramaId(value);
                setBulkFichaId("");
                setBulkResult(null);
                setBulkError(null);
                void loadBulkFichasPorPrograma(value);
              }}
            >
              <option value="">Seleccione programa</option>
              {programas.map((p) => (
                <option key={p.idProgramaFormacion} value={String(p.idProgramaFormacion)}>
                  {p.nombrePrograma}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="bulk-ficha">
              Ficha destino
            </label>
            <select
              id="bulk-ficha"
              className={styles.select}
              value={bulkFichaId}
              onChange={(e) => {
                setBulkFichaId(e.target.value);
                setBulkResult(null);
                setBulkError(null);
              }}
              disabled={!bulkProgramaId || bulkLoadingFichas}
            >
              <option value="">
                {!bulkProgramaId
                  ? "Seleccione primero un programa"
                  : bulkLoadingFichas
                    ? "Cargando fichas..."
                    : bulkFichasOptions.length === 0
                      ? "No hay fichas en este programa"
                      : "Seleccione ficha"}
              </option>
              {bulkFichasOptions.map((f) => (
                <option key={f.idFicha} value={String(f.idFicha)}>
                  {f.numeroFicha != null && f.numeroFicha !== ""
                    ? f.numeroFicha
                    : `Ficha #${f.idFicha}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {bulkSelectionReady ? (
          <p className={styles.importMeta}>
            La plantilla incluira el programa y la ficha seleccionados. Elimine la fila de ejemplo
            antes de cargar el archivo.
          </p>
        ) : null}

        <form
          ref={bulkDownloadFormRef}
          method="GET"
          action="/api/instructor/aprendices/plantilla"
          target="aprendices-plantilla-download"
          className={styles.hiddenDownloadForm}
          aria-hidden="true"
        >
          <input type="hidden" name="programaId" value={bulkProgramaId} />
          <input type="hidden" name="fichaId" value={bulkFichaId} />
        </form>
        <iframe
          name="aprendices-plantilla-download"
          title="Descarga de plantilla Excel"
          className={styles.hiddenDownloadFrame}
        />

        <div className={styles.formActions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
            disabled={!bulkSelectionReady || bulkImporting}
            onClick={handleDownloadTemplate}
          >
            Descargar plantilla
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={!bulkSelectionReady || bulkImporting}
            onClick={() => bulkFileInputRef.current?.click()}
          >
            {bulkImporting ? "Importando..." : "Cargar Excel"}
          </button>
          <input
            ref={bulkFileInputRef}
            className={styles.hiddenFileInput}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => void handleImportFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {bulkError ? (
          <p className={styles.error} role="alert">
            {bulkError}
          </p>
        ) : null}

        {bulkResult?.ok ? (
          <div
            className={`${styles.importResult} ${
              (bulkResult.errores?.length ?? 0) > 0
                ? styles.importResultWarning
                : styles.importResultSuccess
            }`}
            role="status"
          >
            <p style={{ margin: 0 }}>
              Importacion completada: {bulkResult.creados ?? 0} aprendiz
              {(bulkResult.creados ?? 0) === 1 ? "" : "es"} creado
              {(bulkResult.creados ?? 0) === 1 ? "" : "s"}
              {(bulkResult.omitidos ?? 0) > 0
                ? `, ${bulkResult.omitidos} fila${(bulkResult.omitidos ?? 0) === 1 ? "" : "s"} omitida${(bulkResult.omitidos ?? 0) === 1 ? "" : "s"}`
                : ""}
              {(bulkResult.errores?.length ?? 0) > 0
                ? `, ${bulkResult.errores?.length ?? 0} con error${(bulkResult.errores?.length ?? 0) === 1 ? "" : "es"}`
                : ""}
              .
            </p>
            {(bulkResult.errores?.length ?? 0) > 0 ? (
              <ul className={styles.importErrorList}>
                {bulkResult.errores?.map((item) => (
                  <li key={`${item.fila}-${item.mensaje}`}>
                    Fila {item.fila}: {item.mensaje}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className={styles.formPanel} aria-labelledby="aprendices-form-titulo">
        <h2 id="aprendices-form-titulo" className={styles.formTitle}>
          {editingUsuarioId != null ? `Editar aprendiz #${editingUsuarioId}` : "Nuevo aprendiz"}
        </h2>
        <form
          id="aprendices-form"
          noValidate
          onSubmit={(e) => void submit(e)}
        >
          <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ap-nombre">
              Nombre
            </label>
            <input
              id="ap-nombre"
              className={inputClass("nombre", styles.input)}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoComplete="given-name"
              required
              aria-invalid={showFieldError("nombre") ? true : undefined}
              aria-describedby={showFieldError("nombre") ? "ap-nombre-error" : undefined}
            />
            <FieldError id="ap-nombre-error" message={showFieldError("nombre") || undefined} />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ap-apellido">
              Apellido
            </label>
            <input
              id="ap-apellido"
              className={inputClass("apellido", styles.input)}
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              autoComplete="family-name"
              required
              aria-invalid={showFieldError("apellido") ? true : undefined}
              aria-describedby={showFieldError("apellido") ? "ap-apellido-error" : undefined}
            />
            <FieldError id="ap-apellido-error" message={showFieldError("apellido") || undefined} />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ap-doc">
              Numero de documento
            </label>
            <input
              id="ap-doc"
              className={inputClass("numeroDocumento", styles.input)}
              value={numeroDocumento}
              onChange={(e) => setNumeroDocumento(e.target.value)}
              autoComplete="off"
              inputMode="numeric"
              required
              aria-invalid={showFieldError("numeroDocumento") ? true : undefined}
              aria-describedby={showFieldError("numeroDocumento") ? "ap-doc-error" : undefined}
            />
            <FieldError
              id="ap-doc-error"
              message={showFieldError("numeroDocumento") || undefined}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ap-tipo-doc">
              Tipo documento
            </label>
            <input
              id="ap-tipo-doc"
              className={inputClass("idTipoDocumento", styles.input)}
              value={idTipoDocumento}
              onChange={(e) => setIdTipoDocumento(e.target.value)}
              placeholder="CC"
              required
              aria-invalid={showFieldError("idTipoDocumento") ? true : undefined}
              aria-describedby={showFieldError("idTipoDocumento") ? "ap-tipo-doc-error" : undefined}
            />
            <FieldError
              id="ap-tipo-doc-error"
              message={showFieldError("idTipoDocumento") || undefined}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ap-genero">
              Genero
            </label>
            <select
              id="ap-genero"
              className={inputClass("idGenero", styles.select)}
              value={idGenero}
              onChange={(e) => setIdGenero(e.target.value)}
              required
              aria-invalid={showFieldError("idGenero") ? true : undefined}
              aria-describedby={showFieldError("idGenero") ? "ap-genero-error" : undefined}
            >
              <option value="M">M</option>
              <option value="F">F</option>
              <option value="O">Otro</option>
            </select>
            <FieldError id="ap-genero-error" message={showFieldError("idGenero") || undefined} />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ap-tel">
              Telefono
            </label>
            <input
              id="ap-tel"
              className={inputClass("telefono", styles.input)}
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              autoComplete="tel"
              inputMode="tel"
              required
              aria-invalid={showFieldError("telefono") ? true : undefined}
              aria-describedby={showFieldError("telefono") ? "ap-tel-error" : undefined}
            />
            <FieldError id="ap-tel-error" message={showFieldError("telefono") || undefined} />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ap-correo">
              Correo electronico
            </label>
            <input
              id="ap-correo"
              className={inputClass("correoElectronico", styles.input)}
              type="email"
              value={correoElectronico}
              onChange={(e) => setCorreoElectronico(e.target.value)}
              autoComplete="email"
              required
              aria-invalid={showFieldError("correoElectronico") ? true : undefined}
              aria-describedby={showFieldError("correoElectronico") ? "ap-correo-error" : undefined}
            />
            <FieldError
              id="ap-correo-error"
              message={showFieldError("correoElectronico") || undefined}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ap-user">
              Usuario (login)
            </label>
            <input
              id="ap-user"
              className={inputClass("usemame", styles.input)}
              value={usemame}
              onChange={(e) => setUsemame(e.target.value)}
              autoComplete="username"
              required
              aria-invalid={showFieldError("usemame") ? true : undefined}
              aria-describedby={showFieldError("usemame") ? "ap-user-error" : undefined}
            />
            <FieldError id="ap-user-error" message={showFieldError("usemame") || undefined} />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ap-pass">
              Contraseña
              {editingUsuarioId != null ? " (dejar vacia para no cambiar)" : ""}
            </label>
            <div className={styles.fieldAnchor}>
              <input
                id="ap-pass"
                className={inputClass("contrasenia", styles.input)}
                type="password"
                value={contrasenia}
                onChange={(e) => setContrasenia(e.target.value)}
                autoComplete={editingUsuarioId != null ? "new-password" : "new-password"}
                required={editingUsuarioId == null}
                aria-invalid={showFieldError("contrasenia") ? true : undefined}
                aria-describedby={
                  showFieldError("contrasenia") && !showPasswordRulesPopover
                    ? "ap-pass-error"
                    : showPasswordRulesPopover
                      ? "ap-pass-rules"
                      : undefined
                }
              />
              <PasswordRequirementsChecklist
                id="ap-pass-rules"
                password={contrasenia}
                open={showPasswordRulesPopover}
              />
            </div>
            <FieldError
              id="ap-pass-error"
              message={
                !showPasswordRulesPopover ? showFieldError("contrasenia") || undefined : undefined
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ap-programa">
              Programa de formacion
            </label>
            <select
              id="ap-programa"
              className={inputClass("idProgramaFormacion", styles.select)}
              value={idProgramaFormacion}
              onChange={(e) => {
                const v = e.target.value;
                setIdProgramaFormacion(v);
                setFichaIdFicha("");
                void loadFichasPorPrograma(v);
              }}
              required
              aria-invalid={showFieldError("idProgramaFormacion") ? true : undefined}
              aria-describedby={
                showFieldError("idProgramaFormacion") ? "ap-programa-error" : undefined
              }
            >
              <option value="">Seleccione programa</option>
              {programas.map((p) => (
                <option key={p.idProgramaFormacion} value={String(p.idProgramaFormacion)}>
                  {p.nombrePrograma}
                </option>
              ))}
            </select>
            <FieldError
              id="ap-programa-error"
              message={showFieldError("idProgramaFormacion") || undefined}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ap-ficha">
              Ficha
            </label>
            <select
              id="ap-ficha"
              className={inputClass("fichaIdFicha", styles.select)}
              value={fichaIdFicha}
              onChange={(e) => setFichaIdFicha(e.target.value)}
              disabled={!idProgramaFormacion || loadingFichas}
              required
              aria-invalid={showFieldError("fichaIdFicha") ? true : undefined}
              aria-describedby={showFieldError("fichaIdFicha") ? "ap-ficha-error" : undefined}
            >
              <option value="">
                {!idProgramaFormacion
                  ? "Seleccione primero un programa"
                  : loadingFichas
                    ? "Cargando fichas..."
                    : fichasOptions.length === 0
                      ? "No hay fichas en este programa"
                      : "Seleccione ficha"}
              </option>
              {fichasOptions.map((f) => (
                <option key={f.idFicha} value={String(f.idFicha)}>
                  {f.numeroFicha != null && f.numeroFicha !== ""
                    ? f.numeroFicha
                    : `Ficha #${f.idFicha}`}
                </option>
              ))}
            </select>
            <FieldError id="ap-ficha-error" message={showFieldError("fichaIdFicha") || undefined} />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ap-estado">
              Estado
            </label>
            <select
              id="ap-estado"
              className={styles.select}
              value={estado}
              onChange={(e) => setEstado(e.target.value as AprendizEstado)}
              required
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          </div>
          <div className={styles.formActions}>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={saving}
            >
              {editingUsuarioId != null ? "Guardar cambios" : "Registrar aprendiz"}
            </button>
            {editingUsuarioId != null ? (
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                disabled={saving}
                onClick={resetForm}
              >
                Cancelar edicion
              </button>
            ) : null}
          </div>
        </form>
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
                <th>Nombre</th>
                <th>Documento</th>
                <th>Usuario</th>
                <th>Ficha</th>
                <th>Programa</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {aprendices.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ color: "#6b7280" }}>
                    No hay aprendices registrados.
                  </td>
                </tr>
              ) : (
                gruposPorFicha.map((g) => {
                  const expanded = expandedFichas.has(g.fichaIdFicha);
                  return (
                    <Fragment key={g.fichaIdFicha}>
                      <tr className={styles.groupRow}>
                        <td colSpan={7}>
                          <button
                            type="button"
                            className={styles.groupToggle}
                            onClick={() => toggleFicha(g.fichaIdFicha)}
                            aria-expanded={expanded}
                          >
                            <span className={styles.serieChevron}>{expanded ? "▾" : "▸"}</span>
                            <span className={styles.groupTitle}>
                              Ficha {g.numeroFicha ?? g.fichaIdFicha}
                            </span>
                            {g.programaNombre ? (
                              <span className={styles.groupSubtitle}>{g.programaNombre}</span>
                            ) : null}
                            <span className={styles.serieBadge}>{g.aprendices.length}</span>
                          </button>
                        </td>
                      </tr>
                      {expanded ? g.aprendices.map((v) => renderAprendizRow(v)) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {qrModal ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => setQrModal(null)}
        >
          <div
            className={styles.modalPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="qr-modal-title" className={styles.modalTitle}>
              Codigo QR — {qrModal.nombre} {qrModal.apellido}
            </h2>
            <div className={styles.modalQrWrap}>
              <div className={styles.modalQrInner}>
                <QRCode
                  size={256}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  value={qrModal.value}
                  viewBox="0 0 256 256"
                />
              </div>
            </div>
            <p className={styles.modalCodeText}>{qrModal.value}</p>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(qrModal.value);
                  } catch {
                    /* ignore */
                  }
                }}
              >
                Copiar valor
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => setQrModal(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
