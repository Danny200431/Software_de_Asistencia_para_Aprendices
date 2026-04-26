import { useState } from "react";
import { AxiosError } from "axios";
import { LoginApi } from "../api/login.api";

export function useLogin() {
  const loginApi = new LoginApi();
  const [usemame, setUsemame] = useState("");
  const [Contrasenia, setContrasenia] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const submit = async () => {
    setLoading(true);
    setIsError(false);
    setMensaje("Validando...");

    try {
      const data = await loginApi.login({ usemame, Contrasenia });

      if (!data.ok || !data.token) {
        setIsError(true);
        setMensaje(data.error ?? "No se pudo iniciar sesion");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      setMensaje(`Login exitoso. Rol: ${data.user?.rol ?? "N/A"}`);
      setLoading(false);
    } catch (error) {
      if (error instanceof AxiosError) {
        const serverMessage =
          (error.response?.data as { error?: string } | undefined)?.error ??
          "No se pudo iniciar sesion";
        setIsError(true);
        setMensaje(serverMessage);
        setLoading(false);
        return;
      }

      setIsError(true);
      setMensaje("No se pudo iniciar sesion");
      setLoading(false);
    }
  };

  return {
    usemame,
    Contrasenia,
    mensaje,
    loading,
    isError,
    setUsemame,
    setContrasenia,
    submit
  };
}
