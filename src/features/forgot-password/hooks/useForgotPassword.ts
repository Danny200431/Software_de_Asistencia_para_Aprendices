import { useState } from "react";
import { AxiosError } from "axios";
import { forgotPasswordInputSchema } from "../config/schemas/forgot-password.schema";
import { ForgotPasswordApi } from "../api/forgot-password.api";

export function useForgotPassword() {
  const api = new ForgotPasswordApi();
  const [identificador, setIdentificador] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleIdentificadorChange = (value: string) => {
    setIdentificador(value);
    if (formSubmitted) setFieldError(undefined);
    if (isSuccess) {
      setIsSuccess(false);
      setMensaje("");
    }
  };

  const submit = async () => {
    setFormSubmitted(true);
    setIsError(false);
    setIsSuccess(false);
    setMensaje("");

    const validation = forgotPasswordInputSchema.safeParse({ identificador });
    if (!validation.success) {
      setFieldError(validation.error.issues[0]?.message);
      return;
    }

    setFieldError(undefined);
    setLoading(true);
    setMensaje("Enviando solicitud...");

    try {
      const data = await api.requestReset({ identificador });

      if (!data.ok) {
        setIsError(true);
        setMensaje(data.error ?? "No se pudo procesar la solicitud");
        setLoading(false);
        return;
      }

      setIsSuccess(true);
      setMensaje(
        data.message ??
          "Si el usuario o correo esta registrado, recibiras un enlace para restablecer tu contraseña."
      );
      setLoading(false);
    } catch (error) {
      if (error instanceof AxiosError) {
        const serverMessage =
          (error.response?.data as { error?: string } | undefined)?.error ??
          "No se pudo procesar la solicitud";
        setIsError(true);
        setMensaje(serverMessage);
        setLoading(false);
        return;
      }

      setIsError(true);
      setMensaje("No se pudo procesar la solicitud");
      setLoading(false);
    }
  };

  return {
    identificador,
    mensaje,
    loading,
    isError,
    isSuccess,
    fieldError: formSubmitted ? fieldError : undefined,
    setIdentificador: handleIdentificadorChange,
    submit
  };
}
