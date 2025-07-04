"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleOAuthProvider,
  GoogleLogin,
  CredentialResponse,
} from "@react-oauth/google";
import axios, { AxiosError } from "axios";
import styles from "./SignUp.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "768061039087-q59g2dbarenff9j3epsvc2gp208fiu2k.apps.googleusercontent.com";

interface SignUpResponse {
  message: string;
}

interface ErrorResponse {
  error?: string;
}

export default function SignUpPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    setError("");
    setSuccess("");
    console.log(
      "Registro con Google: Token recibido:",
      credentialResponse.credential,
    );
    try {
      const response = await axios.post<SignUpResponse>(
        `${API_URL}/auth/google-signup`,
        {
          token: credentialResponse.credential,
        },
      );
      console.log("Registro con Google: Respuesta:", response.data);

      if (response.data.message === "Google Sign-Up successful") {
        setSuccess("Registro exitoso. Redirigiendo al inicio de sesión...");
        setTimeout(() => router.push("/screens/login"), 2000);
      } else {
        console.error(
          "Registro con Google: Respuesta inesperada:",
          response.data,
        );
        setError("Error en el registro: Respuesta inesperada");
      }
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      const errorMessage =
        error.response?.data?.error ||
        "Error en el registro con Google: " + (error.message || "Desconocido");
      console.error("Registro con Google: Detalles del error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      setError(errorMessage);
    }
  };

  const handleGoogleError = () => {
    setError("Error al autenticarse con Google");
    console.error("Registro con Google: Falló la autenticación con Google");
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
