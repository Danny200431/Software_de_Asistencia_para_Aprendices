"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AdminFieldError } from "@/src/features/admin/components/AdminFieldError";
import { fieldInputClass, focusFirstInvalidField, readOnlyFieldStyle } from "@/src/features/admin/lib/adminFormUi";
import {
  hasUsuarioFormErrors,
  validateUsuarioForm,
  type UsuarioFormErrors,
  type UsuarioFormField
} from "@/src/features/admin/lib/validateUsuarioForm";
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
  const [fieldErrors, setFieldErrors] = useState<UsuarioFormErrors>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  const existingRecords = useMemo(
    () =>
      usuarios.map((u) => ({
        idUsuario: u.idUsuario,
        numeroDocumento: u.numeroDocumento,
        correoElectronico: u.correoElectronico,
        telefono: u.telefono,
        usemame: u.usemame
      })),
    [usuarios]
  );

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

  const showFieldError = (field: UsuarioFormField) => (formSubmitted ? fieldErrors[field] : undefined);
  const clearFieldError = (field: UsuarioFormField) => {
    if (!formSubmitted) return;
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const resetForm = () => {
    setEditingId(null); setEditingRol(1);
    setNombre(""); setApellido(""); setCorreo(""); setTelefono("");
    setDocumento(""); setUsemame(""); setContrasenia(""); setRolId("1");
    setFieldErrors({}); setFormSubmitted(false); setError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    const errors = validateUsuarioForm(
      {
        nombre,
        apellido,
        correoElectronico: correo,
        telefono,
        numeroDocumento: documento,
        usemame,
        contrasenia,
        rolId,
        editingId
      },
      { existing: existingRecords, hasRoles: roles.length > 0 }
    );
    setFieldErrors(errors);
    if (hasUsuarioFormErrors(errors)) { focusFirstInvalidField(); return; }
    setSaving(true); setError(null);
    try {
      const payload = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        correoElectronico: correo.trim(),
        telefono: telefono.trim(),
        numeroDocumento: documento.trim(),
        usemame: usemame.trim(),
        rolIdRol: Number.parseInt(rolId, 10),
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
    setFieldErrors({}); setFormSubmitted(false); setError(null);
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
        <form noValidate onSubmit={(e) => void submit(e)}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="usr-nombre">Nombre</label>
              <input id="usr-nombre" className={fieldInputClass(!!showFieldError("nombre"), styles.input)} value={nombre} onChange={(e) => { setNombre(e.target.value); clearFieldError("nombre"); }} maxLength={45} aria-invalid={showFieldError("nombre") ? true : undefined} aria-describedby={showFieldError("nombre") ? "usr-nombre-error" : undefined} />
              <AdminFieldError id="usr-nombre-error" message={showFieldError("nombre")} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="usr-apellido">Apellido</label>
              <input id="usr-apellido" className={fieldInputClass(!!showFieldError("apellido"), styles.input)} value={apellido} onChange={(e) => { setApellido(e.target.value); clearFieldError("apellido"); }} maxLength={45} aria-invalid={showFieldError("apellido") ? true : undefined} aria-describedby={showFieldError("apellido") ? "usr-apellido-error" : undefined} />
              <AdminFieldError id="usr-apellido-error" message={showFieldError("apellido")} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="usr-correo">Correo</label>
              <input id="usr-correo" className={fieldInputClass(!!showFieldError("correoElectronico"), styles.input)} type="email" value={correo} onChange={(e) => { setCorreo(e.target.value); clearFieldError("correoElectronico"); }} maxLength={45} aria-invalid={showFieldError("correoElectronico") ? true : undefined} aria-describedby={showFieldError("correoElectronico") ? "usr-correo-error" : undefined} />
              <AdminFieldError id="usr-correo-error" message={showFieldError("correoElectronico")} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="usr-tel">Telefono</label>
              <input id="usr-tel" className={fieldInputClass(!!showFieldError("telefono"), styles.input)} value={telefono} onChange={(e) => { setTelefono(e.target.value); clearFieldError("telefono"); }} maxLength={45} aria-invalid={showFieldError("telefono") ? true : undefined} aria-describedby={showFieldError("telefono") ? "usr-tel-error" : undefined} />
              <AdminFieldError id="usr-tel-error" message={showFieldError("telefono")} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="usr-doc">Documento</label>
              <input id="usr-doc" className={fieldInputClass(!!showFieldError("numeroDocumento"), styles.input)} value={documento} onChange={(e) => { setDocumento(e.target.value); clearFieldError("numeroDocumento"); }} maxLength={45} aria-invalid={showFieldError("numeroDocumento") ? true : undefined} aria-describedby={showFieldError("numeroDocumento") ? "usr-doc-error" : undefined} />
              <AdminFieldError id="usr-doc-error" message={showFieldError("numeroDocumento")} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="usr-user">Usuario</label>
              <input id="usr-user" className={fieldInputClass(!!showFieldError("usemame"), styles.input)} value={usemame} onChange={(e) => { setUsemame(e.target.value); clearFieldError("usemame"); }} maxLength={45} aria-invalid={showFieldError("usemame") ? true : undefined} aria-describedby={showFieldError("usemame") ? "usr-user-error" : undefined} />
              <AdminFieldError id="usr-user-error" message={showFieldError("usemame")} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="usr-pass">{editingId != null ? "Nueva contrasena (opcional)" : "Contrasena"}</label>
              <input id="usr-pass" className={fieldInputClass(!!showFieldError("contrasenia"), styles.input)} type="password" value={contrasenia} onChange={(e) => { setContrasenia(e.target.value); clearFieldError("contrasenia"); }} autoComplete="new-password" aria-invalid={showFieldError("contrasenia") ? true : undefined} aria-describedby={showFieldError("contrasenia") ? "usr-pass-error" : undefined} />
              <AdminFieldError id="usr-pass-error" message={showFieldError("contrasenia")} />
            </div>
            {editingId == null ? (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="usr-rol">Rol</label>
                <select id="usr-rol" className={fieldInputClass(!!showFieldError("rolId"), styles.select, styles.selectInvalid)} value={rolId} onChange={(e) => { setRolId(e.target.value); clearFieldError("rolId"); }} aria-invalid={showFieldError("rolId") ? true : undefined} aria-describedby={showFieldError("rolId") ? "usr-rol-error" : undefined}>
                  {roles.map((r) => <option key={r.idRol} value={String(r.idRol)}>{r.nombreRol}</option>)}
                </select>
                <AdminFieldError id="usr-rol-error" message={showFieldError("rolId")} />
              </div>
            ) : (
              <div className={styles.field}>
                <span className={styles.label}>Rol</span>
                <p className={styles.loadingMuted} style={readOnlyFieldStyle()}>
                  {roles.find((r) => r.idRol === editingRol)?.nombreRol ?? editingRol}
                </p>
                <div className={styles.fieldErrorSlot} aria-hidden />
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
