"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./SignUp.module.css";
import logoGoogle from "../../../../public/assets/Secretaria-de-educacion-Queretaro.png";
import Image from "next/image";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden!");
      return;
    }

    console.log("Intento de registro:");
    console.log("Email:", email);
    console.log("Contraseña:", password);

    // TODO: Implementar lógica de registro (por ejemplo, llamada a una API)
    router.push("/screens/login"); // Redirigir a login después del signup
  };

  const handleGoogleSignIn = () => {
    console.log("Intentando iniciar sesión con Google...");
    // TODO: Implementar lógica de Google Sign-in (por ejemplo, Firebase, OAuth)
    alert("Inicio de sesión con Google clicado!");
  };

  return (
    <div className={styles.fondoSignUp}>
      <div className={styles.signUpContainer}>
        <form onSubmit={handleSubmit}>
          <p className={styles.signUpText} id="heading">
            Registro
          </p>

          <div className={styles.inputGroup}>
            <input
              autoComplete="off"
              placeholder="Correo electrónico"
              className={styles.inputField}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <input
              placeholder="Contraseña"
              className={styles.inputField}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <input
              placeholder="Confirmar contraseña"
              className={styles.inputField}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button className={styles.signupButton} type="submit">
            Registrarse
          </button>

          <div className={styles.separator}>
            <hr />
            <span>O</span>
            <hr />
          </div>

          <button
            className={styles.googleSignInButton}
            onClick={handleGoogleSignIn}
            type="button"
          >
            <Image
              src={logoGoogle}
              alt="Logo de Google"
              className={styles.googleIcon}
              width={20}
              height={20}
            />
            Registrarse con Google
          </button>

          <div className={styles.loginLink}>
            <p>
              ¿Ya tienes una cuenta?{" "}
              <button
                type="button"
                onClick={() => router.push("/screens/login")}
                className={styles.loginLinkButton}
              >
                Iniciar sesión
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
