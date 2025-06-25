"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import styles from "./Login.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function LoginPage() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    console.log("Enviando login con loginId:", loginId); // Depuración

    try {
      const response = await axios.post(`${API_URL}/login`, {
        loginId,
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: response.data.user.id_usuario,
          username: response.data.user.username,
          role: response.data.user.tipo_usuario,
        }),
      );

      console.log("Usuario autenticado:", response.data.user);
      router.push("/screens/home");
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al iniciar sesión");
      console.error("Error en login:", err.response?.data || err);
    }
  };

  return (
    <div className={styles.fondoLogin}>
      <div className={styles.loginContainer}>
        <form onSubmit={handleSubmit}>
          <p className={styles.loginText} id="heading">
            Iniciar Sesión
          </p>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.inputGroup}>
            <svg
              className={styles.inputIcon}
              xmlns="http://www.w3.org/2000/svg"
              width={16}
              height={16}
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M13.106 7.222c0-2.967-2.249-5.032-5.482-5.032-3.35 0-5.646 2.318-5.646 5.702 0 3.493 2.235 5.708 5.762 5.708.862 0 1.689-.123 2.304-.335v-.862c-.43.199-1.354.328-2.29.328-2.926 0-4.813-1.88-4.813-4.798 0-2.844 1.921-4.881 4.594-4.881 2.735 0 4.608 1.688 4.608 4.156 0 1.682-.554 2.769-1.416 2.769-.492 0-.772-.28-.772-.76V5.206H8.923v.834h-.11c-.266-.595-.881-.964-1.6-.964-1.4 0-2.378 1.162-2.378 2.823 0 1.737.957 2.906 2.379 2.906.8 0 1.415-.39 1.709-1.087h.11c-.081.67.703 1.148 1.503 1.148 1.572 0 2.57-1.415 2.57-3.643zm-7.177.704c0-1.197.54-1.907 1.456-1.907.93 0 1.524.738 1.524 1.907S8.308 9.84 7.371 9.84c-.895 0-1.442-.725-1.442-1.914z" />
            </svg>
            <input
              autoComplete="off"
              placeholder="Correo electrónico o nombre de usuario"
              className={styles.inputField}
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <svg
              className={styles.inputIcon}
              xmlns="http://www.w3.org/2000/svg"
              width={16}
              height={16}
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
            </svg>
            <input
              placeholder="Contraseña"
              className={styles.inputField}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className={styles.buttonGroup}>
            <button className={styles.loginButton} type="submit">
              Iniciar Sesión
            </button>
            <button
              className={styles.signupButton}
              type="button"
              onClick={() => router.push("/screens/signup")}
            >
              Registrarse
            </button>
          </div>

          <button
            className={styles.forgotPasswordButton}
            type="button"
            onClick={() => router.push("/screens/recuperarPassword")}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </form>
      </div>
    </div>
  );
}
