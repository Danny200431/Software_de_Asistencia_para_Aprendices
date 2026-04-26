"use client";

import { FormEvent } from "react";
import { useLogin } from "../hooks/useLogin";

export function LoginForm() {
  const {
    usemame,
    Contrasenia,
    mensaje,
    setUsemame,
    setContrasenia,
    submit
  } = useLogin();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submit();
  };

  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="usemame">Usuario</label>
      <input
        id="usemame"
        name="usemame"
        value={usemame}
        onChange={(event) => setUsemame(event.target.value)}
        required
      />

      <label htmlFor="Contrasenia">Contrasenia</label>
      <input
        id="Contrasenia"
        name="Contrasenia"
        type="password"
        value={Contrasenia}
        onChange={(event) => setContrasenia(event.target.value)}
        required
      />

      <button type="submit">Iniciar sesion</button>
      {mensaje ? <p>{mensaje}</p> : null}
    </form>
  );
}
