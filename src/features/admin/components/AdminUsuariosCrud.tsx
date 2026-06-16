"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import styles from "@/src/features/instructor/components/InstructorGestion.module.css";

type Rol = { idRol: number; nombreRol: string };
type Usuario = {
  idUsuario: number;
  nombre: string;
  apellido: string;
  correoElectronico: string;
  telefono: string;
  numeroDocumento: string;
  usemame: string;
  rolIdRol: number;
  rol: { nombreRol: string };
  aprendiz: { fichaIdFicha: number } | null;
};

export function AdminUsuariosCrud() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRol, setEditingRol] = useState<number>(1);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [documento, setDocumento] = useState("");
  const [usemame, setUsemame] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [rolId, setRolId] = useState("1");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await axios.get<{ ok: boolean; usuarios?: Usuario[]; roles?: Rol[]; error?: string }>("/api/admin/usuarios");
      if (!data.ok) { setError(data.error ?? "Error al cargar"); return; }
      setUsuarios(data.usuarios ?? []);
      setRoles(data.roles ?? []);
    } catch { setError("Error al cargar usuarios"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const resetForm = () => {
    setEditingId(null); setEditingRol(1);
    setNombre(""); setApellido(""); setCorreo(""); setTelefono("");
    setDocumento(""); setUsemame(""); setContrasenia(""); setRolId("1");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !apellido.trim() || !correo.trim() || !usemame.trim()) {
      setError("Complete campos obligatorios"); return;
    }
    if (editingId == null && !contrasenia.trim()) { setError("La contrasena es obligatoria al crear"); return; }
    setSaving(true); setError(null);
    try {
      const payload = {
        nombre, apellido, correoElectronico: correo, telefono, numeroDocumento: documento,
        usemame, rolIdRol: Number.parseInt(rolId, 10),
        ...(contrasenia.trim() ? { contrasenia } : {})
      };
      if (editingId != null) {
        await axios.put(`/api/admin/usuarios/${editingId}`, { ...payload, rolIdRol: editingRol });
      } else {
        await axios.post("/api/admin/usuarios", payload);
      }
      resetForm(); await load();
    } catch (err) {
      setError(axios.isAxiosError(err) && typeof err.response?.data?.error === "string" ? err.response.data.error : "No se pudo guardar");
    } finally { setSaving(false); }
  };

  const startEdit = (u: Usuario) => {
    setEditingId(u.idUsuario); setEditingRol(u.rolIdRol);
    setNombre(u.nombre); setApellido(u.apellido); setCorreo(u.correoElectronico);
    setTelefono(u.telefono); setDocumento(u.numeroDocumento); setUsemame(u.usemame);
    setContrasenia(""); setRolId(String(u.rolIdRol));
  };

  const remove = async (id: number, rolIdRol: number) => {
    if (!globalThis.confirm("Eliminar este usuario?")) return;
    try {
      await axios.delete(`/api/admin/usuarios/${id}?rolIdRol=${rolIdRol}`);
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(axios.isAxiosError(err) && typeof err.response?.data?.error === "string" ? err.response.data.error : "No se pudo eliminar");
    }
  };

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Usuarios</h1>
      <p className={styles.subtitle}>Gestionar usuarios del sistema (aprendices, instructores, administradores).</p>
      <section className={styles.formPanel}>
        <h2 className={styles.formTitle}>{editingId != null ? `Editar usuario #${editingId}` : "Nuevo usuario"}</h2>
        <form onSubmit={(e) => void submit(e)}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="usr-nombre">Nombre</label>
              <input id="usr-nombre" className={styles.input} value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={45} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="usr-apellido">Apellido</label>
              <input id="usr-apellido" className={styles.input} value={apellido} onChange={(e) => setApellido(e.target.value)} maxLength={45} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="usr-correo">Correo</label>
              <input id="usr-correo" className={styles.input} type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} maxLength={45} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="usr-tel">Telefono</label>
              <input id="usr-tel" className={styles.input} value={telefono} onChange={(e) => setTelefono(e.target.value)} maxLength={45} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="usr-doc">Documento</label>
              <input id="usr-doc" className={styles.input} value={documento} onChange={(e) => setDocumento(e.target.value)} maxLength={45} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="usr-user">Usuario</label>
              <input id="usr-user" className={styles.input} value={usemame} onChange={(e) => setUsemame(e.target.value)} maxLength={45} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="usr-pass">{editingId != null ? "Nueva contrasena (opcional)" : "Contrasena"}</label>
              <input id="usr-pass" className={styles.input} type="password" value={contrasenia} onChange={(e) => setContrasenia(e.target.value)} autoComplete="new-password" />
            </div>
            {editingId == null ? (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="usr-rol">Rol</label>
                <select id="usr-rol" className={styles.select} value={rolId} onChange={(e) => setRolId(e.target.value)}>
                  {roles.map((r) => <option key={r.idRol} value={String(r.idRol)}>{r.nombreRol}</option>)}
                </select>
              </div>
            ) : (
              <div className={styles.field}>
                <span className={styles.label}>Rol</span>
                <p className={styles.loadingMuted} style={{ margin: 0, minHeight: "2.5rem", display: "flex", alignItems: "center" }}>
                  {roles.find((r) => r.idRol === editingRol)?.nombreRol ?? editingRol}
                </p>
              </div>
            )}
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
            <thead><tr><th>ID</th><th>Nombre</th><th>Usuario</th><th>Correo</th><th>Rol</th><th>Acciones</th></tr></thead>
            <tbody>
              {usuarios.length === 0 ? <tr><td colSpan={6} style={{ color: "#6b7280" }}>Sin registros</td></tr> :
                usuarios.map((u) => (
                  <tr key={`${u.idUsuario}-${u.rolIdRol}`}>
                    <td>{u.idUsuario}</td>
                    <td>{u.nombre} {u.apellido}</td>
                    <td>{u.usemame}</td>
                    <td>{u.correoElectronico}</td>
                    <td>{u.rol.nombreRol}</td>
                    <td><div className={styles.rowActions}>
                      <button type="button" className={styles.rowBtn} onClick={() => startEdit(u)}>Editar</button>
                      <button type="button" className={`${styles.rowBtn} ${styles.rowBtnDanger}`} onClick={() => void remove(u.idUsuario, u.rolIdRol)}>Eliminar</button>
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
