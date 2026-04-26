import { useState } from "react";
import { AxiosError } from "axios";
import { loginApi } from "../api/login.api";

export function useLogin() {
  const [usemame, setUsemame] = useState("");
  const [Contrasenia, setContrasenia] = useState("");
  const [mensaje, setMensaje] = useState("");

  const submit = async () => {
    setMensaje("Validando...");

    try {
      const data = await loginApi({ usemame, Contrasenia });

      if (!data.ok || !data.token) {
        setMensaje(data.error ?? "No se pudo iniciar sesion");
        return;
      }

      localStorage.setItem("token", data.token);
      setMensaje(`Login exitoso. Rol: ${data.user?.rol ?? "N/A"}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        const serverMessage =
          (error.response?.data as { error?: string } | undefined)?.error ??
          "No se pudo iniciar sesion";
        setMensaje(serverMessage);
        return;
      }

      setMensaje("No se pudo iniciar sesion");
    }
  };

  return {
    usemame,
    Contrasenia,
    mensaje,
    setUsemame,
    setContrasenia,
    submit
  };
}
