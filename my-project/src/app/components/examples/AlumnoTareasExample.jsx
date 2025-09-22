import React, { useState } from "react";
import AlumnoTareaYCalificaciones from "../modules/AlumnoTareaYCalificaciones";
import styles from "./AlumnoTareasExample.module.css";

/**
 * Ejemplo de integración del módulo AlumnoTareaYCalificaciones
 * Este componente demuestra cómo usar el módulo de forma independiente
 */
const AlumnoTareasExample = () => {
  const [selectedUserId, setSelectedUserId] = useState("student123");
  const [showModule, setShowModule] = useState(true);

  // Usuarios de ejemplo para testing
  const exampleUsers = [
    { id: "student123", name: "Ana García", role: "Estudiante de Ingeniería" },
    {
      id: "student456",
      name: "Carlos López",
      role: "Estudiante de Matemáticas",
    },
    { id: "student789", name: "María Rodríguez", role: "Estudiante de Física" },
  ];

  return (
    <div className={styles.exampleContainer}>
      <div className={styles.header}>
        <h1>🎓 Ejemplo: Módulo de Tareas y Calificaciones</h1>
        <p>
          Demostración del componente <code>AlumnoTareaYCalificaciones</code>
          integrado con API real del backend.
        </p>
      </div>

      <div className={styles.controls}>
        <div className={styles.userSelector}>
          <label htmlFor="userSelect">Seleccionar Estudiante:</label>
          <select
            id="userSelect"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className={styles.select}
          >
            {exampleUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} - {user.role}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.toggleButton}>
          <button
            onClick={() => setShowModule(!showModule)}
            className={`${styles.btn} ${showModule ? styles.btnDanger : styles.btnPrimary}`}
          >
            {showModule ? "🙈 Ocultar Módulo" : "👁️ Mostrar Módulo"}
          </button>
        </div>
      </div>

      <div className={styles.currentUser}>
        <h3>👤 Usuario Actual:</h3>
        <div className={styles.userInfo}>
          {exampleUsers.find((user) => user.id === selectedUserId) && (
            <>
              <span className={styles.userName}>
                {exampleUsers.find((user) => user.id === selectedUserId).name}
              </span>
              <span className={styles.userRole}>
                {exampleUsers.find((user) => user.id === selectedUserId).role}
              </span>
              <span className={styles.userId}>ID: {selectedUserId}</span>
            </>
          )}
        </div>
      </div>

      {showModule && (
        <div className={styles.moduleContainer}>
          <div className={styles.moduleHeader}>
            <h2>📝 Módulo de Tareas y Calificaciones</h2>
            <p>
              Este módulo está integrado con el backend real y requiere
              autenticación.
            </p>
          </div>

          {/* Aquí se renderiza el módulo principal */}
          <AlumnoTareaYCalificaciones userId={selectedUserId} />
        </div>
      )}

      {!showModule && (
        <div className={styles.hiddenState}>
          <div className={styles.hiddenIcon}>📚</div>
          <h3>Módulo Oculto</h3>
          <p>Haz clic en "Mostrar Módulo" para ver el componente en acción.</p>
        </div>
      )}

      <div className={styles.features}>
        <h3>✨ Características Demostradas:</h3>
        <ul className={styles.featureList}>
          <li>
            🎯 <strong>Selector de Cursos</strong> - Vista de tarjetas
            interactivas
          </li>
          <li>
            📋 <strong>Gestión de Tareas</strong> - Acordeones expandibles con
            detalles
          </li>
          <li>
            📊 <strong>Sistema de Calificaciones</strong> - Vista detallada con
            retroalimentación
          </li>
          <li>
            📎 <strong>Subida de Archivos</strong> - Drag & drop con
            validaciones
          </li>
          <li>
            🔄 <strong>Estados en Tiempo Real</strong> - Loading, éxito, error
          </li>
          <li>
            📱 <strong>Responsive Design</strong> - Adaptable a móviles
          </li>
          <li>
            🎨 <strong>UX Moderna</strong> - Animaciones y transiciones suaves
          </li>
        </ul>
      </div>

      <div className={styles.apiInfo}>
        <h3>🔧 Información Técnica:</h3>
        <div className={styles.techDetails}>
          <div className={styles.techItem}>
            <strong>Props Requeridas:</strong>
            <code>userId (string)</code>
          </div>
          <div className={styles.techItem}>
            <strong>API Real:</strong>
            <code>
              /api/inscripciones/alumno, /api/calificaciones/:id, /api/entregas
            </code>
          </div>
          <div className={styles.techItem}>
            <strong>Autenticación:</strong>
            <code>JWT Bearer Token requerido</code>
          </div>
          <div className={styles.techItem}>
            <strong>Estados Internos:</strong>
            <code>cursosInscritos, tareas, calificaciones, loading</code>
          </div>
          <div className={styles.techItem}>
            <strong>Funcionalidades:</strong>
            <code>
              Carga real de cursos, Entregas de archivos, Calificaciones en vivo
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlumnoTareasExample;
