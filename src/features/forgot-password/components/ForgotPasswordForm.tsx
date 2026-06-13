"use client";

import { FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiArrowLeft, FiMail } from "react-icons/fi";
import { useForgotPassword } from "../hooks/useForgotPassword";
import styles from "./ForgotPasswordForm.module.css";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className={styles.fieldError} role="alert">
      {message}
    </p>
  );
}

export function ForgotPasswordForm() {
  const {
    identificador,
    mensaje,
    loading,
    isError,
    isSuccess,
    fieldError,
    setIdentificador,
    submit
  } = useForgotPassword();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submit();
  };

  return (
    <section className={styles.wrapper}>
      <aside className={styles.hero}>
        <Image
          src="/login-illustration.png"
          alt="Ilustracion recuperar contraseña"
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

          <h1 className={styles.title}>Recuperar contraseña</h1>
          <p className={styles.subtitle}>
            Ingresa tu usuario o correo electronico. Si existe una cuenta asociada, te
            enviaremos un enlace para restablecer tu contraseña.
          </p>

          <form onSubmit={onSubmit} className={styles.form} noValidate>
            <label className={styles.label} htmlFor="identificador">
              Usuario o correo
            </label>
            <div className={styles.inputWrap}>
              <FiMail className={styles.iconLeft} />
              <input
                id="identificador"
                name="identificador"
                className={fieldError ? `${styles.input} ${styles.inputInvalid}` : styles.input}
                value={identificador}
                onChange={(event) => setIdentificador(event.target.value)}
                placeholder="usuario o correo@ejemplo.com"
                autoComplete="username"
                aria-invalid={fieldError ? true : undefined}
                aria-describedby={fieldError ? "identificador-error" : undefined}
              />
            </div>
            <FieldError id="identificador-error" message={fieldError} />

            <button type="submit" className={styles.button} disabled={loading || isSuccess}>
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>
          </form>

          {mensaje ? (
            <p
              className={`${styles.message} ${isError ? styles.messageError : ""}`}
              role={isError ? "alert" : "status"}
            >
              {mensaje}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
