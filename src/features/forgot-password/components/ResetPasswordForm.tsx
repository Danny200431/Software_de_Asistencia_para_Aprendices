"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiArrowLeft, FiEye, FiEyeOff, FiLock } from "react-icons/fi";
import { PasswordRequirementsChecklist } from "@/src/features/instructor/components/PasswordRequirementsChecklist";
import { useResetPassword } from "../hooks/useResetPassword";
import styles from "./ForgotPasswordForm.module.css";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className={styles.fieldError} role="alert">
      {message}
    </p>
  );
}

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const {
    contrasenia,
    confirmarContrasenia,
    mensaje,
    loading,
    isError,
    isSuccess,
    showFieldError,
    setContrasenia,
    setConfirmarContrasenia,
    submit
  } = useResetPassword(token);

  const contraseniaError = showFieldError("contrasenia");
  const confirmarError = showFieldError("confirmarContrasenia");
  const tokenInvalid = !token.trim();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submit();
  };

  return (
    <section className={styles.wrapper}>
      <aside className={styles.hero}>
        <Image
          src="/login-illustration.png"
          alt="Ilustracion nueva contraseña"
          width={520}
          height={520}
          className={styles.heroImage}
          priority
        />
      </aside>

      <div className={styles.panel}>
        <div className={styles.card}>
          <Link href="/" className={styles.backLink}>
            <FiArrowLeft style={{ display: "inline", marginRight: "0.35rem" }} />
            Volver al inicio de sesion
          </Link>

          <h1 className={styles.title}>Nueva contraseña</h1>
          <p className={styles.subtitle}>
            Elige una contraseña segura. El enlace de recuperacion vence en 1 hora.
          </p>

          {tokenInvalid ? (
            <p className={`${styles.message} ${styles.messageError}`} role="alert">
              El enlace de recuperacion no es valido. Solicita uno nuevo desde el inicio de
              sesion.
            </p>
          ) : (
            <form onSubmit={onSubmit} className={styles.form} noValidate>
              <label className={styles.label} htmlFor="contrasenia">
                Nueva contraseña
              </label>
              <div className={styles.inputWrap}>
                <FiLock className={styles.iconLeft} />
                <input
                  id="contrasenia"
                  name="contrasenia"
                  className={
                    contraseniaError ? `${styles.input} ${styles.inputInvalid}` : styles.input
                  }
                  type={showPwd ? "text" : "password"}
                  value={contrasenia}
                  onChange={(event) => setContrasenia(event.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="•••••••••••••••"
                  autoComplete="new-password"
                  aria-invalid={contraseniaError ? true : undefined}
                  aria-describedby={contraseniaError ? "contrasenia-error" : undefined}
                />
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => setShowPwd((value) => !value)}
                  aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPwd ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              <FieldError id="contrasenia-error" message={contraseniaError} />
              <PasswordRequirementsChecklist
                password={contrasenia}
                open={passwordFocused || contrasenia.length > 0}
              />

              <label className={styles.label} htmlFor="confirmarContrasenia">
                Confirmar contraseña
              </label>
              <div className={styles.inputWrap}>
                <FiLock className={styles.iconLeft} />
                <input
                  id="confirmarContrasenia"
                  name="confirmarContrasenia"
                  className={
                    confirmarError ? `${styles.input} ${styles.inputInvalid}` : styles.input
                  }
                  type={showConfirmPwd ? "text" : "password"}
                  value={confirmarContrasenia}
                  onChange={(event) => setConfirmarContrasenia(event.target.value)}
                  placeholder="•••••••••••••••"
                  autoComplete="new-password"
                  aria-invalid={confirmarError ? true : undefined}
                  aria-describedby={
                    confirmarError ? "confirmarContrasenia-error" : undefined
                  }
                />
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => setShowConfirmPwd((value) => !value)}
                  aria-label={
                    showConfirmPwd ? "Ocultar confirmacion" : "Mostrar confirmacion"
                  }
                >
                  {showConfirmPwd ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              <FieldError id="confirmarContrasenia-error" message={confirmarError} />

              <button type="submit" className={styles.button} disabled={loading || isSuccess}>
                {loading ? "Guardando..." : "Guardar contraseña"}
              </button>
            </form>
          )}

          {mensaje ? (
            <p
              className={`${styles.message} ${isError ? styles.messageError : ""}`}
              role={isError ? "alert" : "status"}
            >
              {mensaje}
            </p>
          ) : null}

          {tokenInvalid ? (
            <p style={{ marginTop: "1rem" }}>
              <Link href="/recuperar-contrasena" className={styles.backLink}>
                Solicitar nuevo enlace
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
