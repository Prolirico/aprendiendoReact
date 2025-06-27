"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import styles from "./Login.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "768061039087-q59g2dbarenff9j3epsvc2gp208fiu2k.apps.googleusercontent.com";

export default function LoginPage() {
  const [error, setError] = useState("");
  const router = useRouter();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError("");
    console.log(
      "Google Sign-In: Token received:",
      credentialResponse.credential,
    );
    try {
      const response = await axios.post(`${API_URL}/auth/google`, {
        token: credentialResponse.credential,
      });
      console.log("Google Sign-In: Response:", response.data);

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: response.data.user.id_usuario,
            username: response.data.user.username,
            role: response.data.user.tipo_usuario,
          }),
        );
        console.log("Google Sign-In: User authenticated:", response.data.user);
        router.push("/screens/home");
      } else {
        console.error("Google Sign-In: No token in response:", response.data);
        setError("Error al iniciar sesión: No se recibió token");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        "Error al iniciar sesión con Google: " + (err.message || "Desconocido");
      console.error("Google Sign-In: Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(errorMessage);
    }
  };

  const handleGoogleError = () => {
    setError("Error al autenticarse con Google");
    console.error("Google Sign-In: Failed to authenticate with Google");
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className={styles.fondoLogin}>
        <div className={styles.loginContainer}>
          <p className={styles.loginText} id="heading">
            Iniciar Sesión
          </p>
          {error && (
            <p className={styles.error}>
              {error}
              {error === "Usuario no registrado" && (
                <span>
                  {" "}
                  <button
                    type="button"
                    onClick={() => router.push("/screens/signup")}
                    className={styles.loginLinkButton}
                  >
                    Regístrate
                  </button>
                </span>
              )}
            </p>
          )}
          <div className={styles.googleLoginButton}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_blue"
              size="large"
              text="signin_with"
              width="100%"
            />
          </div>
          <div className={styles.loginLink}>
            <p>
              ¿No tienes una cuenta?{" "}
              <button
                type="button"
                onClick={() => router.push("/screens/signup")}
                className={styles.loginLinkButton}
              >
                Registrarse
              </button>
            </p>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
