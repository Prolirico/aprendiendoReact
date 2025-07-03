// Frontend - AdminLogin.jsx (versión con debugging)
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import styles from "./AdminLogin.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    console.log("=== DEBUG LOGIN ===");
    console.log("API_URL:", API_URL);
    console.log("URL completa:", `${API_URL}/login`);
    console.log("Datos enviados:", { loginId: username, password: "***" });

    try {
      const response = await axios.post(`${API_URL}/admin_login`, {
        loginId: username,
        password: password,
      });

      console.log("Respuesta del servidor:", response.data);

      const user = response.data.user;

      // Guardar token en localStorage si es necesario
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }

      // Redirigir al dashboard correspondiente según el rol
      if (user.tipo_usuario === "maestro") {
        router.push("/dashboards/TeacherDashboard");
      } else if (user.tipo_usuario === "admin_universidad") {
        router.push("/dashboards/UniversityDashboard");
      } else if (user.tipo_usuario === "admin_sedeq") {
        router.push("/dashboards/SEDEQDashboard");
      } else {
        setError(
          "No tienes los permisos necesarios, unicamente puedes entrar si eres Maestro, Universidad o SEDEQ",
        );
      }
    } catch (err) {
      console.error("Error completo:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);

      if (err.code === "ECONNREFUSED" || err.code === "ERR_NETWORK") {
        setError(
          "No se puede conectar al servidor. Verifica que el backend esté ejecutándose.",
        );
      } else {
        const errorMessage =
          err.response?.data?.error ||
          "Error de conexión o credenciales incorrectas";
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.fondoLogin}>
      <div className={styles.loginContainer}>
        <p className={styles.loginText} id="heading">
          Iniciar Sesión Administrador
        </p>
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Usuario o Correo"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className={styles.inputField}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.inputField}
            disabled={loading}
          />
          <button
            type="submit"
            className={styles.loginButton}
            disabled={loading}
          >
            {loading ? "Iniciando..." : "Iniciar Sesión"}
          </button>
        </form>

        {/* Información de debugging (eliminar en producción) */}
        <div style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
          <p>API URL: {API_URL}</p>
          <p>Endpoint: {`${API_URL}/admin_login`}</p>
        </div>
      </div>
    </div>
  );
}
