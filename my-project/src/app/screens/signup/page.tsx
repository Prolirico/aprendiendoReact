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
  const [error, setError] = useState("");
  const router = useRouter();

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
                Iniciar sesión
              </button>
            </p>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
