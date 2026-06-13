import { useState } from "react";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { validatePassword } from "@/src/lib/validatePassword";
import { resetPasswordInputSchema } from "../config/schemas/forgot-password.schema";
import { ForgotPasswordApi } from "../api/forgot-password.api";

export type ResetPasswordField = "contrasenia" | "confirmarContrasenia";
export type ResetPasswordFieldErrors = Partial<Record<ResetPasswordField, string>>;

export function useResetPassword(token: string) {
  const api = new ForgotPasswordApi();
  const router = useRouter();
  const [contrasenia, setContrasenia] = useState("");
  const [confirmarContrasenia, setConfirmarContrasenia] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ResetPasswordFieldErrors>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  const validateFields = (): ResetPasswordFieldErrors => {
    const errors: ResetPasswordFieldErrors = {};

    if (!token.trim()) {
      return { contrasenia: "El enlace de recuperacion no es valido" };
    }

    const schemaResult = resetPasswordInputSchema.safeParse({
      token,
      contrasenia,
      confirmarContrasenia
    });

    if (!schemaResult.success) {
      for (const issue of schemaResult.error.issues) {
        const field = issue.path[0];
        if (
          (field === "contrasenia" || field === "confirmarContrasenia") &&
          !errors[field]
        ) {
          errors[field] = issue.message;
        }
      }
    }

    const passwordError = validatePassword(contrasenia);
    if (passwordError && !errors.contrasenia) {
      errors.contrasenia = passwordError;
    }

    if (contrasenia !== confirmarContrasenia) {
      errors.confirmarContrasenia = "Las contraseñas no coinciden";
    }

    return errors;
  };

  const clearFieldError = (field: ResetPasswordField) => {
    if (!formSubmitted) return;
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleContraseniaChange = (value: string) => {
    setContrasenia(value);
    clearFieldError("contrasenia");
  };

  const handleConfirmarChange = (value: string) => {
    setConfirmarContrasenia(value);
    clearFieldError("confirmarContrasenia");
  };

  const submit = async () => {
    setFormSubmitted(true);
    setIsError(false);
    setIsSuccess(false);
    setMensaje("");

    const errors = validateFields();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstInvalid = document.querySelector<HTMLElement>("[aria-invalid='true']");
      firstInvalid?.focus();
      return;
    }

    setLoading(true);
    setMensaje("Actualizando contraseña...");

    try {
      const data = await api.resetPassword({ token, contrasenia });

      if (!data.ok) {
        setIsError(true);
        setMensaje(data.error ?? "No se pudo actualizar la contraseña");
        setLoading(false);
        return;
      }

      setIsSuccess(true);
      setMensaje(data.message ?? "Tu contraseña fue actualizada correctamente");
      setLoading(false);

      setTimeout(() => {
        router.push("/");
      }, 2500);
    } catch (error) {
      if (error instanceof AxiosError) {
        const serverMessage =
          (error.response?.data as { error?: string } | undefined)?.error ??
          "No se pudo actualizar la contraseña";
        setIsError(true);
        setMensaje(serverMessage);
        setLoading(false);
        return;
      }

      setIsError(true);
      setMensaje("No se pudo actualizar la contraseña");
      setLoading(false);
    }
  };

  const showFieldError = (field: ResetPasswordField) =>
    formSubmitted ? fieldErrors[field] : undefined;

  return {
    contrasenia,
    confirmarContrasenia,
    mensaje,
    loading,
    isError,
    isSuccess,
    showFieldError,
    setContrasenia: handleContraseniaChange,
    setConfirmarContrasenia: handleConfirmarChange,
    submit
  };
}
