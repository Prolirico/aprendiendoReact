"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./SignUp.module.css";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import Image from "next/image";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "768061039087-q59g2dbarenff9j3epsvc2gp208fiu2k.apps.googleusercontent.com";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden!");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/signup`, {
        username: email.split("@")[0],
        email,
        password,
        tipo_usuario: "alumno",
        estatus: "pendiente",
      });

      if (response.data.message === "User registered successfully") {
        router.push("/screens/login");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Error en el registro");
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError("");
    try {
      const response = await axios.post(`${API_URL}/auth/google`, {
        token: credentialResponse.credential,
      });

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        router.push("/screens/home");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Error en el registro con Google");
    }
  };

  const handleGoogleError = () => {
    setError("Error al iniciar sesión con Google");
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className={styles.fondoSignUp}>
        <div className={styles.signUpContainer}>
          {error && <p className={styles.error}>{error}</p>}
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

            <div className={styles.googleSignInButton}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_blue"
                size="large"
                text="signup_with"
                width="300"
              />
            </div>
            <div className={styles.loginLink}>
              <p>
                ¿Ya tienes una cuenta?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/screens/login")}
                  className={styles.loginLinkButton}
                >
                  Login
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
