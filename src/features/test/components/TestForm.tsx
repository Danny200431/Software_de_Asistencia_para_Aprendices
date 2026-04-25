"use client";

import { FormEvent } from "react";
import { useCreateTest } from "../hooks/useCreateTest";

export function TestForm() {
  const { dato, mensaje, setDato, submit } = useCreateTest();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submit();
  };

  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="dato">Dato</label>
      <input
        id="dato"
        name="dato"
        value={dato}
        onChange={(event) => setDato(event.target.value)}
        required
      />
      <button type="submit">Guardar</button>
      {mensaje ? <p>{mensaje}</p> : null}
    </form>
  );
}
