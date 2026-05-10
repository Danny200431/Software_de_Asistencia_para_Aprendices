"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import styles from "./InstructorGestion.module.css";

type UsuarioMini = {
  idUsuario: number;
  nombre: string;
  apellido: string;
  numeroDocumento: string;
  correoElectronico: string;
  usemame: string;
  rolIdRol: number;
};

type FichaOpt = { idFicha: number; numeroFicha: string | null };

type VinculoRow = {
  fichaIdFicha: number;
  usuarioIdUsuario: number;
  usuario: UsuarioMini;
  ficha: FichaOpt;
};

export function InstructorAprendicesCrud() {
  const [vinculos, setVinculos] = useState<VinculoRow[]>([]);
  const [fichas, setFichas] = useState<FichaOpt[]>([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState<
    Pick<UsuarioMini, "idUsuario" | "nombre" | "apellido" | "numeroDocumento" | "rolIdRol">[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingUsuarioId, setEditingUsuarioId] = useState<number | null>(null);
  const [usuarioSelect, setUsuarioSelect] = useState("");
  const [fichaId, setFichaId] = useState("");

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await axios.get<{
        ok: boolean;
        vinculos?: VinculoRow[];
        fichas?: FichaOpt[];
        usuariosDisponibles?: Pick<
          UsuarioMini,
          "idUsuario" | "nombre" | "apellido" | "numeroDocumento" | "rolIdRol"
        >[];
        error?: string;
      }>("/api/instructor/aprendices");
      if (!data.ok) {
        setError(data.error ?? "No se pudieron cargar los datos");
        return;
      }
      setVinculos(data.vinculos ?? []);
      setFichas(data.fichas ?? []);
      setUsuariosDisponibles(data.usuariosDisponibles ?? []);
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
    setEditingUsuarioId(null);
    setUsuarioSelect(usuariosDisponibles[0] ? String(usuariosDisponibles[0].idUsuario) : "");
    setFichaId(fichas[0] ? String(fichas[0].idFicha) : "");
  };

  useEffect(() => {
    if (loading || editingUsuarioId != null) return;
    if (usuarioSelect === "" && usuariosDisponibles[0]) {
      setUsuarioSelect(String(usuariosDisponibles[0].idUsuario));
    }
    if (fichaId === "" && fichas[0]) setFichaId(String(fichas[0].idFicha));
  }, [loading, editingUsuarioId, usuariosDisponibles, fichas, usuarioSelect, fichaId]);

  const startEdit = (row: VinculoRow) => {
    setEditingUsuarioId(row.usuarioIdUsuario);
    setFichaId(String(row.fichaIdFicha));
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    const fic = Number.parseInt(fichaId, 10);
    if (!Number.isFinite(fic)) {
      setError("Seleccione una ficha");
      setSaving(false);
      return;
    }

    try {
      if (editingUsuarioId != null) {
        await axios.put(`/api/instructor/aprendices/${editingUsuarioId}`, { fichaIdFicha: fic });
      } else {
        const uid = Number.parseInt(usuarioSelect, 10);
        if (!Number.isFinite(uid)) {
          setError("Seleccione un aprendiz");
          setSaving(false);
          return;
        }
        await axios.post("/api/instructor/aprendices", { usuarioIdUsuario: uid, fichaIdFicha: fic });
      }
      resetForm();
      await load();
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object"
          ? (err.response.data as { error?: string }).error
          : null;
      setError(msg ?? "No se pudo guardar el vinculo");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (usuarioId: number) => {
    if (!globalThis.confirm("Quitar la ficha asignada a este aprendiz?")) return;
    setError(null);
    try {
      await axios.delete(`/api/instructor/aprendices/${usuarioId}`);
      if (editingUsuarioId === usuarioId) resetForm();
      await load();
    } catch {
      setError("No se pudo eliminar el vinculo");
    }
  };

  return (
    <section className={styles.pageBlock} aria-labelledby="aprendices-crud-titulo">
      <h2 id="aprendices-crud-titulo" className={styles.sectionHeading}>
        Vinculacion a fichas
      </h2>
      <p className={styles.sectionLead}>
        Asigne aprendices a una ficha o cambie la ficha de un aprendiz ya vinculado.
      </p>

      <div className={styles.formPanel}>
        <h3 className={styles.formTitle}>
          {editingUsuarioId != null
            ? `Cambiar ficha del aprendiz #${editingUsuarioId}`
            : "Nuevo vinculo aprendiz — ficha"}
        </h3>
        <div className={styles.formGrid}>
          {editingUsuarioId == null ? (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="aprendiz-usuario">
                Aprendiz
              </label>
              <select
                id="aprendiz-usuario"
                className={styles.select}
                value={usuarioSelect}
                onChange={(e) => setUsuarioSelect(e.target.value)}
                disabled={usuariosDisponibles.length === 0}
              >
                {usuariosDisponibles.length === 0 ? (
                  <option value="">No hay aprendices sin ficha</option>
                ) : (
                  usuariosDisponibles.map((u) => (
                    <option key={u.idUsuario} value={u.idUsuario}>
                      {u.nombre} {u.apellido} · doc. {u.numeroDocumento}
                    </option>
                  ))
                )}
              </select>
            </div>
          ) : null}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="aprendiz-ficha">
              Ficha
            </label>
            <select
              id="aprendiz-ficha"
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
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={
              saving ||
              (editingUsuarioId == null && usuariosDisponibles.length === 0) ||
              fichas.length === 0
            }
            onClick={() => void submit()}
          >
            {editingUsuarioId != null ? "Guardar cambios" : "Crear vinculo"}
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
      </div>

      {loading ? (
        <p className={styles.loadingMuted}>Cargando...</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Aprendiz</th>
                <th>Documento</th>
                <th>Usuario</th>
                <th>Ficha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vinculos.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ color: "#6b7280" }}>
                    No hay aprendices vinculados a fichas.
                  </td>
                </tr>
              ) : (
                vinculos.map((v) => (
                  <tr key={`${v.fichaIdFicha}-${v.usuarioIdUsuario}`}>
                    <td>
                      {v.usuario.nombre} {v.usuario.apellido}
                    </td>
                    <td>{v.usuario.numeroDocumento}</td>
                    <td>{v.usuario.usemame}</td>
                    <td>{v.ficha.numeroFicha ?? v.ficha.idFicha}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <button type="button" className={styles.rowBtn} onClick={() => startEdit(v)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          className={`${styles.rowBtn} ${styles.rowBtnDanger}`}
                          onClick={() => void remove(v.usuarioIdUsuario)}
                        >
                          Quitar vinculo
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
    </section>
  );
}
