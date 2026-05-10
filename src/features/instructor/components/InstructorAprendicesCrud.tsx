"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { QRCode } from "react-qr-code";
import styles from "./InstructorGestion.module.css";

type ProgramaOpt = { idProgramaFormacion: number; nombrePrograma: string };
type FichaOpt = { idFicha: number; numeroFicha: string | null };

type AprendizRow = {
  fichaIdFicha: number;
  usuarioIdUsuario: number;
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
  fichaIdFicha: ""
});

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
  const [fichasOptions, setFichasOptions] = useState<FichaOpt[]>([]);
  const [loadingFichas, setLoadingFichas] = useState(false);
  const [qrModal, setQrModal] = useState<{
    nombre: string;
    apellido: string;
    value: string;
  } | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await axios.get<{
        ok: boolean;
        aprendices?: AprendizRow[];
        programas?: ProgramaOpt[];
        error?: string;
      }>("/api/instructor/aprendices");
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
        `/api/instructor/filtros?tipo=fichas&programaId=${encodeURIComponent(programaId)}`
      );
      setFichasOptions(data.ok && data.fichas ? data.fichas : []);
    } catch {
      setFichasOptions([]);
    } finally {
      setLoadingFichas(false);
    }
  };

  const resetForm = () => {
    setEditingUsuarioId(null);
    applyEmpty();
  };

  const startEdit = async (row: AprendizRow) => {
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
  };

  const submit = async () => {
    setSaving(true);
    setError(null);

    try {
      const progTrim = idProgramaFormacion.trim();
      const fichaNum = Number.parseInt(fichaIdFicha, 10);
      if (!progTrim) {
        setError("Seleccione un programa de formacion");
        setSaving(false);
        return;
      }
      if (!Number.isFinite(fichaNum) || fichaNum < 1) {
        setError("Seleccione una ficha del programa");
        setSaving(false);
        return;
      }

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
          fichaIdFicha: fichaNum
        };
        if (contrasenia.trim() !== "") {
          if (contrasenia.length < 6) {
            setError("La contrasenia debe tener al menos 6 caracteres");
            setSaving(false);
            return;
          }
          payload.contrasenia = contrasenia;
        }
        await axios.put(`/api/instructor/aprendices/${editingUsuarioId}`, payload);
      } else {
        if (contrasenia.length < 6) {
          setError("La contrasenia debe tener al menos 6 caracteres");
          setSaving(false);
          return;
        }
        await axios.post("/api/instructor/aprendices", {
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
          fichaIdFicha: fichaNum
        });
      }
      resetForm();
      await load();
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object"
          ? (err.response.data as { error?: string }).error
          : null;
      setError(msg ?? "No se pudo guardar el aprendiz");
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
      await axios.delete(`/api/instructor/aprendices/${usuarioId}`);
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

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Gestion de aprendices</h1>
      <p className={styles.subtitle}>
        Elija primero el programa de formacion y luego la ficha existente de ese programa. Complete
        los datos personales y el acceso al sistema. El codigo QR se genera solo al registrar; use
        Ver QR en la tabla para mostrarlo. Edite o elimine cuando sea necesario.
      </p>

      <section className={styles.formPanel} aria-labelledby="aprendices-form-titulo">
        <h2 id="aprendices-form-titulo" className={styles.formTitle}>
          {editingUsuarioId != null ? `Editar aprendiz #${editingUsuarioId}` : "Nuevo aprendiz"}
        </h2>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ap-nombre">
              Nombre
            </label>
            <input
              id="ap-nombre"
              className={styles.input}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoComplete="given-name"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ap-apellido">
              Apellido
            </label>
            <input
              id="ap-apellido"
              className={styles.input}
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              autoComplete="family-name"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ap-doc">
              Numero de documento
            </label>
            <input
              id="ap-doc"
              className={styles.input}
              value={numeroDocumento}
              onChange={(e) => setNumeroDocumento(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ap-tipo-doc">
              Tipo documento
            </label>
            <input
              id="ap-tipo-doc"
              className={styles.input}
              value={idTipoDocumento}
              onChange={(e) => setIdTipoDocumento(e.target.value)}
              placeholder="CC"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ap-genero">
              Genero
            </label>
            <select
              id="ap-genero"
              className={styles.select}
              value={idGenero}
              onChange={(e) => setIdGenero(e.target.value)}
            >
              <option value="M">M</option>
              <option value="F">F</option>
              <option value="O">Otro</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ap-tel">
              Telefono
            </label>
            <input
              id="ap-tel"
              className={styles.input}
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              autoComplete="tel"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ap-correo">
              Correo electronico
            </label>
            <input
              id="ap-correo"
              className={styles.input}
              type="email"
              value={correoElectronico}
              onChange={(e) => setCorreoElectronico(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ap-user">
              Usuario (login)
            </label>
            <input
              id="ap-user"
              className={styles.input}
              value={usemame}
              onChange={(e) => setUsemame(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ap-pass">
              Contrasenia
              {editingUsuarioId != null ? " (dejar vacia para no cambiar)" : ""}
            </label>
            <input
              id="ap-pass"
              className={styles.input}
              type="password"
              value={contrasenia}
              onChange={(e) => setContrasenia(e.target.value)}
              autoComplete={editingUsuarioId != null ? "new-password" : "new-password"}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ap-programa">
              Programa de formacion
            </label>
            <select
              id="ap-programa"
              className={styles.select}
              value={idProgramaFormacion}
              onChange={(e) => {
                const v = e.target.value;
                setIdProgramaFormacion(v);
                setFichaIdFicha("");
                void loadFichasPorPrograma(v);
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
            <label className={styles.label} htmlFor="ap-ficha">
              Ficha
            </label>
            <select
              id="ap-ficha"
              className={styles.select}
              value={fichaIdFicha}
              onChange={(e) => setFichaIdFicha(e.target.value)}
              disabled={!idProgramaFormacion || loadingFichas}
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
          </div>
        </div>
        <div className={styles.formActions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={saving}
            onClick={() => void submit()}
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
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {aprendices.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ color: "#6b7280" }}>
                    No hay aprendices registrados.
                  </td>
                </tr>
              ) : (
                aprendices.map((v) => (
                  <tr key={v.usuarioIdUsuario}>
                    <td>
                      {v.usuario.nombre} {v.usuario.apellido}
                    </td>
                    <td>{v.usuario.numeroDocumento}</td>
                    <td>{v.usuario.usemame}</td>
                    <td>{v.ficha.numeroFicha ?? v.ficha.idFicha}</td>
                    <td>{v.programaNombre ?? "—"}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.rowBtn}
                          onClick={() => void startEdit(v)}
                        >
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
                ))
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
