import { useState } from "react";
import { AxiosError } from "axios";
import { createTestInputApi } from "../api/test.api";

export function useCreateTest() {
  const [dato, setDato] = useState("");
  const [mensaje, setMensaje] = useState("");

  const submit = async () => {
    setMensaje("Guardando...");

    try {
      const data = await createTestInputApi({ dato });

      if (!data.ok) {
        setMensaje(data.error ?? "No se pudo guardar");
        return;
      }

      setMensaje(`Guardado con id ${data.id}`);
      setDato("");
    } catch (error) {
      if (error instanceof AxiosError) {
        const serverMessage =
          (error.response?.data as { error?: string } | undefined)?.error ??
          "No se pudo guardar";
        setMensaje(serverMessage);
        return;
      }

      setMensaje("No se pudo guardar");
    }
  };

  return {
    dato,
    mensaje,
    setDato,
    submit
  };
}
