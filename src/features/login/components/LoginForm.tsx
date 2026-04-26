"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { FiEye, FiEyeOff, FiLock, FiUser } from "react-icons/fi";
import { useLogin } from "../hooks/useLogin";
import styles from "./LoginForm.module.css";

export function LoginForm() {
  const [showPwd, setShowPwd] = useState(false);
  const {
    usemame,
    Contrasenia,
    mensaje,
    loading,
    isError,
    setUsemame,
    setContrasenia,
    submit
  } = useLogin();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submit();
  };

  return (
    <section className={styles.wrapper}>
      <aside className={styles.hero}>
        <Image
          src="/login-illustration.png"
          alt="Ilustracion login"
          width={520}
          height={520}
          className={styles.heroImage}
          priority
        />
      </aside>

      <div className={styles.panel}>
        <div className={styles.card}>
          <h1 className={styles.title}>
            Bienvenido a <span>SAA</span>
          </h1>

          <form onSubmit={onSubmit} className={styles.form}>
            <label className={styles.label} htmlFor="usemame">
              Usuario
            </label>
            <div className={styles.inputWrap}>
              <FiUser className={styles.iconLeft} />
              <input
                id="usemame"
                name="usemame"
                className={styles.input}
                value={usemame}
                onChange={(event) => setUsemame(event.target.value)}
                placeholder="Ingresa tu usuario"
                required
              />
            </div>

            <label className={styles.label} htmlFor="Contrasenia">
              Contrasenia
            </label>
            <div className={styles.inputWrap}>
              <FiLock className={styles.iconLeft} />
              <input
                id="Contrasenia"
                name="Contrasenia"
                className={styles.input}
                type={showPwd ? "text" : "password"}
                value={Contrasenia}
                onChange={(event) => setContrasenia(event.target.value)}
                placeholder="•••••••••••••••"
                required
              />
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => setShowPwd((value) => !value)}
                aria-label={showPwd ? "Ocultar contrasenia" : "Mostrar contrasenia"}
              >
                {showPwd ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            <div className={styles.forgotWrap}>
              <a href="#" className={styles.forgot}>
                ¿Has olvidado tu contraseña?
              </a>
            </div>

            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "Validando..." : "Ingresar"}
            </button>
          </form>

          {mensaje ? (
            <p className={`${styles.message} ${isError ? styles.messageError : ""}`}>
              {mensaje}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
