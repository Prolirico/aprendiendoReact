"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./SignUp.module.css";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "768061039087-q59g2dbarenff9j3epsvc2gp208fiu2k.apps.googleusercontent.com";

export default function SignUpPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // Nuevo estado para mensajes de éxito
  const router = useRouter();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError("");
    setSuccess("");
    console.log(
      "Google Sign-Up: Token received:",
      credentialResponse.credential,
    );
    try {
      const response = await axios.post(`${API_URL}/auth/google-signup`, {
        token: credentialResponse.credential,
      });
      console.log("Google Sign-Up: Response:", response.data);

      if (response.data.message === "Google Sign-Up successful") {
        // Registro exitoso, mostrar mensaje y redirigir a login
        setSuccess("Registro exitoso. Redirigiendo al inicio de sesión...");
        setTimeout(() => {
          router.push("/screens/login");
        }, 2000); // Redirige después de 2 segundos
      } else {
        console.error("Google Sign-Up: Unexpected response:", response.data);
        setError("Error en el registro: Respuesta inesperada");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || "Error en el registro con Google";
      console.error("Google Sign-Up: Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(errorMessage);
    }
  };

  const handleGoogleError = () => {
    setError("Error al autenticarse con Google");
    console.error("Google Sign-Up: Failed to authenticate with Google");
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className={styles.fondoSignUp}>
        <div className={styles.signUpContainer}>
          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}
          <p className={styles.signUpText} id="heading">
            Registro
          </p>
          <div className={styles.googleSignInButton}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_blue"
              size="large"
              text="signup_with"
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
                Iniciar sesión
              </button>
            </p>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
